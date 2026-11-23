# backend/backend/urls.py

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from leads.views import CustomFieldViewSet, LeadFormSettingsView, LeadViewSet, ping
from contracts.views import ContractViewSet
from users.views import AgentViewSet
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# Router for API endpoints
router = DefaultRouter()
router.register(r'leads', LeadViewSet, basename='lead')
router.register(r'custom-fields', CustomFieldViewSet, basename='custom-field')
router.register(r'contracts', ContractViewSet, basename='contract')
router.register(r'agents', AgentViewSet, basename='agent')

# URL patterns
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/ping/', ping),
    path('api/lead-form-settings/', LeadFormSettingsView.as_view(), name='lead-form-settings'),
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# Serve uploaded contract PDFs in development only.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
