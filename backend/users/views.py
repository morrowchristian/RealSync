# users/views.py
import os
import secrets

from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Agent
from .serializers import AgentSerializer, RegistrationSerializer

TRIAL_EXPIRED_MESSAGE = "Your trial has expired and this account was deleted."


class AgentViewSet(viewsets.ModelViewSet):
    """User-account records. The Agent model IS the user model
    (AUTH_USER_MODEL = 'users.Agent'), so there is no "own agents"
    list in the multi-record sense — each agent is one account.

    Per-agent isolation, same pattern as Lead/Contract/Estimate:
    the queryset is only the requesting user, so list returns just
    self, and retrieve/update/delete on any other id 404s (DRF's
    get_object() looks up through get_queryset(), so a non-matching
    pk never leaks existence). Before this fix the queryset was
    Agent.objects.all(), so any signed-in user could list, read,
    edit, and delete every account.
    """
    serializer_class = AgentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Agent.objects.filter(pk=self.request.user.pk)

    def create(self, request, *args, **kwargs):
        # Account creation goes through public signup
        # (POST /api/register/) only. The agents endpoint must not
        # be a back door for creating accounts outside the trial
        # flow (RegistrationSerializer forces is_trial=True and
        # validates the password; this serializer would not).
        return Response(
            {'detail': 'Method "POST" not allowed. Use /api/register/ to create an account.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )


class RegisterView(APIView):
    """Public signup: POST /api/register/ {username, email, password}.

    Creates a trial Agent (is_trial=True) and returns JWT tokens so the
    frontend can log the user in immediately.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        data = AgentSerializer(user).data
        data['access'] = str(refresh.access_token)
        data['refresh'] = str(refresh)
        return Response(data, status=status.HTTP_201_CREATED)


class TrialTokenObtainPairView(TokenObtainPairView):
    """POST /api/token/ with lazy trial auto-delete.

    Authenticates first (bad credentials still get the normal 401).
    If the account is a trial and expired, the account is deleted
    (CASCADE removes its leads/contracts/custom fields/settings) and a
    plain trial-expired error is returned instead of tokens. Non-trial
    accounts are never deleted here.
    """

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.user
        if getattr(user, 'is_trial', False) and user.is_trial_expired:
            user.delete()
            return Response(
                {'detail': TRIAL_EXPIRED_MESSAGE},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class CleanupExpiredTrialsView(APIView):
    """POST /api/admin/cleanup-expired-trials/ — scheduled trial cleanup.

    AllowAny at the DRF level, but protected by a bearer token checked
    against the CLEANUP_TOKEN env var (never hardcoded). If the env var
    is unset, every call is refused with 403. Only trial accounts
    (is_trial=True) past their expiry are deleted; non-trial accounts
    are never touched.

    authentication_classes is empty on purpose: the Authorization
    header here carries the cleanup token, not a JWT, and the default
    JWTAuthentication would reject it with 401 before the view runs.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        expected = os.environ.get('CLEANUP_TOKEN', '')
        auth = request.META.get('HTTP_AUTHORIZATION', '')
        if not expected or not auth.startswith('Bearer ') \
                or not secrets.compare_digest(auth[7:], expected):
            return Response(
                {'detail': 'Forbidden.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        cutoff = timezone.now() - timedelta(days=settings.TRIAL_DAYS)
        expired = Agent.objects.filter(is_trial=True, date_joined__lt=cutoff)
        # Count first: QuerySet.delete() returns the total rows deleted
        # including CASCADE-deleted leads/contracts, but the response
        # reports trial accounts deleted.
        deleted_count = expired.count()
        expired.delete()
        return Response({'deleted': deleted_count}, status=status.HTTP_200_OK)
