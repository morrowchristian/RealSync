# backend/backend/urls.py

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from leads.views import CustomFieldViewSet, DemoView, FollowUpViewSet, LeadFormSettingsView, LeadViewSet, ping
from contracts.views import ContractViewSet, EstimateViewSet
from users.views import (
    AgentViewSet,
    CleanupExpiredTrialsView,
    RegisterView,
    TrialTokenObtainPairView,
)
from rest_framework_simplejwt.views import TokenRefreshView

# Router for API endpoints
router = DefaultRouter()
router.register(r'leads', LeadViewSet, basename='lead')
router.register(r'custom-fields', CustomFieldViewSet, basename='custom-field')
router.register(r'follow-ups', FollowUpViewSet, basename='follow-up')
router.register(r'contracts', ContractViewSet, basename='contract')
router.register(r'estimates', EstimateViewSet, basename='estimate')
router.register(r'agents', AgentViewSet, basename='agent')

# URL patterns
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/ping/', ping),
    path('api/demo/', DemoView.as_view(), name='demo'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/admin/cleanup-expired-trials/', CleanupExpiredTrialsView.as_view(),
         name='cleanup-expired-trials'),
    path('api/lead-form-settings/', LeadFormSettingsView.as_view(), name='lead-form-settings'),
    path('api/', include(router.urls)),
    path('api/token/', TrialTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# Serve uploaded contract PDFs in development only.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
