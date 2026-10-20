/**
 * Offscreen Canvas Video Renderer using WebCodecs / MediaRecorder.
 * Allows instant, client-side MP4/WebM creation with no server queue or credit fees.
 */
export async function exportSceneToVideo(
  canvas: HTMLCanvasElement,
  totalFrames: number,
  fps: number,
  onFrameRender: (frame: number) => void,
  onProgress: (percent: number) => void
): Promise<Blob> {
  const stream = canvas.captureStream(fps);
  const recordedChunks: Blob[] = [];

  const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9')
    ? 'video/webm; codecs=vp9'
    : 'video/webm';

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 6000000 // 6 Mbps high definition
  });

  return new Promise((resolve, reject) => {
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: mimeType });
      resolve(blob);
    };

    recorder.onerror = (err) => {
      reject(err);
    };

    recorder.start();

    // Render frame sequence
    let current = 0;
    const interval = setInterval(() => {
      if (current >= totalFrames) {
        clearInterval(interval);
        recorder.stop();
        return;
      }

      onFrameRender(current);
      onProgress(Math.round((current / totalFrames) * 100));
      current++;
    }, 1000 / fps);
  });
}
