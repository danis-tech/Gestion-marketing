// Système de sons basique et fonctionnel
class BasicSoundManager {
  constructor() {
    this.isEnabled = true;
  }

  // Son basique utilisant les API du navigateur
  playBasicSound() {
    if (!this.isEnabled) return;

    try {
      // Créer un contexte audio simple
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Réveiller le contexte si nécessaire
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Créer un oscillateur simple
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // Connecter les nœuds
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configuration du son
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;

      // Jouer le son
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.warn('Erreur lors de la lecture du son basique:', error);
    }
  }

  // Son d'envoi de message
  playMessageSentSound() {
    this.playBasicSound();
  }

  // Son de réception de message
  playMessageReceivedSound() {
    this.playBasicSound();
  }

  // Son de notification
  playNotificationSound() {
    this.playBasicSound();
  }

  // Son de clic
  playClickSound() {
    this.playBasicSound();
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
const basicSoundManager = new BasicSoundManager();

export default basicSoundManager;
