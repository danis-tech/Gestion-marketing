from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MetricViewSet, DashboardWidgetViewSet, ReportViewSet, SystemHealthViewSet, AnalyticsViewSet

router = DefaultRouter()
router.register(r'metrics', MetricViewSet, basename='metric')
router.register(r'widgets', DashboardWidgetViewSet, basename='widget')
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'health', SystemHealthViewSet, basename='health')
router.register(r'analytics', AnalyticsViewSet, basename='analytics')

urlpatterns = [
    path('', include(router.urls)),
]
