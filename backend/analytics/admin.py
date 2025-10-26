from django.contrib import admin
from .models import Metric, DashboardWidget, Report, SystemHealth


@admin.register(Metric)
class MetricAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'metric_type', 'value', 'unit', 'calculated_at']
    list_filter = ['category', 'metric_type', 'calculated_at']
    search_fields = ['name', 'description']
    readonly_fields = ['calculated_at']
    ordering = ['-calculated_at']


@admin.register(DashboardWidget)
class DashboardWidgetAdmin(admin.ModelAdmin):
    list_display = ['name', 'widget_type', 'is_active', 'is_public', 'created_by', 'created_at']
    list_filter = ['widget_type', 'is_active', 'is_public', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['name', 'report_type', 'generated_by', 'generated_at', 'period_start', 'period_end']
    list_filter = ['report_type', 'generated_at', 'period_start']
    search_fields = ['name', 'description']
    readonly_fields = ['generated_at']


@admin.register(SystemHealth)
class SystemHealthAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'cpu_usage', 'memory_usage', 'disk_usage', 'active_users', 'error_rate']
    list_filter = ['timestamp']
    readonly_fields = ['timestamp']
    ordering = ['-timestamp']
