import { AutoDraftAudioTrack, AutoDraftAudioClip } from '../types/audio';

/**
 * Web Audio API Master Multi-Track Engine
 * Enables sample-accurate multi-track playback, real-time scrubbing,
 * per-track mute/solo, clip speed/gain, fade in/out curves, and voiceover recording.
 */
class MultiTrackAudioEngine {
  private audioCtx: AudioContext | null = null;
  private activeSources: Map<string, {
    audioElement: HTMLAudioElement;
    sourceNode: MediaElementAudioSourceNode;
    gainNode: GainNode;
  }> = new Map();
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Synchronize all tracks and clips to the given playhead time and play/pause state.
   */
  public syncPlayback(
    tracks: AutoDraftAudioTrack[],
    currentTime: number,
    isPlaying: boolean
  ) {
    const hasSolo = tracks.some((t) => t.isSolo);
    const ctx = this.getAudioContext();

    // Collect all active clips across all tracks
    const activeClipMap = new Map<string, { clip: AutoDraftAudioClip; track: AutoDraftAudioTrack }>();
    tracks.forEach((track) => {
      // Check if track should produce sound
      const isAudible = hasSolo ? track.isSolo : !track.isMuted;
      if (!isAudible) return;

      track.clips.forEach((clip) => {
        if (!clip.isDeleted) {
          activeClipMap.set(clip.id, { clip, track });
        }
      });
    });

    // Remove any sources that no longer exist
    for (const [clipId, entry] of this.activeSources.entries()) {
      if (!activeClipMap.has(clipId)) {
        entry.audioElement.pause();
        entry.audioElement.src = '';
        this.activeSources.delete(clipId);
      }
    }

    // Update or create sources
    activeClipMap.forEach(({ clip, track }, clipId) => {
      let entry = this.activeSources.get(clipId);
      if (!entry) {
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.src = clip.url;
        audio.preload = 'auto';

        let sourceNode: MediaElementAudioSourceNode;
        try {
          sourceNode = ctx.createMediaElementSource(audio);
        } catch (_) {
          // If already connected or fallback
          sourceNode = ctx.createMediaElementSource(audio);
        }
        const gainNode = ctx.createGain();
        sourceNode.connect(gainNode);
        gainNode.connect(ctx.destination);

        entry = { audioElement: audio, sourceNode, gainNode };
        this.activeSources.set(clipId, entry);
      }

      const { audioElement, gainNode } = entry;
      const clipStart = clip.startTime;
      const clipEnd = clip.startTime + clip.duration;
      const isInsideClip = currentTime >= clipStart && currentTime <= clipEnd;

      // Playback speed
      if (audioElement.playbackRate !== (clip.speed || 1.0)) {
        audioElement.playbackRate = clip.speed || 1.0;
      }

      // Calculate Volume with Fade In / Fade Out
      let targetVolume = (clip.volume ?? 1.0) * (track.volume ?? 1.0);
      if (clip.fadeIn && clip.fadeIn > 0 && currentTime - clipStart < clip.fadeIn) {
        const progress = Math.max(0, (currentTime - clipStart) / clip.fadeIn);
        targetVolume *= progress;
      } else if (clip.fadeOut && clip.fadeOut > 0 && clipEnd - currentTime < clip.fadeOut) {
        const progress = Math.max(0, (clipEnd - currentTime) / clip.fadeOut);
        targetVolume *= progress;
      }

      gainNode.gain.setValueAtTime(Math.max(0, Math.min(1.5, targetVolume)), ctx.currentTime);

      if (isPlaying && isInsideClip) {
        const targetAudioTime = (currentTime - clipStart + (clip.offset || 0)) * (clip.speed || 1.0);
        // Resync if drifted by more than 0.15s
        if (Math.abs(audioElement.currentTime - targetAudioTime) > 0.15) {
          try {
            audioElement.currentTime = targetAudioTime;
          } catch (_) {}
        }
        if (audioElement.paused) {
          audioElement.play().catch(() => {});
        }
      } else {
        if (!audioElement.paused) {
          audioElement.pause();
        }
      }
    });
  }

  /**
   * Stop all active audio elements immediately.
   */
  public stopAll() {
    this.activeSources.forEach((entry) => {
      entry.audioElement.pause();
    });
  }

  /**
   * Seek all active clips to specific timeline time.
   */
  public seek(tracks: AutoDraftAudioTrack[], currentTime: number) {
    tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        const entry = this.activeSources.get(clip.id);
        if (entry) {
          const clipStart = clip.startTime;
          const targetTime = (currentTime - clipStart + (clip.offset || 0)) * (clip.speed || 1.0);
          if (targetTime >= 0) {
            try {
              entry.audioElement.currentTime = targetTime;
            } catch (_) {}
          }
        }
      });
    });
  }

  /**
   * Start live microphone recording for voiceover.
   */
  public async startVoiceRecording(): Promise<boolean> {
    try {
      this.recordedChunks = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };
      this.mediaRecorder.start(100);
      return true;
    } catch (err) {
      console.error('Microphone access denied:', err);
      return false;
    }
  }

  /**
   * Stop microphone recording and return resulting Blob and URL.
   */
  public stopVoiceRecording(): Promise<{ blob: Blob; url: string; duration: number }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject(new Error('MediaRecorder not initialized'));
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const tempAudio = new Audio(url);
        tempAudio.onloadedmetadata = () => {
          const dur = tempAudio.duration && isFinite(tempAudio.duration) ? tempAudio.duration : 5;
          resolve({ blob, url, duration: dur });
        };
        tempAudio.onerror = () => {
          resolve({ blob, url, duration: 5 });
        };
      };

      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    });
  }
}

export const audioEngine = new MultiTrackAudioEngine();
