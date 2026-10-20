import { StockAudioTrack, ActiveAudioTrack } from '../types/audio';

/**
 * Generates an in-memory 16-bit PCM WAV audio Blob/URL.
 */
function createWavUrl(sampleRate: number, duration: number, sampleGenerator: (t: number) => number): string {
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true);  // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true);  // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // ByteRate (sampleRate * numChannels * bitsPerSample/8)
  view.setUint16(32, 2, true);  // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample (16-bit)

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let s = sampleGenerator(t);
    // Clamp to [-1, 1]
    s = Math.max(-1, Math.min(1, s));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// 1. Indian Village Morning Flute (Bansuri in Raag Bhoopali with Tanpura Drone)
export function generateFluteAudio(): string {
  const sampleRate = 22050;
  const duration = 15;
  // Pentatonic Bhoopali notes: Sa (261.63), Re (293.66), Ga (329.63), Pa (392.00), Dha (440.00), Sa' (523.25)
  const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 392.00, 329.63, 293.66, 261.63, 329.63, 392.00, 523.25, 440.00, 392.00, 261.63];

  return createWavUrl(sampleRate, duration, (t) => {
    // Tanpura Drone on Sa + Pa (low warm harmonics)
    const droneSa = Math.sin(2 * Math.PI * 130.81 * t) * 0.15;
    const dronePa = Math.sin(2 * Math.PI * 196.00 * t) * 0.12;
    const droneSub = Math.sin(2 * Math.PI * 65.41 * t) * 0.1;

    // Flute Melody note changes every 1.0 second
    const noteIdx = Math.floor(t % duration) % notes.length;
    const baseFreq = notes[noteIdx];
    // Gentle vibrato (5 Hz, +/- 3Hz)
    const vibrato = Math.sin(2 * Math.PI * 5.2 * t) * 3.5;
    const fluteFreq = baseFreq + vibrato;

    // Soft breathy flute harmonics
    const fundamental = Math.sin(2 * Math.PI * fluteFreq * t);
    const harmonic2 = Math.sin(2 * Math.PI * fluteFreq * 2 * t) * 0.25;
    const harmonic3 = Math.sin(2 * Math.PI * fluteFreq * 3 * t) * 0.1;

    // Note envelope (smooth attack and release)
    const noteProgress = t % 1.0;
    const env = Math.sin(Math.PI * Math.min(1, Math.max(0, noteProgress)));

    const flute = (fundamental + harmonic2 + harmonic3) * env * 0.35;
    return droneSa + dronePa + droneSub + flute;
  });
}

// 2. Story Suspense BGM (Deep resonant drone with mysterious minor bell chimes)
export function generateSuspenseAudio(): string {
  const sampleRate = 22050;
  const duration = 15;
  return createWavUrl(sampleRate, duration, (t) => {
    // Sub-bass rumble
    const bass = Math.sin(2 * Math.PI * 55 * t) * 0.22 + Math.sin(2 * Math.PI * 58 * t) * 0.18;
    // Suspense pulse
    const pulseEnv = Math.pow(Math.sin(Math.PI * (t % 1.5) / 1.5), 4);
    const pulse = Math.sin(2 * Math.PI * 110 * t) * pulseEnv * 0.25;
    // High tension bell every 3s
    const bellT = t % 3;
    const bellEnv = Math.exp(-bellT * 2.5);
    const bell = Math.sin(2 * Math.PI * 880 * t) * bellEnv * 0.15;
    return bass + pulse + bell;
  });
}

// 3. Happy Upbeat Acoustic (Bouncy guitar chords in G major)
export function generateAcousticAudio(): string {
  const sampleRate = 22050;
  const duration = 15;
  const chords = [
    [196.00, 246.94, 293.66, 392.00], // G
    [164.81, 246.94, 329.63, 392.00], // Em
    [174.61, 220.00, 261.63, 349.23], // C
    [146.83, 220.00, 293.66, 370.00], // D
  ];

  return createWavUrl(sampleRate, duration, (t) => {
    const chordIdx = Math.floor((t % 8) / 2) % chords.length;
    const chord = chords[chordIdx];
    const beat = t % 0.5;
    const strumEnv = Math.exp(-beat * 7);

    let strum = 0;
    chord.forEach((freq, i) => {
      const delay = i * 0.015;
      if (beat > delay) {
        strum += Math.sin(2 * Math.PI * freq * (beat - delay)) * Math.exp(-(beat - delay) * 6);
      }
    });

    // Light kick tap
    const kickEnv = Math.exp(-(t % 1.0) * 12);
    const kick = Math.sin(2 * Math.PI * 65 * t) * kickEnv * 0.3;

    return strum * strumEnv * 0.35 + kick;
  });
}

