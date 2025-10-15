// Système de sons robuste et fonctionnel
class RobustSoundManager {
  constructor() {
    this.isEnabled = true;
    this.audioContext = null;
    this.initAudioContext();
  }

  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext non supporté:', error);
      this.isEnabled = false;
    }
  }

  // Son robuste utilisant les API du navigateur
  playRobustSound() {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      // Réveiller le contexte si nécessaire
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      // Créer un oscillateur simple
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      // Connecter les nœuds
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configuration du son
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;

      // Jouer le son
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.1);
    } catch (error) {
      console.warn('Erreur lors de la lecture du son robuste:', error);
    }
  }

  // Son d'envoi de message
  playMessageSentSound() {
    this.playRobustSound();
  }

  // Son de réception de message
  playMessageReceivedSound() {
    this.playRobustSound();
  }

  // Son de notification
  playNotificationSound() {
    this.playRobustSound();
  }

  // Son de clic
  playClickSound() {
    this.playRobustSound();
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
const robustSoundManager = new RobustSoundManager();

export default robustSoundManager;
