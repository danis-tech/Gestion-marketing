// Utilitaires pour générer et jouer des sons
class SoundManager {
  constructor() {
    this.isEnabled = true;
    this.audioContext = null;
    this.initAudioContext();
  }

  initAudioContext() {
    try {
      // Créer le contexte audio
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext non supporté:', error);
      this.isEnabled = false;
    }
  }

  // Méthode générique pour jouer un son
  playSound(frequency, duration, type = 'sine', volume = 0.1) {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      // Réveiller le contexte audio si nécessaire
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configuration du son
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = type;

      // Enveloppe du son
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Erreur lors de la lecture du son:', error);
    }
  }

  // Son court et aigu pour l'envoi de message
  playMessageSentSound() {
    this.playSound(800, 0.15, 'sine', 0.1);
  }

  // Son plus doux pour la réception de message
  playMessageReceivedSound() {
    this.playSound(400, 0.3, 'sine', 0.08);
  }

  // Son de notification
  playNotificationSound() {
    this.playSound(600, 0.2, 'triangle', 0.12);
  }

  // Son de clic
  playClickSound() {
    this.playSound(1000, 0.1, 'square', 0.05);
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
const soundManager = new SoundManager();

export default soundManager;
