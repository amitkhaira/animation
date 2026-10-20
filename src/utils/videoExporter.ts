import { ActiveAudioTrack } from '../types/audio';

export interface ExportVideoOptions {
  width: number;           // 1920 or 1280
  height: number;          // 1080 or 720
  fps: number;             // 30 or 60
  durationSeconds: number; // 15
  audioTracks: ActiveAudioTrack[];
  includeAudio: boolean;
  onProgress?: (progressPercent: number, currentSeconds: number) => void;
  onStatusChange?: (status: string) => void;
  onExportSeek?: (currentSeconds: number) => void;
}

/**
 * Draws an image with object-fit: cover scaling onto a 2D canvas context.
 */
function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | HTMLVideoElement,
  canvasWidth: number,
  canvasHeight: number
) {
  const natW = img instanceof HTMLImageElement ? img.naturalWidth : (img as HTMLVideoElement).videoWidth;
  const natH = img instanceof HTMLImageElement ? img.naturalHeight : (img as HTMLVideoElement).videoHeight;

  if (!natW || !natH) return;

  const imgRatio = natW / natH;
  const canvasRatio = canvasWidth / canvasHeight;

  let renderWidth = canvasWidth;
  let renderHeight = canvasHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (imgRatio > canvasRatio) {
    renderWidth = canvasHeight * imgRatio;
    offsetX = (canvasWidth - renderWidth) / 2;
  } else {
    renderHeight = canvasWidth / imgRatio;
    offsetY = (canvasHeight - renderHeight) / 2;
  }

  ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
}

export class VideoExporter {
  private isCancelled = false;

  public cancel() {
    this.isCancelled = true;
  }

