// Système de sons HTML5 simple et fonctionnel
class HTMLSoundManager {
  constructor() {
    this.isEnabled = true;
    this.sounds = {};
    this.initSounds();
  }

  initSounds() {
    try {
      // Créer des éléments audio pour les sons
      this.sounds.sent = this.createAudioElement(800, 0.15);
      this.sounds.received = this.createAudioElement(400, 0.3);
      this.sounds.notification = this.createAudioElement(600, 0.2);
    } catch (error) {
      console.warn('Erreur lors de l\'initialisation des sons HTML5:', error);
      this.isEnabled = false;
    }
  }

  createAudioElement(frequency, duration) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const numSamples = Math.floor(sampleRate * duration);
      const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
      const data = buffer.getChannelData(0);

      // Générer une onde sinusoïdale
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 3);
      }

      // Convertir en blob audio
      const audioBuffer = this.bufferToWav(buffer);
      const blob = new Blob([audioBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      return url;
    } catch (error) {
      console.warn('Erreur lors de la création de l\'élément audio:', error);
      return null;
    }
  }

  bufferToWav(buffer) {
    const length = buffer.length;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);
    
    // En-tête WAV
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 44100, true);
    view.setUint32(28, 88200, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Données audio
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
    
    return arrayBuffer;
  }

  playSound(soundUrl) {
    if (!this.isEnabled || !soundUrl) return;

    try {
      const audio = new Audio(soundUrl);
      audio.volume = 0.1;
      audio.play().catch(error => {
        console.warn('Erreur lors de la lecture du son:', error);
      });
    } catch (error) {
      console.warn('Erreur lors de la lecture du son HTML5:', error);
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
const htmlSoundManager = new HTMLSoundManager();

export default htmlSoundManager;

