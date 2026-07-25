import { useNavigate } from 'react-router-dom';
import { Loader2, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useImportJob } from '../context/ImportJobContext';

export default function GlobalImportIndicator() {
  const { jobStatus, toastHidden, dismissToast } = useImportJob();
  const navigate = useNavigate();

  if (!jobStatus || toastHidden) return null;

  const isCompleted = jobStatus.status === 'completed';
  const isFailed = jobStatus.status === 'failed';
  const isRunning = jobStatus.status === 'running' || jobStatus.status === 'pending';

  const percentage = jobStatus.totalFiles > 0 
    ? Math.round((jobStatus.processedFiles / jobStatus.totalFiles) * 100) 
    : 0;

  return (
    <div 
      className={cn(
        "fixed z-50 bottom-6 right-6 md:bottom-8 md:right-8",
        "bg-white shadow-xl border rounded-xl p-4 w-[320px]",
        "flex flex-col gap-3 transition-all",
        isCompleted ? "border-green-200" : isFailed ? "border-red-200" : "border-stone-200"
      )}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          {isRunning && <Loader2 className="w-5 h-5 text-accent animate-spin" />}
          {isCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
          {isFailed && <AlertTriangle className="w-5 h-5 text-red-500" />}
          
          <p className={cn(
            "text-sm font-semibold",
            isCompleted ? "text-green-700" : isFailed ? "text-red-700" : "text-stone-800"
          )}>
            {isRunning && "⬆ Importing Designs"}
            {isCompleted && "✓ Import Completed"}
            {isFailed && "⚠ Import Failed"}
          </p>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            dismissToast();
          }}
          className="text-stone-400 hover:text-stone-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isRunning && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-stone-500">
             <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden flex-1 mr-3">
              <div 
                className="bg-accent h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="font-medium text-accent whitespace-nowrap">{percentage}%</span>
          </div>

          <p className="text-xs text-stone-600 font-medium">
            {jobStatus.processedFiles} / {jobStatus.totalFiles} images
          </p>
          
          <div className="text-xs text-stone-500 truncate">
            <span className="text-stone-400">Current:</span> <br/>
            <span className="font-mono">{jobStatus.currentFilename || '...'}</span>
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="space-y-1 text-xs">
          <p className="font-medium text-stone-700">{jobStatus.totalFiles} images processed</p>
          <p className="text-green-600">{jobStatus.successfulImports} Successful</p>
          {jobStatus.failedImports > 0 && <p className="text-red-600">{jobStatus.failedImports} Failed</p>}
        </div>
      )}

      {isFailed && (
        <div className="space-y-1 text-xs">
          <p className="font-medium text-stone-700">{jobStatus.processedFiles} processed</p>
          <p className="text-red-600">{jobStatus.failedImports} failed</p>
          <p className="text-stone-500 truncate">{jobStatus.error}</p>
        </div>
      )}

      {(isCompleted || isFailed) && (
        <div className="pt-2 mt-1 border-t border-stone-100">
          <button
            onClick={() => {
              navigate('/upload');
              dismissToast();
            }}
            className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors w-full text-left"
          >
            View Report
          </button>
        </div>
      )}
    </div>
  );
}