// 4. Traditional Dholak Rhythm (Folk dholak bass and treble beats)
export function generateDholakAudio(): string {
  const sampleRate = 22050;
  const duration = 15;

  return createWavUrl(sampleRate, duration, (t) => {
    const beat1 = t % 0.75;
    // Dholak Bass "Ghe" (sliding low pitch)
    const bassEnv = Math.exp(-beat1 * 8);
    const bassFreq = 80 + Math.exp(-beat1 * 15) * 45;
    const bass = Math.sin(2 * Math.PI * bassFreq * t) * bassEnv * 0.45;

    // Treble Slap "Ta / Tin" on eighth notes
    const beat2 = t % 0.25;
    const trebleEnv = Math.exp(-beat2 * 25);
    const trebleNoise = (Math.random() * 2 - 1) * 0.25;
    const trebleTone = Math.sin(2 * Math.PI * 520 * t) * 0.35;
    const treble = (trebleNoise + trebleTone) * trebleEnv * 0.3;

    return bass + treble;
  });
}

// 5. Footsteps SFX (Rhythmic walking steps)
export function generateFootstepsAudio(): string {
  const sampleRate = 22050;
  const duration = 15;
  return createWavUrl(sampleRate, duration, (t) => {
    const stepTime = t % 0.6;
    const env = Math.exp(-stepTime * 35);
    const crunch = (Math.random() * 2 - 1) * 0.35 + Math.sin(2 * Math.PI * 120 * t) * 0.2;
    return crunch * env * 0.4;
  });
}

// 6. Birds Chirping SFX (Sweet nature birds singing)
export function generateBirdChirpingAudio(): string {
  const sampleRate = 22050;
  const duration = 15;
  return createWavUrl(sampleRate, duration, (t) => {
    const loopT = t % 3.0;
    if (loopT < 1.4) {
      const chirpT = loopT % 0.3;
      const chirpFreq = 2200 + Math.sin(chirpT * 40) * 1100 + chirpT * 1800;
      const env = Math.sin(Math.PI * (chirpT / 0.3));
      return Math.sin(2 * Math.PI * chirpFreq * t) * env * 0.25;
    }
    // Wind background
    return (Math.random() * 2 - 1) * 0.02;
  });
}

// Stock Audio Catalog with Real AutoDraft MP3 Audio Files
export const AUTODRAFT_STOCK_AUDIO: StockAudioTrack[] = [
  {
    id: 'sfx_rooster_crow',
    name: 'Rooster Crow',
    duration: '0:03',
    durationSeconds: 3,
    category: 'Bird',
    type: 'sfx',
    url: '/assets/audio/sfx/Rooster_crow.mp3'
  },
  {
    id: 'sfx_chicks_peeping',
    name: 'Chicks Peeping',
    duration: '0:03',
    durationSeconds: 3,
    category: 'Bird',
    type: 'sfx',
    url: '/assets/audio/sfx/Chicks_peeping.mp3'
  },
  {
    id: 'sfx_crow_caw',
    name: 'Crow Caw',
    duration: '0:03',
    durationSeconds: 3,
    category: 'Bird',
    type: 'sfx',
    url: '/assets/audio/sfx/Crow_caw.mp3'
  },
  {
    id: 'sfx_pigeon_coo',
    name: 'Pigeon Coo',
    duration: '0:03',
    durationSeconds: 3,
    category: 'Bird',
    type: 'sfx',
    url: '/assets/audio/sfx/Pigeon_coo.mp3'
  },
  {
    id: 'sfx_parrot_squawk',
    name: 'Parrot Squawk',
    duration: '0:03',
    durationSeconds: 3,
    category: 'Bird',
    type: 'sfx',
    url: '/assets/audio/sfx/Parrot_squawk.mp3'
  },
  {
    id: 'sfx_footsteps_dirt',
    name: 'Footsteps Running on Dirt',
    duration: '0:04',
    durationSeconds: 4,
    category: 'Footstep',
    type: 'sfx',
    url: '/assets/audio/sfx/Footsteps_running_on_dirt.mp3'
  },
  {
    id: 'sfx_punch_cartoon',
    name: 'Punch Cartoon Spring',
    duration: '0:02',
    durationSeconds: 2,
    category: 'Impact',
    type: 'sfx',
    url: '/assets/audio/sfx/Punch_cartoon_spring.mp3'
  },
  {
    id: 'audio_flute_morning',
    name: 'Village Morning Raaga',
    duration: '01:59',
    durationSeconds: 120,
    category: 'Village',
    type: 'music',
    url: '/assets/audio/01 - Village Morning Raaga - V01.mp3'
  },
  {
    id: 'audio_suspense_story',
    name: 'The Weavers Secret',
    duration: '02:00',
    durationSeconds: 120,
    category: 'Suspense',
    type: 'music',
    url: '/assets/audio/02 - The Weavers Secret - V01.mp3'
  },
  {
    id: 'audio_happy_acoustic',
    name: 'Village Sunrise',
    duration: '01:59',
    durationSeconds: 120,
    category: 'Romantic',
    type: 'music',
    url: '/assets/audio/05 - Village Sunrise - V03.mp3'
  },
  {
    id: 'audio_dholak_rhythm',
    name: 'Village Festivity',
    duration: '01:59',
    durationSeconds: 120,
    category: 'Village',
    type: 'music',
    url: '/assets/audio/07 - Village Festivity - V01.mp3'
  }
];
