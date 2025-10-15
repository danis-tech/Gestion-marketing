from django.urls import path
from . import views

app_name = 'notifications'

urlpatterns = [
    # Types de notifications
    path('types/', views.NotificationTypeListView.as_view(), name='notification-types'),
    
    # Notifications
    path('', views.NotificationListView.as_view(), name='notification-list'),
    path('create/', views.NotificationCreateView.as_view(), name='notification-create'),
    path('<int:pk>/', views.NotificationDetailView.as_view(), name='notification-detail'),
    path('stats/', views.NotificationStatsView.as_view(), name='notification-stats'),
    path('mark-read/', views.NotificationMarkReadView.as_view(), name='notification-mark-read'),
    path('archive/', views.NotificationArchiveView.as_view(), name='notification-archive'),
    path('delete-bulk/', views.NotificationDeleteBulkView.as_view(), name='notification-delete-bulk'),
    path('unread-count/', views.notification_unread_count, name='notification-unread-count'),
    path('assigned-tasks/', views.get_assigned_tasks, name='assigned-tasks'),
    
    # Notifications générales et personnelles (admin)
    path('admin/general/', views.create_general_notification, name='create-general-notification'),
    path('admin/personal/', views.create_personal_notification, name='create-personal-notification'),
    path('admin/cleanup/', views.cleanup_old_notifications, name='cleanup-notifications'),
    
    # Chat
    path('chat/messages/', views.ChatMessageListView.as_view(), name='chat-messages'),
    path('chat/messages/<int:pk>/', views.ChatMessageDetailView.as_view(), name='chat-message-detail'),
    path('chat/online-users/', views.ChatOnlineUsersView.as_view(), name='chat-online-users'),
    
    # Préférences
    path('preferences/', views.NotificationPreferenceView.as_view(), name='notification-preferences'),
]
