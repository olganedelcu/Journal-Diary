import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, SwitchCamera, X, Loader } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    stopStream();
    setReady(false);
    setError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setReady(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (msg.includes('NotAllowed') || msg.includes('Permission')) {
        setError('Camera permission was denied. Please allow camera access and try again.');
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
        setError('No camera found on this device.');
      } else {
        setError(`Could not access camera: ${msg}`);
      }
    }
  }, [stopStream]);

  useEffect(() => {
    startCamera(facingMode);
    return stopStream;
  }, [facingMode, startCamera, stopStream]);

  function handleSwitchCamera() {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  }

  async function handleCapture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setCapturing(true);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          onCapture(file);
        }
        setCapturing(false);
      },
      'image/jpeg',
      0.92
    );
  }

  function handleClose() {
    stopStream();
    onClose();
  }

  return (
    <div className="camera-modal" onClick={handleClose}>
      <div className="camera-container" onClick={(e) => e.stopPropagation()}>
        <button className="camera-close-btn" onClick={handleClose}>
          <X size={20} />
        </button>

        {error ? (
          <div className="camera-error">
            <Camera size={40} />
            <p>{error}</p>
            <button className="btn btn-secondary" onClick={handleClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="camera-viewfinder">
              {!ready && (
                <div className="camera-loading">
                  <Loader size={32} className="spin" />
                  <p>Starting camera...</p>
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-preview"
                style={{ opacity: ready ? 1 : 0 }}
              />
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div className="camera-controls">
              <button
                className="camera-btn camera-btn-switch"
                onClick={handleSwitchCamera}
                title="Switch camera"
              >
                <SwitchCamera size={22} />
              </button>
              <button
                className="camera-btn camera-btn-capture"
                onClick={handleCapture}
                disabled={!ready || capturing}
                title="Take photo"
              >
                {capturing ? <Loader size={28} className="spin" /> : <Camera size={28} />}
              </button>
              <button
                className="camera-btn camera-btn-cancel"
                onClick={handleClose}
                title="Cancel"
              >
                <X size={22} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
