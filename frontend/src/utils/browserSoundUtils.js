// Système de sons utilisant les sons du navigateur
class BrowserSoundManager {
  constructor() {
    this.isEnabled = true;
  }

  // Utiliser les sons système du navigateur
  playSystemSound() {
    if (!this.isEnabled) return;

    try {
      // Créer un son simple avec les API du navigateur
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Son simple et court
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.warn('Erreur lors de la lecture du son système:', error);
    }
  }

  // Son d'envoi de message
  playMessageSentSound() {
    this.playSystemSound();
  }

  // Son de réception de message
  playMessageReceivedSound() {
    this.playSystemSound();
  }

  // Son de notification
  playNotificationSound() {
    this.playSystemSound();
  }

  // Son de clic
  playClickSound() {
    this.playSystemSound();
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
const browserSoundManager = new BrowserSoundManager();

export default browserSoundManager;
