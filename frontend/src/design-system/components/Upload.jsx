import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, Image, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

// ─── Upload Zone ──────────────────────────────────────────────────────────────
export function UploadZone({
  onUpload,
  accept = 'image/*',
  maxSize = 10, // MB
  multiple = false,
  className,
}) {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles]       = useState([]);
  const [error, setError]       = useState(null);

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFiles = useCallback((incoming) => {
    setError(null);
    const valid = Array.from(incoming).filter((f) => {
      if (maxSize && f.size > maxSize * 1024 * 1024) {
        setError(`File exceeds ${maxSize}MB limit.`);
        return false;
      }
      return true;
    });
    const enriched = valid.map((f) => ({
      file: f,
      id:   Math.random().toString(36).slice(2),
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      status:  'ready', // 'ready' | 'uploading' | 'done' | 'error'
      progress: 0,
    }));
    setFiles((prev) => (multiple ? [...prev, ...enriched] : enriched));
    onUpload?.(enriched.map((e) => e.file));
  }, [multiple, maxSize, onUpload]);

  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop Zone */}
      <label
        className={cn(
          'relative flex flex-col items-center justify-center',
          'w-full min-h-[180px] rounded-xl border-2 border-dashed',
          'cursor-pointer transition-all duration-200',
          dragOver
            ? 'border-accent bg-accent-subtle/60 scale-[1.01]'
            : 'border-stone-300 bg-stone-50/50 hover:border-accent/60 hover:bg-stone-50'
        )}
        onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
        onDragOver={(e)  => { e.preventDefault(); setDragOver(true); }}
        onDrop={(e)      => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <motion.div
          animate={dragOver ? { scale: 1.1 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="flex flex-col items-center gap-3 text-center px-6 py-8"
        >
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-200',
              dragOver ? 'bg-accent text-white' : 'bg-stone-100 text-stone-400'
            )}
          >
            <UploadCloud size={22} />
          </div>

          <div>
            <p className="text-sm font-medium text-stone-700">
              {dragOver ? 'Drop to upload' : (
                <>
                  <span className="text-accent">Click to upload</span> or drag and drop
                </>
              )}
            </p>
            <p className="text-xs text-stone-400 mt-1">
              {accept === 'image/*' ? 'PNG, JPG, WEBP' : accept} · Max {maxSize}MB
            </p>
          </div>
        </motion.div>
      </label>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 text-xs text-error bg-error-subtle border border-red-200 rounded-md px-3 py-2"
          >
            <AlertCircle size={12} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* File List */}
      <AnimatePresence>
        {files.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="flex items-center gap-3 p-3 bg-white border border-stone-200 rounded-lg shadow-xs"
          >
            {/* Preview */}
            <div className="w-10 h-10 rounded-md overflow-hidden bg-stone-100 shrink-0 flex items-center justify-center">
              {f.preview ? (
                <img src={f.preview} alt="" className="w-full h-full object-cover" />
              ) : (
                <FileText size={16} className="text-stone-400" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-800 truncate">{f.file.name}</p>
              <p className="text-xs text-stone-400 mt-0.5">{formatSize(f.file.size)}</p>
              {f.status === 'uploading' && (
                <div className="mt-1.5 h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-accent rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${f.progress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Status */}
            <div className="shrink-0 flex items-center gap-2">
              {f.status === 'done'      && <CheckCircle2 size={16} className="text-success" />}
              {f.status === 'uploading' && <Loader2 size={16} className="text-accent animate-spin-slow" />}
              {f.status === 'error'     && <AlertCircle size={16} className="text-error" />}
              <button
                onClick={() => removeFile(f.id)}
                className="text-stone-300 hover:text-stone-600 transition-colors duration-100"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
