import fs from 'fs';
import path from 'path';

// Generate 16-bit stereo PCM WAV file
function createWavBuffer(sampleRate: number, durationSeconds: number, generateSample: (t: number, channel: number) => number): Buffer {
  const numChannels = 2;
  const bytesPerSample = 2; // 16-bit
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = totalSamples * numChannels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF Chunk Descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28); // ByteRate
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32); // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Fill PCM samples
  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;

    for (let ch = 0; ch < numChannels; ch++) {
      let sample = generateSample(t, ch);
      sample = Math.max(-1, Math.min(1, sample)); // Clamp
      const intSample = Math.floor(sample * 32767);
      buffer.writeInt16LE(intSample, offset);
      offset += 2;
    }
  }

  return buffer;
}

// Ensure public/music directory exists
const outDir = path.join(process.cwd(), 'public', 'music');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('🎵 Generating Bollywood Romantic Audio Tracks in public/music/ ...');

// Track 1: Kesariya Style (Warm Romantic Acoustic Strings)
const kesariyaNotes = [440, 493.88, 554.37, 659.25, 554.37, 493.88, 440, 369.99];
const track1 = createWavBuffer(44100, 30, (t, ch) => {
  const beat = (t * 1.4) % kesariyaNotes.length;
  const noteIdx = Math.floor(beat);
  const noteProgress = beat - noteIdx;
  const freq = kesariyaNotes[noteIdx];

  // Gentle plucked string with decay
  const env = Math.exp(-noteProgress * 4);
  const tone = Math.sin(2 * Math.PI * freq * t) * 0.4 +
               Math.sin(2 * Math.PI * (freq * 2) * t) * 0.15 +
               Math.sin(2 * Math.PI * (freq * 0.5) * t) * 0.2;

  // Background warm pad chord
  const pad = (Math.sin(2 * Math.PI * 220 * t) + Math.sin(2 * Math.PI * 277.18 * t) + Math.sin(2 * Math.PI * 329.63 * t)) * 0.12;

  // Soft rhythm pulse
  const drumPulse = Math.exp(-((t * 2.8) % 1) * 8) * 0.15;

  return (tone * env + pad + drumPulse) * 0.6;
});
fs.writeFileSync(path.join(outDir, 'kesariya.wav'), track1);
console.log('✅ Generated kesariya.wav (30s)');

// Track 2: Apna Bana Le Style (Gentle Piano & Ambient Violin)
const apnaNotes = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 392];
const track2 = createWavBuffer(44100, 30, (t, ch) => {
  const beat = (t * 1.3) % apnaNotes.length;
  const noteIdx = Math.floor(beat);
  const noteProgress = beat - noteIdx;
  const freq = apnaNotes[noteIdx];

  const env = Math.exp(-noteProgress * 3);
  const piano = Math.sin(2 * Math.PI * freq * t) * 0.45 +
                Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.1;

  // Warm cello bass
  const bass = Math.sin(2 * Math.PI * (freq * 0.25) * t) * 0.25;

  return (piano * env + bass) * 0.6;
});
fs.writeFileSync(path.join(outDir, 'apna_bana_le.wav'), track2);
console.log('✅ Generated apna_bana_le.wav (30s)');

// Track 3: Chaleya Style (Trending Lo-Fi Romantic Beat)
const chaleyaNotes = [659.25, 783.99, 880, 987.77, 880, 783.99, 659.25, 587.33];
const track3 = createWavBuffer(44100, 30, (t, ch) => {
  const beat = (t * 1.6) % chaleyaNotes.length;
  const noteIdx = Math.floor(beat);
  const noteProgress = beat - noteIdx;
  const freq = chaleyaNotes[noteIdx];

  const env = Math.exp(-noteProgress * 5);
  const synth = (Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(2 * Math.PI * freq * 3 * t)) * 0.4;

  // Upbeat Lo-Fi Kick & Snare
  const kick = Math.exp(-((t * 1.6) % 1) * 12) * Math.sin(2 * Math.PI * 65 * t) * 0.3;

  return (synth * env + kick) * 0.65;
});
fs.writeFileSync(path.join(outDir, 'chaleya.wav'), track3);
console.log('✅ Generated chaleya.wav (30s)');

// Track 4: Raataan Lambiyan (Soulful Acoustic Night)
const raataanNotes = [587.33, 659.25, 698.46, 880, 698.46, 587.33, 523.25, 440];
const track4 = createWavBuffer(44100, 30, (t, ch) => {
  const beat = (t * 1.35) % raataanNotes.length;
  const noteIdx = Math.floor(beat);
  const noteProgress = beat - noteIdx;
  const freq = raataanNotes[noteIdx];

  const env = Math.exp(-noteProgress * 3.5);
  const guitar = (Math.sin(2 * Math.PI * freq * t) + 0.2 * Math.sin(2 * Math.PI * freq * 2 * t)) * 0.45;
  const pad = Math.sin(2 * Math.PI * 293.66 * t) * 0.15;

  return (guitar * env + pad) * 0.6;
});
fs.writeFileSync(path.join(outDir, 'raataan_lambiyan.wav'), track4);
console.log('✅ Generated raataan_lambiyan.wav (30s)');

// Track 5: Tum Hi Ho (Classic Romantic Piano Melody)
const tumHiHoNotes = [440, 523.25, 659.25, 587.33, 523.25, 440, 392, 440];
const track5 = createWavBuffer(44100, 30, (t, ch) => {
  const beat = (t * 1.25) % tumHiHoNotes.length;
  const noteIdx = Math.floor(beat);
  const noteProgress = beat - noteIdx;
  const freq = tumHiHoNotes[noteIdx];

  const env = Math.exp(-noteProgress * 2.8);
  const melody = Math.sin(2 * Math.PI * freq * t) * 0.5;
  const sub = Math.sin(2 * Math.PI * 110 * t) * 0.2;

  return (melody * env + sub) * 0.6;
});
fs.writeFileSync(path.join(outDir, 'tum_hi_ho.wav'), track5);
console.log('✅ Generated tum_hi_ho.wav (30s)');

console.log('🎉 All 5 Bollywood Romantic Audio Tracks generated successfully!');
