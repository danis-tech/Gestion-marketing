from rest_framework import serializers
from .models import Metric, DashboardWidget, Report, SystemHealth, MetricCategory


class MetricSerializer(serializers.ModelSerializer):
    """Serializer pour les métriques"""
    
    class Meta:
        model = Metric
        fields = [
            'id', 'name', 'description', 'category', 'metric_type',
            'value', 'unit', 'period_start', 'period_end', 'calculated_at',
            'metadata'
        ]
        read_only_fields = ['id', 'calculated_at']


class DashboardWidgetSerializer(serializers.ModelSerializer):
    """Serializer pour les widgets du tableau de bord"""
    
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = DashboardWidget
        fields = [
            'id', 'name', 'description', 'widget_type', 'config',
            'position_x', 'position_y', 'width', 'height',
            'is_active', 'is_public', 'created_at', 'updated_at',
            'created_by', 'created_by_name'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']


class ReportSerializer(serializers.ModelSerializer):
    """Serializer pour les rapports"""
    
    generated_by_name = serializers.CharField(source='generated_by.get_full_name', read_only=True)
    
    class Meta:
        model = Report
        fields = [
            'id', 'name', 'description', 'report_type', 'config', 'data',
            'file_path', 'generated_at', 'generated_by', 'generated_by_name',
            'period_start', 'period_end'
        ]
        read_only_fields = ['id', 'generated_at', 'generated_by']


class SystemHealthSerializer(serializers.ModelSerializer):
    """Serializer pour la santé du système"""
    
    class Meta:
        model = SystemHealth
        fields = [
            'id', 'timestamp', 'cpu_usage', 'memory_usage', 'disk_usage',
            'active_users', 'total_requests', 'error_rate',
            'db_connections', 'db_query_time', 'metadata'
        ]
        read_only_fields = ['id', 'timestamp']


class AnalyticsDataSerializer(serializers.Serializer):
    """Serializer pour les données d'analytiques complexes"""
    
    period_start = serializers.DateTimeField()
    period_end = serializers.DateTimeField()
    categories = serializers.ListField(
        child=serializers.ChoiceField(choices=MetricCategory.choices),
        required=False
    )
    group_by = serializers.ChoiceField(
        choices=['day', 'week', 'month', 'quarter', 'year'],
        default='day'
    )