  public async exportVideo(options: ExportVideoOptions): Promise<{ blob: Blob; downloadUrl: string; filename: string }> {
    this.isCancelled = false;
    options.onStatusChange?.('Initializing 1080p export canvas & audio stream...');

    const stageEl = document.getElementById('autodraft-canvas-stage');
    if (!stageEl) {
      throw new Error('Stage element #autodraft-canvas-stage not found in DOM.');
    }

    // 1. Offscreen Composite Canvas
    const canvas = document.createElement('canvas');
    canvas.width = options.width;
    canvas.height = options.height;
    const ctx = canvas.getContext('2d', { alpha: false })!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 2. Audio Context & Mixer Setup
    let audioContext: AudioContext | null = null;
    let audioDestination: MediaStreamAudioDestinationNode | null = null;
    const audioElementsToCleanup: HTMLAudioElement[] = [];

    if (options.includeAudio && options.audioTracks.length > 0) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioContext = new AudioContextClass();
          if (audioContext.state === 'suspended') {
            await audioContext.resume().catch(() => {});
          }
          audioDestination = audioContext.createMediaStreamDestination();

          for (const track of options.audioTracks) {
            if (track.isMuted || !track.url) continue;
            const audioEl = new Audio(track.url);
            audioEl.crossOrigin = 'anonymous';
            audioElementsToCleanup.push(audioEl);

            const source = audioContext.createMediaElementSource(audioEl);
            const gainNode = audioContext.createGain();
            gainNode.gain.value = track.volume;
            source.connect(gainNode);
            gainNode.connect(audioDestination);
          }
        }
      } catch (err) {
        console.warn('Could not initialize audio stream for export:', err);
      }
    }

    // 3. Combined MediaStream
    const videoStream = canvas.captureStream(options.fps);
    const streamTracks = [...videoStream.getVideoTracks()];
    if (audioDestination && audioDestination.stream.getAudioTracks().length > 0) {
      streamTracks.push(...audioDestination.stream.getAudioTracks());
    }
    const combinedStream = new MediaStream(streamTracks);

    // 4. Select Best Supported MimeType
    let mimeType = 'video/webm;codecs=vp9,opus';
    let fileExt = 'webm';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        mimeType = 'video/webm;codecs=vp8,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
        fileExt = 'mp4';
      } else {
        mimeType = '';
      }
    }

    const recordedChunks: Blob[] = [];
    const recorder = mimeType ? new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond: 8000000 }) : new MediaRecorder(combinedStream);

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    return new Promise((resolve, reject) => {
      recorder.onstop = () => {
        // Cleanup audio elements and context
        audioElementsToCleanup.forEach((a) => {
          a.pause();
          a.src = '';
        });
        if (audioContext && audioContext.state !== 'closed') {
          audioContext.close().catch(() => {});
        }

        if (this.isCancelled) {
          reject(new Error('Export was cancelled by user.'));
          return;
        }

        const finalBlob = new Blob(recordedChunks, { type: mimeType || 'video/webm' });
        const downloadUrl = URL.createObjectURL(finalBlob);
        const filename = `animcraft_animation_${options.width}p_${Date.now()}.${fileExt}`;

        // Trigger automatic browser download
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        options.onProgress?.(100, options.durationSeconds);
        options.onStatusChange?.('Export completed! Video downloaded successfully.');

        resolve({ blob: finalBlob, downloadUrl, filename });
      };

      recorder.onerror = (e) => {
        reject(e);
      };

      // Start Recording
      recorder.start(250); // gather chunks every 250ms

      // Start Audio playback into destination
      audioElementsToCleanup.forEach((a) => {
        a.currentTime = 0;
        a.play().catch(() => {});
      });

      options.onStatusChange?.('Rendering high-definition frames in real-time...');

      const totalFrames = Math.floor(options.durationSeconds * options.fps);
      const startTime = performance.now();
      let currentFrame = 0;

      const renderFrame = () => {
        if (this.isCancelled) {
          recorder.stop();
          return;
        }

        const stageRect = stageEl.getBoundingClientRect();
        if (stageRect.width <= 0 || stageRect.height <= 0) {
          recorder.stop();
          return;
        }

        const elapsedSec = (performance.now() - startTime) / 1000;
        
        // Drive studio timeline clock in lockstep
        options.onExportSeek?.(elapsedSec);

        const scaleX = options.width / stageRect.width;
        const scaleY = options.height / stageRect.height;

        ctx.save();
        ctx.clearRect(0, 0, options.width, options.height);

        // =========================================================
        // LAYER 1: STAGE BACKGROUND (CUSTOM BG / TEMPLATE BG)
        // =========================================================
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, options.width, options.height);

        // Look for custom background or template background image
        const customBgImg = stageEl.querySelector('[data-stage-background="custom"] img') as HTMLImageElement | null;
        const templateBgImg = stageEl.querySelector('#autodraft-canvas-stage > div:first-child img') as HTMLImageElement | null;
        const bgImg = customBgImg || templateBgImg;

        if (bgImg && bgImg.complete && bgImg.naturalWidth > 0 && bgImg.style.display !== 'none') {
          try {
            drawCoverImage(ctx, bgImg, options.width, options.height);
          } catch (_) {}
        }

        // Check if there are dynamic multi-layer template background elements
        const dynamicLayers = stageEl.querySelectorAll('#autodraft-canvas-stage > div:first-child div > img');
        if (dynamicLayers.length > 1) {
          dynamicLayers.forEach((layerEl) => {
            const lImg = layerEl as HTMLImageElement;
            if (lImg.complete && lImg.naturalWidth > 0) {
              const lRect = lImg.getBoundingClientRect();
              const ldx = (lRect.left - stageRect.left) * scaleX;
              const ldy = (lRect.top - stageRect.top) * scaleY;
              const ldw = lRect.width * scaleX;
              const ldh = lRect.height * scaleY;
              try {
                ctx.drawImage(lImg, ldx, ldy, ldw, ldh);
              } catch (_) {}
            }
          });
        }

        // =========================================================
        // LAYER 2: MEDIA OVERLAYS ON STAGE (Rathh, Horses, Elements)
        // =========================================================
        const mediaContainers = stageEl.querySelectorAll('[data-media-instance-id]');
        mediaContainers.forEach((mEl) => {
          const m = mEl as HTMLElement;
          const rect = m.getBoundingClientRect();
          const img = m.querySelector('img') as HTMLImageElement | null;
          const vid = m.querySelector('video') as HTMLVideoElement | null;
          const mediaSource = img || vid;
          if (mediaSource) {
            const isImgComplete = img ? (img.complete && img.naturalWidth > 0) : true;
            if (isImgComplete) {
              const dx = (rect.left - stageRect.left) * scaleX;
              const dy = (rect.top - stageRect.top) * scaleY;
              const dw = rect.width * scaleX;
              const dh = rect.height * scaleY;
              try {
                ctx.drawImage(mediaSource, dx, dy, dw, dh);
              } catch (_) {}
            }
          }
        });

        // =========================================================
        // LAYER 3: CHARACTERS (Spine Canvases, Avatars & Props)
        // =========================================================
        const charContainers = stageEl.querySelectorAll('[data-character-instance-id]');
        charContainers.forEach((charContainer) => {
          const cEl = charContainer as HTMLElement;
          const rect = cEl.getBoundingClientRect();

          // Locate Spine canvas (from SpineCanvasRig) or avatar image
          const innerCanvas = cEl.querySelector('canvas') as HTMLCanvasElement | null;
          const innerImg = cEl.querySelector('img:not([data-prop="true"])') as HTMLImageElement | null;
          const charSource = innerCanvas || innerImg;

          if (charSource) {
            const dx = (rect.left - stageRect.left) * scaleX;
            const dy = (rect.top - stageRect.top) * scaleY;
            const dw = rect.width * scaleX;
            const dh = rect.height * scaleY;

            ctx.save();

            // Check for flip (scaleX(-1))
            const flipWrapper = cEl.querySelector('div[style*="scaleX(-1)"]');
            if (flipWrapper) {
              ctx.translate(dx + dw, dy);
              ctx.scale(-1, 1);
              ctx.drawImage(charSource, 0, 0, dw, dh);
            } else {
              ctx.drawImage(charSource, dx, dy, dw, dh);
            }

            // Draw attached props (flute, crown, weapon, mace)
            const propImgs = cEl.querySelectorAll('img[data-prop="true"]');
            propImgs.forEach((pImgEl) => {
              const pImg = pImgEl as HTMLImageElement;
              if (pImg.complete && pImg.naturalWidth > 0) {
                const pRect = pImg.getBoundingClientRect();
                const pdx = (pRect.left - stageRect.left) * scaleX;
                const pdy = (pRect.top - stageRect.top) * scaleY;
                const pdw = pRect.width * scaleX;
                const pdh = pRect.height * scaleY;
                ctx.drawImage(pImg, pdx, pdy, pdw, pdh);
              }
            });

            ctx.restore();
          }
        });

        // =========================================================
        // LAYER 4: VISUAL OVERLAY EFFECTS (Fire, Smoke, Light, Rain)
        // =========================================================
        const effectEls = stageEl.querySelectorAll('[data-effect-overlay="true"]');
        effectEls.forEach((effEl) => {
          const eff = effEl as HTMLElement;
          const vid = eff.querySelector('video') as HTMLVideoElement | null;
          const img = eff.querySelector('img') as HTMLImageElement | null;
          const src = vid || img;
          if (src) {
            ctx.save();
            const blendMode = (eff.style.mixBlendMode || 'normal').toLowerCase();
            if (blendMode === 'screen') ctx.globalCompositeOperation = 'screen';
            else if (blendMode === 'multiply') ctx.globalCompositeOperation = 'multiply';
            else ctx.globalCompositeOperation = 'source-over';

            const op = parseFloat(eff.style.opacity || '1');
            ctx.globalAlpha = isNaN(op) ? 1.0 : op;

            ctx.drawImage(src, 0, 0, options.width, options.height);
            ctx.restore();
          }
        });

        ctx.restore();

        currentFrame++;
        const progress = Math.min(99, Math.round((elapsedSec / options.durationSeconds) * 100));
        options.onProgress?.(progress, Math.min(options.durationSeconds, elapsedSec));

        if (elapsedSec >= options.durationSeconds || currentFrame >= totalFrames) {
          options.onStatusChange?.('Finalizing and encoding video file...');
          recorder.stop();
        } else {
          // Schedule next frame
          requestAnimationFrame(renderFrame);
        }
      };

      // Kick off render loop
      requestAnimationFrame(renderFrame);
    });
  }
}
