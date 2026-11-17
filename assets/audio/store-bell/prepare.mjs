/** Browser-side preparation; accepts the original MP3 bytes and returns a WAV. */
export async function prepareBell(source) {
  const context = new OfflineAudioContext(2, 1, 48000);
  const decoded = await context.decodeAudioData(source);
  const start = Math.round(0.7 * decoded.sampleRate);
  const frames = Math.round(1.95 * decoded.sampleRate);
  const channels = decoded.numberOfChannels;
  const bytes = new ArrayBuffer(44 + frames * channels * 2);
  const view = new DataView(bytes);
  const text = (offset, value) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };
  text(0, 'RIFF');
  view.setUint32(4, bytes.byteLength - 8, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, decoded.sampleRate, true);
  view.setUint32(28, decoded.sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, frames * channels * 2, true);
  for (let c = 0; c < channels; c++) {
    const samples = decoded.getChannelData(c);
    for (let i = 0; i < frames; i++) {
      const fade = Math.min(1, i / (0.005 * decoded.sampleRate), (frames - 1 - i) / (0.02 * decoded.sampleRate));
      const sample = Math.max(-1, Math.min(1, (samples[start + i] ?? 0) * fade));
      view.setInt16(44 + (i * channels + c) * 2, Math.round(sample * (sample < 0 ? 32768 : 32767)), true);
    }
  }
  return bytes;
}
