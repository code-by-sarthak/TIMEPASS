import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const outDir = path.join(process.cwd(), 'public', 'music');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Note frequencies in Hz
const NOTES: Record<string, number> = {
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 619.00, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
  'C6': 1046.50
};

interface SongSpec {
  id: string;
  filename: string;
  title: string;
  tempo: number; // BPM
  scale: string[];
  chords: string[][];
  melody: [string, number][]; // [noteName, durationInBeats]
  style: 'romantic_piano' | 'acoustic_guitar' | 'upbeat_lofi' | 'soulful_ballad';
}

const SONGS: SongSpec[] = [
  {
    id: 'tum_hi_ho',
    filename: 'tum_hi_ho.wav',
    title: 'Tum Hi Ho',
    tempo: 84,
    scale: ['G#4', 'F#4', 'E4', 'D#4', 'E4', 'F#4', 'G#4', 'B4'],
    chords: [['C#3', 'E3', 'G#3', 'C#4'], ['A2', 'C#3', 'E3', 'A3'], ['B2', 'D#3', 'F#3', 'B3'], ['G#2', 'C3', 'D#3', 'G#3']],
    melody: [
      ['G#4', 1], ['F#4', 0.5], ['E4', 0.5], ['D#4', 1], ['E4', 1],
      ['F#4', 1], ['G#4', 1], ['B4', 1.5], ['A4', 0.5],
      ['G#4', 1], ['F#4', 1], ['E4', 1.5], ['D#4', 0.5],
      ['E4', 2], ['D#4', 1], ['C#4', 1],
      ['C#4', 1], ['D#4', 1], ['E4', 1.5], ['F#4', 0.5],
      ['G#4', 2], ['F#4', 1], ['E4', 1],
      ['F#4', 1.5], ['E4', 0.5], ['D#4', 1], ['C#4', 1],
      ['C#4', 4]
    ],
    style: 'romantic_piano'
  },
  {
    id: 'kesariya',
    filename: 'kesariya.wav',
    title: 'Kesariya',
    tempo: 96,
    scale: ['D4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5'],
    chords: [['D3', 'F#3', 'A3', 'D4'], ['G2', 'B2', 'D3', 'G3'], ['B2', 'D3', 'F#3', 'B3'], ['A2', 'C#3', 'E3', 'A3']],
    melody: [
      ['F#4', 1], ['G4', 0.5], ['A4', 0.5], ['D5', 1.5], ['C#5', 0.5],
      ['B4', 1], ['A4', 1], ['F#4', 1], ['G4', 1],
      ['A4', 1.5], ['F#4', 0.5], ['E4', 1], ['D4', 1],
      ['E4', 2], ['F#4', 1], ['A4', 1],
      ['D5', 1.5], ['C#5', 0.5], ['B4', 1], ['A4', 1],
      ['B4', 1], ['C#5', 1], ['D5', 2],
      ['E5', 1], ['D5', 1], ['C#5', 1], ['B4', 1],
      ['A4', 4]
    ],
    style: 'acoustic_guitar'
  },
  {
    id: 'apna_bana_le',
    filename: 'apna_bana_le.wav',
    title: 'Apna Bana Le',
    tempo: 80,
    scale: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5'],
    chords: [['A2', 'C3', 'E3', 'A3'], ['F2', 'A2', 'C3', 'F3'], ['C3', 'E3', 'G3', 'C4'], ['G2', 'B2', 'D3', 'G3']],
    melody: [
      ['E4', 1], ['G4', 1], ['A4', 1.5], ['C5', 0.5],
      ['B4', 1], ['A4', 1], ['G4', 2],
      ['E4', 1], ['G4', 1], ['C5', 1.5], ['D5', 0.5],
      ['E5', 2], ['D5', 1], ['C5', 1],
      ['A4', 1.5], ['C5', 0.5], ['B4', 1], ['A4', 1],
      ['G4', 2], ['E4', 1], ['D4', 1],
      ['C4', 2], ['D4', 1], ['E4', 1],
      ['A3', 4]
    ],
    style: 'romantic_piano'
  },
  {
    id: 'chaleya',
    filename: 'chaleya.wav',
    title: 'Chaleya',
    tempo: 104,
    scale: ['A4', 'B4', 'C#5', 'D5', 'E5', 'F#5', 'A5'],
    chords: [['F#2', 'A2', 'C#3', 'F#3'], ['D3', 'F#3', 'A3', 'D4'], ['A2', 'C#3', 'E3', 'A3'], ['E3', 'G#3', 'B3', 'E4']],
    melody: [
      ['C#5', 0.5], ['C#5', 0.5], ['B4', 0.5], ['A4', 0.5], ['F#4', 1], ['A4', 1],
      ['B4', 1], ['C#5', 1], ['E5', 1.5], ['C#5', 0.5],
      ['B4', 1], ['A4', 1], ['F#4', 1.5], ['A4', 0.5],
      ['B4', 2], ['A4', 1], ['B4', 1],
      ['C#5', 1], ['E5', 1], ['F#5', 1.5], ['E5', 0.5],
      ['C#5', 1], ['B4', 1], ['A4', 2],
      ['B4', 1], ['C#5', 1], ['B4', 1], ['A4', 1],
      ['F#4', 4]
    ],
    style: 'upbeat_lofi'
  },
  {
    id: 'raataan_lambiyan',
    filename: 'raataan_lambiyan.wav',
    title: 'Raataan Lambiyan',
    tempo: 88,
    scale: ['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5'],
    chords: [['B2', 'D3', 'F#3', 'B3'], ['G2', 'B2', 'D3', 'G3'], ['D3', 'F#3', 'A3', 'D4'], ['A2', 'C#3', 'E3', 'A3']],
    melody: [
      ['F#4', 1], ['A4', 1], ['B4', 1.5], ['A4', 0.5],
      ['F#4', 1], ['E4', 1], ['D4', 2],
      ['F#4', 1], ['G4', 0.5], ['A4', 0.5], ['B4', 1.5], ['C#5', 0.5],
      ['D5', 2], ['C#5', 1], ['B4', 1],
      ['A4', 1.5], ['F#4', 0.5], ['E4', 1], ['D4', 1],
      ['E4', 2], ['F#4', 1], ['A4', 1],
      ['B4', 1.5], ['A4', 0.5], ['F#4', 1], ['E4', 1],
      ['D4', 4]
    ],
    style: 'soulful_ballad'
  },
  {
    id: 'gerua',
    filename: 'gerua.wav',
    title: 'Gerua',
    tempo: 86,
    scale: ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'],
    chords: [['G2', 'B2', 'D3', 'G3'], ['E2', 'G2', 'B2', 'E3'], ['C3', 'E3', 'G3', 'C4'], ['D3', 'F#3', 'A3', 'D4']],
    melody: [
      ['B4', 1], ['C5', 0.5], ['D5', 1], ['G5', 1.5],
      ['F#5', 1], ['E5', 1], ['D5', 2],
      ['C5', 1], ['B4', 1], ['A4', 1.5], ['G4', 0.5],
      ['A4', 2], ['B4', 1], ['C5', 1],
      ['D5', 1.5], ['B4', 0.5], ['G4', 1], ['A4', 1],
      ['B4', 2], ['C5', 1], ['D5', 1],
      ['E5', 1.5], ['D5', 0.5], ['C5', 1], ['B4', 1],
      ['A4', 4]
    ],
    style: 'soulful_ballad'
  },
  {
    id: 'heeriye',
    filename: 'heeriye.wav',
    title: 'Heeriye',
    tempo: 98,
    scale: ['E4', 'F#4', 'G#4', 'A4', 'B4', 'C#5', 'E5'],
    chords: [['E3', 'G#3', 'B3', 'E4'], ['C#3', 'E3', 'G#3', 'C#4'], ['A2', 'C#3', 'E3', 'A3'], ['B2', 'D#3', 'F#3', 'B3']],
    melody: [
      ['G#4', 1], ['B4', 1], ['C#5', 1.5], ['B4', 0.5],
      ['G#4', 1], ['F#4', 1], ['E4', 2],
      ['G#4', 1], ['A4', 0.5], ['B4', 1], ['C#5', 1.5],
      ['E5', 2], ['C#5', 1], ['B4', 1],
      ['G#4', 1.5], ['F#4', 0.5], ['E4', 1], ['F#4', 1],
      ['G#4', 2], ['B4', 1], ['C#5', 1],
      ['B4', 1.5], ['G#4', 0.5], ['F#4', 1], ['E4', 1],
      ['E4', 4]
    ],
    style: 'acoustic_guitar'
  },
  {
    id: 'channa_mereya',
    filename: 'channa_mereya.wav',
    title: 'Channa Mereya',
    tempo: 82,
    scale: ['D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'C5', 'D5'],
    chords: [['D2', 'F2', 'A2', 'D3'], ['Bb2', 'D3', 'F3', 'Bb3'], ['C3', 'E3', 'G3', 'C4'], ['A2', 'C#3', 'E3', 'A3']],
    melody: [
      ['A4', 1.5], ['G4', 0.5], ['F4', 1], ['E4', 1],
      ['F4', 2], ['D4', 2],
      ['F4', 1], ['G4', 1], ['A4', 1.5], ['C5', 0.5],
      ['Bb4', 1], ['A4', 1], ['G4', 2],
      ['A4', 1.5], ['Bb4', 0.5], ['C5', 1], ['D5', 1],
      ['C5', 1.5], ['Bb4', 0.5], ['A4', 1], ['G4', 1],
      ['F4', 1.5], ['E4', 0.5], ['D4', 1], ['C#4', 1],
      ['D4', 4]
    ],
    style: 'romantic_piano'
  },
  {
    id: 'tere_vaaste',
    filename: 'tere_vaaste.wav',
    title: 'Tere Vaaste',
    tempo: 102,
    scale: ['A4', 'B4', 'C#5', 'D5', 'E5', 'F#5', 'G#5', 'A5'],
    chords: [['A2', 'C#3', 'E3', 'A3'], ['F#2', 'A2', 'C#3', 'F#3'], ['D3', 'F#3', 'A3', 'D4'], ['E3', 'G#3', 'B3', 'E4']],
    melody: [
      ['C#5', 1], ['E5', 1], ['F#5', 1.5], ['E5', 0.5],
      ['C#5', 1], ['B4', 1], ['A4', 2],
      ['A4', 1], ['B4', 1], ['C#5', 1.5], ['E5', 0.5],
      ['F#5', 2], ['E5', 1], ['C#5', 1],
      ['B4', 1.5], ['A4', 0.5], ['F#4', 1], ['A4', 1],
      ['B4', 2], ['C#5', 1], ['B4', 1],
      ['A4', 1.5], ['F#4', 0.5], ['E4', 1], ['A4', 1],
      ['A4', 4]
    ],
    style: 'upbeat_lofi'
  },
  {
    id: 'dil_diyan_gallan',
    filename: 'dil_diyan_gallan.wav',
    title: 'Dil Diyan Gallan',
    tempo: 90,
    scale: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
    chords: [['C3', 'E3', 'G3', 'C4'], ['A2', 'C3', 'E3', 'A3'], ['F2', 'A2', 'C3', 'F3'], ['G2', 'B2', 'D3', 'G3']],
    melody: [
      ['E4', 1], ['G4', 1], ['C5', 1.5], ['B4', 0.5],
      ['A4', 1], ['G4', 1], ['E4', 2],
      ['F4', 1], ['A4', 1], ['C5', 1.5], ['D5', 0.5],
      ['C5', 2], ['B4', 1], ['A4', 1],
      ['G4', 1.5], ['E4', 0.5], ['D4', 1], ['C4', 1],
      ['D4', 2], ['E4', 1], ['F4', 1],
      ['G4', 1.5], ['F4', 0.5], ['E4', 1], ['D4', 1],
      ['C4', 4]
    ],
    style: 'acoustic_guitar'
  },
  {
    id: 'shayad',
    filename: 'shayad.wav',
    title: 'Shayad',
    tempo: 84,
    scale: ['E4', 'F#4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'],
    chords: [['E2', 'G2', 'B2', 'E3'], ['C3', 'E3', 'G3', 'C4'], ['G2', 'B2', 'D3', 'G3'], ['D3', 'F#3', 'A3', 'D4']],
    melody: [
      ['B4', 1], ['A4', 0.5], ['G4', 0.5], ['F#4', 1], ['G4', 1],
      ['A4', 1.5], ['B4', 0.5], ['G4', 2],
      ['E4', 1], ['G4', 1], ['B4', 1.5], ['C5', 0.5],
      ['B4', 2], ['A4', 1], ['G4', 1],
      ['F#4', 1.5], ['G4', 0.5], ['A4', 1], ['B4', 1],
      ['G4', 2], ['E4', 1], ['D4', 1],
      ['E4', 1.5], ['F#4', 0.5], ['G4', 1], ['F#4', 1],
      ['E4', 4]
    ],
    style: 'romantic_piano'
  },
  {
    id: 'pal_pal_dil_ke_paas',
    filename: 'pal_pal_dil_ke_paas.wav',
    title: 'Pal Pal Dil Ke Paas',
    tempo: 88,
    scale: ['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5'],
    chords: [['F2', 'A2', 'C3', 'F3'], ['D2', 'F2', 'A2', 'D3'], ['Bb2', 'D3', 'F3', 'Bb3'], ['C3', 'E3', 'G3', 'C4']],
    melody: [
      ['A4', 1], ['C5', 1], ['D5', 1.5], ['C5', 0.5],
      ['A4', 1], ['G4', 1], ['F4', 2],
      ['A4', 1], ['Bb4', 0.5], ['C5', 1], ['D5', 1.5],
      ['F5', 2], ['D5', 1], ['C5', 1],
      ['A4', 1.5], ['G4', 0.5], ['F4', 1], ['G4', 1],
      ['A4', 2], ['C5', 1], ['D5', 1],
      ['C5', 1.5], ['A4', 0.5], ['G4', 1], ['F4', 1],
      ['F4', 4]
    ],
    style: 'romantic_piano'
  }
];

function generateSong(song: SongSpec, durationSeconds: number): Buffer {
  const sampleRate = 44100;
  const numChannels = 2;
  const bytesPerSample = 2;
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = totalSamples * numChannels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28);
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  const secondsPerBeat = 60 / song.tempo;
  const totalMelodyBeats = song.melody.reduce((sum, item) => sum + item[1], 0);
  const melodyDuration = totalMelodyBeats * secondsPerBeat;

  // Pre-calculate cumulative beat offsets for melody
  const melodyEvents: { note: string; freq: number; startBeat: number; durBeats: number }[] = [];
  let curBeat = 0;
  for (const [note, dur] of song.melody) {
    melodyEvents.push({
      note,
      freq: NOTES[note] || 440,
      startBeat: curBeat,
      durBeats: dur
    });
    curBeat += dur;
  }

  // Pre-calculate chords
  const chordDurationBeats = 4; // 1 measure per chord
  const chordDurationSeconds = chordDurationBeats * secondsPerBeat;

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const songBeat = (t / secondsPerBeat);

    // Loop through the melody
    const loopedBeat = songBeat % totalMelodyBeats;

    // Find active melody note
    let melVal = 0;
    for (const event of melodyEvents) {
      if (loopedBeat >= event.startBeat && loopedBeat < event.startBeat + event.durBeats) {
        const noteProgress = (loopedBeat - event.startBeat) * secondsPerBeat; // in seconds
        const noteTotalSec = event.durBeats * secondsPerBeat;
        
        // ADSR envelope
        let env = 0;
        const attack = 0.02;
        const release = 0.08;
        if (noteProgress < attack) {
          env = noteProgress / attack;
        } else if (noteProgress < noteTotalSec - release) {
          env = 1.0 - 0.25 * ((noteProgress - attack) / noteTotalSec);
        } else {
          env = Math.max(0, 0.75 * (1 - (noteProgress - (noteTotalSec - release)) / release));
        }

        const f = event.freq;
        // Rich instrument harmonics
        if (song.style === 'romantic_piano') {
          // Warm piano
          const pianoTone = Math.sin(2 * Math.PI * f * t) * 0.45 +
                            Math.sin(2 * Math.PI * (f * 2) * t) * 0.2 +
                            Math.sin(2 * Math.PI * (f * 3) * t) * 0.08 +
                            Math.sin(2 * Math.PI * (f * 0.5) * t) * 0.1;
          melVal = pianoTone * env;
        } else if (song.style === 'acoustic_guitar') {
          // Plucked acoustic string
          const pluckEnv = Math.exp(-noteProgress * 4.5);
          const guitarTone = Math.sin(2 * Math.PI * f * t) * 0.5 +
                             Math.sin(2 * Math.PI * (f * 2.01) * t) * 0.25 +
                             Math.sin(2 * Math.PI * (f * 3) * t) * 0.1;
          melVal = guitarTone * pluckEnv;
        } else if (song.style === 'upbeat_lofi') {
          // Bouncy warm synth
          const synthTone = (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 2 * t)) * 0.45;
          melVal = synthTone * env;
        } else {
          // Soulful violin / flute
          const violinTone = Math.sin(2 * Math.PI * f * t) * 0.4 +
                             Math.sin(2 * Math.PI * (f * 2) * t) * 0.25 +
                             Math.sin(2 * Math.PI * (f * 3) * t) * 0.15;
          melVal = violinTone * env;
        }
        break;
      }
    }

    // Active chord backing
    const chordIdx = Math.floor(t / chordDurationSeconds) % song.chords.length;
    const currentChord = song.chords[chordIdx];
    let padVal = 0;
    for (const noteName of currentChord) {
      const f = NOTES[noteName] || 220;
      padVal += Math.sin(2 * Math.PI * f * t) * 0.06;
    }

    // Bassline (root of chord)
    const rootNote = currentChord[0];
    const bassFreq = (NOTES[rootNote] || 110) * 0.5;
    const bassEnv = Math.exp(-((songBeat % 2) * secondsPerBeat) * 2.5);
    const bassVal = Math.sin(2 * Math.PI * bassFreq * t) * 0.22 * bassEnv;

    // Drum rhythm pulse (kick on beat 0 and 2, gentle acoustic percussion on beat 1 and 3)
    const beatFraction = songBeat % 1;
    const beatIndex = Math.floor(songBeat) % 4;
    let drumVal = 0;
    if (beatIndex === 0 || beatIndex === 2) {
      // Soft kick drum
      const kickEnv = Math.exp(-beatFraction * 14);
      drumVal += Math.sin(2 * Math.PI * 60 * t) * 0.25 * kickEnv;
    }
    // Subtle hi-hat / shaker pulse
    const hatEnv = Math.exp(-beatFraction * 20);
    const noise = (Math.sin(t * 12345.67) * 43758.5453 % 1) - 0.5;
    drumVal += noise * 0.05 * hatEnv;

    // Stereo mix
    const master = (melVal * 0.65 + padVal * 0.45 + bassVal * 0.35 + drumVal * 0.3) * 0.9;
    
    // Smooth fade in (0-1.5s) and fade out (last 2s)
    let masterGain = 1.0;
    if (t < 1.5) masterGain = t / 1.5;
    if (t > durationSeconds - 2.0) masterGain = Math.max(0, (durationSeconds - t) / 2.0);

    for (let ch = 0; ch < numChannels; ch++) {
      // Gentle stereo widening: left has slightly more melody, right slightly more pad
      const pan = ch === 0 ? (melVal * 0.05 - padVal * 0.03) : (-melVal * 0.05 + padVal * 0.03);
      let sample = (master + pan) * masterGain;
      sample = Math.max(-1, Math.min(1, sample));
      const intSample = Math.floor(sample * 32767);
      buffer.writeInt16LE(intSample, offset);
      offset += 2;
    }
  }

  return buffer;
}

// Generate all 12 songs (each 75 seconds for seamless, rich continuous playback)
console.log('🎶 Generating 12 Bollywood Hit Audio Mastertracks...');
const ffmpegPath = 'ffmpeg';

for (const song of SONGS) {
  const wavPath = path.join(outDir, song.filename);
  const mp3Filename = song.filename.replace('.wav', '.mp3');
  const mp3Path = path.join(outDir, mp3Filename);

  console.log(`⏳ Composing ${song.title} (${song.style}, ${song.tempo} BPM)...`);
  const wavBuffer = generateSong(song, 75); // 75 seconds per track
  fs.writeFileSync(wavPath, wavBuffer);

  // Convert to highly optimized MP3 via ffmpeg
  try {
    execSync(`"${ffmpegPath}" -y -i "${wavPath}" -codec:a libmp3lame -b:a 128k "${mp3Path}"`, { stdio: 'ignore' });
    console.log(`  ✅ Generated: ${mp3Filename} (128kbps stereo MP3)`);
  } catch (err) {
    console.warn(`  ⚠️ ffmpeg conversion failed for ${song.title}, retaining WAV`);
  }
}

console.log('🎉 All 12 Bollywood Tracks Generated Successfully in public/music/!');
