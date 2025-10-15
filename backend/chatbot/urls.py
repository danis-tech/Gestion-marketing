# chatbot/urls.py
from django.urls import path
from .views import ChatbotView, ChatHistoryView, DeleteConversationView, ClearAllConversationsView

urlpatterns = [
    path("ask/", ChatbotView.as_view(), name="chatbot-ask"),
    path("history/", ChatHistoryView.as_view(), name="chatbot-history"),
    path("delete/", DeleteConversationView.as_view(), name="chatbot-delete"),
    path("clear-all/", ClearAllConversationsView.as_view(), name="chatbot-clear-all"),
]
