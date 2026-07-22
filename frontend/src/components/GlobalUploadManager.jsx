import { useUpload } from '../context/UploadContext';
import { Card } from '../design-system/components/Cards';
import { Button } from '../design-system/components/Button';
import { UploadCloud, CheckCircle, AlertTriangle, X } from 'lucide-react';

export default function GlobalUploadManager() {
  const {
    isUploading,
    uploadProgress,
    processingState,
    uploadResult,
    uploadError,
    selectedCount,
    isManagerVisible,
    cancelUpload,
    clearUpload,
    setIsManagerVisible,
    processingMetrics,
  } = useUpload();

  if (!isManagerVisible) return null;

  const isComplete = uploadResult !== null || uploadError !== null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 shadow-2xl rounded-xl transition-all duration-300 transform origin-bottom-right">
      <Card className="p-4 flex flex-col gap-4 border border-stone-200 bg-white">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {isComplete ? (
              uploadError || (uploadResult && uploadResult.failedImports > 0) ? (
                <AlertTriangle size={18} className="text-red-500" />
              ) : (
                <CheckCircle size={18} className="text-green-500" />
              )
            ) : (
              <UploadCloud size={18} className="text-accent animate-pulse" />
            )}
            <h3 className="text-sm font-semibold text-stone-800">
              {isComplete
                ? uploadError
                  ? 'Upload Failed'
                  : uploadResult?.failedImports > 0
                  ? 'Partial Import Complete'
                  : 'Import Successful'
                : 'Uploading to Anaadi'}
            </h3>
          </div>
          <button
            onClick={() => (isComplete ? clearUpload() : setIsManagerVisible(false))}
            className="text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        {!isComplete ? (
          <div className="space-y-3">
            <div className="text-xs text-stone-500">
              {uploadProgress < 100
                ? `${Math.min(selectedCount, Math.ceil((uploadProgress / 100) * selectedCount))} / ${selectedCount} files uploaded`
                : processingState
                ? (processingMetrics.phase === 'scanning' 
                    ? 'Scanning ZIP and discovering images...' 
                    : `${processingMetrics.processed} / ${processingMetrics.total} files processed`)
                : 'Extracting & initializing...'}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-stone-150 rounded-full h-2 overflow-hidden relative">
                {/* Upload progress background indicator */}
                <div
                  className="absolute top-0 left-0 bottom-0 bg-stone-300 transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
                {/* Processing indicator */}
                <div
                  className={`absolute top-0 left-0 bottom-0 bg-stone-800 transition-all duration-300 ease-out ${
                    processingMetrics.phase === 'scanning' ? 'animate-pulse w-full' : ''
                  }`}
                  style={{ width: processingMetrics.phase === 'scanning' ? '100%' : `${uploadProgress < 100 ? 0 : processingMetrics.percent}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-stone-700 w-12 text-right">
                {uploadProgress < 100
                  ? `${uploadProgress}%`
                  : (processingMetrics.phase === 'scanning' ? '...' : `${processingMetrics.percent}%`)}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full !border-red-200 !text-red-600 hover:!bg-red-50 hover:!border-red-300"
              onClick={cancelUpload}
            >
              Cancel Upload
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-stone-500">
              {uploadError
                ? uploadError
                : uploadResult?.failedImports > 0
                ? `${uploadResult.successfullyImported} imported, ${uploadResult.failedImports} failed.`
                : `Successfully imported ${uploadResult?.successfullyImported} image${
                    uploadResult?.successfullyImported === 1 ? '' : 's'
                  }.`}
            </div>
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={clearUpload}>
              Dismiss
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
