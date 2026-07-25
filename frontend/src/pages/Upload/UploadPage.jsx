import { useState, useMemo, useEffect } from 'react';
import { FileText, Cpu, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { H2, Body } from '../../design-system/components/Typography';
import { Card } from '../../design-system/components/Cards';
import { Button } from '../../design-system/components/Button';
import { Alert, ToastContainer } from '../../design-system/components/Feedback';
import { UploadZone } from '../../design-system/components/Upload';
import { useImportJob } from '../../context/ImportJobContext';

export default function UploadPage() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadKey, setUploadKey] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [metadata, setMetadata] = useState(null);
  
  const { jobStatus, startJob, clearJob } = useImportJob();

  const apiBaseUrl = useMemo(() => (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3200').replace(/\/$/, ''), []);

  useEffect(() => {
    fetch(`${apiBaseUrl}/api/health/ai`)
      .then(res => res.json())
      .then(data => setMetadata(data.metadata))
      .catch(err => console.error("Failed to load metadata in UploadPage:", err));
  }, [apiBaseUrl]);

  const addToast = (type, title, description) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6000);
  };

  const handleUploadChange = (files) => {
    const hasZip = files.some(f => f.type === 'application/zip' || f.type === 'application/x-zip-compressed' || f.name.endsWith('.zip'));
    
    if (hasZip && files.length > 1) {
       addToast('warning', 'Multiple Files', 'Please upload only one ZIP file at a time.');
       return;
    }

    if (!hasZip && files.length > 10000) {
      addToast('warning', 'Upload Limit Exceeded', 'You cannot upload more than 10000 images at a time.');
      setSelectedFiles(files.slice(0, 10000));
      return;
    }
    
    setSelectedFiles(files);
    setUploadError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    setLoading(true);
    setUploadError(null);

    try {
      const formData = new FormData();

      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch(`${apiBaseUrl}/api/design-images/import`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (response.status === 401) {
        window.dispatchEvent(new Event('unauthorized'));
        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok && response.status !== 202) {
        throw new Error(payload.message || 'Bulk import failed.');
      }

      if (payload.jobId) {
        startJob(payload.jobId);
        setSelectedFiles([]);
        setUploadKey((current) => current + 1);
      }
    } catch (error) {
      setUploadError(error.message || 'Bulk import failed.');
      addToast('error', 'Upload Failed', `❌ ${error.message || 'Bulk import failed.'}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = selectedFiles.length;
  const selectedSummary = selectedCount === 0
    ? 'No files selected'
    : selectedCount === 1
      ? selectedFiles[0].name
      : `${selectedCount} files selected`;

  const isRunning = jobStatus && (jobStatus.status === 'running' || jobStatus.status === 'pending');
  const percentage = jobStatus && jobStatus.totalFiles > 0 
    ? Math.round((jobStatus.processedFiles / jobStatus.totalFiles) * 100) 
    : 0;

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <H2 className="text-stone-800">Index New Designs</H2>
        <Body className="text-stone-500">Upload jewellery design images or ZIP archives to extract feature vectors and update the AI search catalogue index.</Body>
      </div>

      {uploadError && (
        <Alert type="error" title="Upload Failed">
          {uploadError}
        </Alert>
      )}

      {/* Completion / Failure Report Card */}
      {(jobStatus?.status === 'completed' || jobStatus?.status === 'failed') && (
        <Card className="p-6 mb-6 border-stone-200">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              {jobStatus.status === 'completed' ? (
                <CheckCircle className="text-green-500" size={24} />
              ) : (
                <AlertCircle className="text-red-500" size={24} />
              )}
              <div>
                <H2 className="text-stone-800 text-lg font-semibold">
                  {jobStatus.status === 'completed' ? 'Import Completed' : 'Import Failed'}
                </H2>
                <p className="text-sm text-stone-500">
                  {jobStatus.totalFiles} images processed
                </p>
              </div>
            </div>
            <Button onClick={() => clearJob()} variant="outline" size="sm">
              Clear Report
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
            <div className="bg-stone-50 p-4 rounded-lg border border-stone-150">
              <p className="text-stone-500 mb-1">Processed</p>
              <p className="font-semibold text-stone-800 text-lg">{jobStatus.processedFiles}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <p className="text-green-600 mb-1">Successful</p>
              <p className="font-semibold text-green-700 text-lg">{jobStatus.successfulImports}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <p className="text-red-600 mb-1">Failed</p>
              <p className="font-semibold text-red-700 text-lg">{jobStatus.failedImports}</p>
            </div>
          </div>

          {jobStatus.status === 'failed' && jobStatus.error && (
            <Alert type="error" title="Critical Error">
              {jobStatus.error}
            </Alert>
          )}

          {jobStatus.failures?.length > 0 && (
            <div className="mt-4 border border-red-100 bg-red-50/30 rounded-lg overflow-hidden text-sm">
              <div className="bg-red-50 px-4 py-2 border-b border-red-100 font-semibold text-red-700">
                Failed Files ({jobStatus.failures.length})
              </div>
              <ul className="max-h-48 overflow-y-auto p-4 space-y-2">
                {jobStatus.failures.map((f, i) => (
                  <li key={i} className="flex flex-col sm:flex-row sm:items-center justify-between text-stone-700 border-b border-red-50 last:border-0 pb-2 last:pb-0">
                    <span className="font-medium font-mono text-xs">{f.filename}</span>
                    <span className="text-red-600 text-xs sm:ml-4">{f.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Main Upload Form - Always visible */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 flex flex-col">
          <Card className="p-6 flex-1 flex flex-col justify-between min-h-[320px]">
            <div className="space-y-2 mb-4">
              <H2 className="text-stone-800 text-base font-semibold">Image or ZIP Upload Zone</H2>
              <Body className="text-stone-500 text-xs">
                Drag and drop or click to upload images or a ZIP file. Features are extracted automatically.
              </Body>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <UploadZone key={uploadKey} accept="image/*,application/zip,application/x-zip-compressed,.zip" maxSize={1000} multiple onUpload={handleUploadChange} className="w-full flex-1" />
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 flex flex-col sticky top-6">
          <Card className="p-6 flex-1 flex flex-col justify-between min-h-[320px]">
            <div className="space-y-4">
              <H2 className="text-stone-800 text-base font-semibold">Indexing Summary</H2>

              <div className="space-y-3">
                <div className="flex items-start gap-2.5 p-3 bg-stone-50 border border-stone-200 rounded-lg">
                  <FileText size={16} className="text-accent shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-stone-700">Selected Files</p>
                    <p className="text-xs text-stone-400 mt-0.5 truncate font-mono">
                      {selectedSummary}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 bg-stone-50 border border-stone-200 rounded-lg">
                  <Cpu size={16} className="text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-stone-700">AI Model Pipeline</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {metadata ? `${metadata.displayName} ${metadata.variant} Feature Extraction` : 'Loading...'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 bg-stone-50 border border-stone-200 rounded-lg">
                  <CheckCircle size={16} className="text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-stone-700">Indexing Engine</p>
                    <p className="text-xs text-stone-400 mt-0.5">HNSW Database Flush</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-6 border-t border-stone-150">
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={selectedCount === 0 || loading || isRunning}
                loading={loading}
              >
                {isRunning ? "Importing..." : "Start Import"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSelectedFiles([]);
                  setUploadKey((current) => current + 1);
                }}
                disabled={selectedCount === 0}
              >
                Clear Selection
              </Button>
            </div>
          </Card>
        </div>
      </form>

      {/* Small Inline Status Card - Only visible while running */}
      {isRunning && (
        <Card className="p-4 bg-stone-50 border-stone-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-accent animate-spin" />
              <H2 className="text-stone-800 text-sm font-semibold">Import in Progress</H2>
            </div>
            <div className="text-xs text-stone-500 font-medium">
              {percentage}%
            </div>
          </div>
          
          <div className="mt-3 w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-accent h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${percentage}%` }}
            />
          </div>
          
          <div className="mt-3 flex flex-col md:flex-row md:items-center justify-between text-xs text-stone-600 gap-2">
            <p className="font-medium">
              {jobStatus.processedFiles} / {jobStatus.totalFiles} images imported
            </p>
            <div className="flex items-center gap-2 truncate">
              <span className="text-stone-400">Current:</span>
              <span className="font-mono truncate max-w-[200px]" title={jobStatus.currentFilename}>
                {jobStatus.currentFilename || '...'}
              </span>
            </div>
          </div>
          
          <p className="mt-2 text-xs text-stone-400 italic">
            Import continues even if you leave this page.
          </p>
        </Card>
      )}

      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
}
