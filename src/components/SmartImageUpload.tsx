import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SmartImageUploadProps {
  onUploaded: (url: string, file: File) => void;
  onClear?: () => void;
  label?: string;
  helperText?: string;
  initialUrl?: string;
}

type Mode = 'idle' | 'choosing' | 'camera' | 'previewing' | 'uploading';

export function SmartImageUpload({
  onUploaded,
  onClear,
  label = 'Upload Photo',
  helperText = 'Drag & drop, choose a file, or capture from camera',
  initialUrl,
}: SmartImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<Mode>(initialUrl ? 'previewing' : 'idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl || null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(initialUrl || null);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      setMode('camera');
      // Wait for video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch (e) {
      toast.error('Camera access denied or unavailable');
      setMode('idle');
    }
  };

  const captureFromCamera = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      stopCamera();
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      handleFile(file);
    }, 'image/jpeg', 0.92);
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setMode('uploading');
    setProgress(8);

    // Simulate progress while uploading
    const progressTimer = setInterval(() => {
      setProgress(p => (p < 88 ? p + Math.random() * 10 : p));
    }, 180);

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from('complaint-images')
        .upload(path, file, { upsert: false, contentType: file.type });

      clearInterval(progressTimer);
      if (error) throw error;

      const { data } = supabase.storage.from('complaint-images').getPublicUrl(path);
      setProgress(100);
      setUploadedUrl(data.publicUrl);
      setMode('previewing');
      onUploaded(data.publicUrl, file);
    } catch (e) {
      clearInterval(progressTimer);
      console.error(e);
      toast.error('Upload failed. Please try again.');
      setMode('idle');
      setPreviewUrl(null);
      setProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    stopCamera();
    setMode('idle');
    setPreviewUrl(null);
    setUploadedUrl(null);
    setProgress(0);
    onClear?.();
  };

  return (
    <div className="space-y-2">
      {label && <label className="section-title block">{label}</label>}

      <AnimatePresence mode="wait">
        {/* IDLE - drag & drop zone */}
        {mode === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`glass-card border-2 border-dashed transition-all p-8 text-center ${
              dragActive ? 'border-primary/70 bg-primary/5' : 'border-border/60'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-foreground">{helperText}</div>
                <div className="text-xs text-muted-foreground mt-1">JPG / PNG · up to 10 MB</div>
              </div>
              <div className="flex gap-2 mt-2 w-full max-w-xs">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4" /> Device
                </Button>
                <Button
                  type="button"
                  className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={startCamera}
                >
                  <Camera className="w-4 h-4" /> Camera
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = '';
                }}
              />
            </div>
          </motion.div>
        )}

        {/* CAMERA */}
        {mode === 'camera' && (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card p-3 space-y-3"
          >
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              <div className="absolute top-2 right-2">
                <button
                  type="button"
                  onClick={() => { stopCamera(); setMode('idle'); }}
                  className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <Button
              type="button"
              onClick={captureFromCamera}
              className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Camera className="w-4 h-4" /> Capture
            </Button>
          </motion.div>
        )}

        {/* UPLOADING / PREVIEW */}
        {(mode === 'uploading' || mode === 'previewing') && previewUrl && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="glass-card p-3 space-y-3"
          >
            <div className="relative rounded-xl overflow-hidden aspect-video bg-muted">
              <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
              {mode === 'uploading' && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-7 h-7 text-primary animate-spin" />
                  <div className="text-xs text-white/80">Uploading…</div>
                </div>
              )}
              {mode === 'previewing' && uploadedUrl && (
                <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-success/90 text-success-foreground text-[10px] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Uploaded
                </div>
              )}
              {mode === 'previewing' && (
                <button
                  type="button"
                  onClick={reset}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {mode === 'uploading' && (
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut' }}
                />
              </div>
            )}

            {mode === 'previewing' && (
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1 gap-2" onClick={reset}>
                  <RefreshCw className="w-4 h-4" /> Change
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
