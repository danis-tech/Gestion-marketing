// Système de sons ultra-simple utilisant les notifications du navigateur
class NotificationSoundManager {
  constructor() {
    this.isEnabled = true;
  }

  // Son simple utilisant les API du navigateur
  playSimpleSound() {
    if (!this.isEnabled) return;

    try {
      // Méthode 1: Utiliser les sons système
      if (typeof window !== 'undefined' && window.AudioContext) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.1;

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
      }
    } catch (error) {
      console.warn('Erreur lors de la lecture du son:', error);
    }
  }

  // Son d'envoi de message
  playMessageSentSound() {
    this.playSimpleSound();
  }

  // Son de réception de message
  playMessageReceivedSound() {
    this.playSimpleSound();
  }

  // Son de notification
  playNotificationSound() {
    this.playSimpleSound();
  }

  // Son de clic
  playClickSound() {
    this.playSimpleSound();
  }

  // Activer/désactiver les sons
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  // Vérifier si les sons sont activés
  isSoundEnabled() {
    return this.isEnabled;
  }
}

// Instance singleton
const notificationSoundManager = new NotificationSoundManager();

export default notificationSoundManager;

