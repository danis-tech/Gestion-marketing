// Système de sons simple et fonctionnel
class SimpleSoundManager {
  constructor() {
    this.isEnabled = true;
    this.sounds = {
      sent: null,
      received: null,
      notification: null
    };
    this.initSounds();
  }

  initSounds() {
    try {
      // Créer des sons simples avec des données audio
      this.sounds.sent = this.createBeepSound(800, 0.15);
      this.sounds.received = this.createBeepSound(400, 0.3);
      this.sounds.notification = this.createBeepSound(600, 0.2);
    } catch (error) {
      console.warn('Erreur lors de l\'initialisation des sons:', error);
      this.isEnabled = false;
    }
  }

  createBeepSound(frequency, duration) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const numSamples = Math.floor(sampleRate * duration);
      const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 3);
      }

      return buffer;
    } catch (error) {
      console.warn('Erreur lors de la création du son:', error);
      return null;
    }
  }

  playSound(buffer) {
    if (!this.isEnabled || !buffer) return;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      
      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      gainNode.gain.value = 0.1;
      
      source.start();
    } catch (error) {
      console.warn('Erreur lors de la lecture du son:', error);
    }
  }

  // Son d'envoi de message
  playMessageSentSound() {
    this.playSound(this.sounds.sent);
  }

  // Son de réception de message
  playMessageReceivedSound() {
    this.playSound(this.sounds.received);
  }

  // Son de notification
  playNotificationSound() {
    this.playSound(this.sounds.notification);
  }

  // Son de clic
  playClickSound() {
    this.playSound(this.sounds.notification);
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
const simpleSoundManager = new SimpleSoundManager();

export default simpleSoundManager;
