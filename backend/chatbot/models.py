from django.db import models
from django.conf import settings
from django.utils import timezone

class Conversation(models.Model):
    """Modèle pour stocker les conversations avec le chatbot"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    session_id = models.CharField(max_length=100, help_text="ID de session pour les utilisateurs non connectés")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Conversation {self.id} - {self.user or self.session_id}"

class Message(models.Model):
    """Modèle pour stocker les messages individuels"""
    SENDER_CHOICES = [
        ('user', 'Utilisateur'),
        ('bot', 'Bot'),
    ]
    
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    content = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)
    
    # Données NLP optionnelles
    spacy_tokens = models.JSONField(null=True, blank=True)
    spacy_entities = models.JSONField(null=True, blank=True)
    deepseek_used = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.sender}: {self.content[:50]}..."
