from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from leads.views import LeadViewSet, ping
from contracts.views import ContractViewSet
from users.views import AgentViewSet

# Router for API endpoints
router = DefaultRouter()
router.register(r'leads', LeadViewSet)
router.register(r'contracts', ContractViewSet)
router.register(r'agents', AgentViewSet)

# URL patterns
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/ping/', ping),
    path('api/', include(router.urls)),
]