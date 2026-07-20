import { H2, Body } from '../../design-system/components/Typography';
import { Card } from '../../design-system/components/Cards';
import { UploadZone } from '../../design-system/components/Upload';
import { Button } from '../../design-system/components/Button';
import { useMemo, useState } from 'react';
import { Alert, ToastContainer } from '../../design-system/components/Feedback';
import { FileText, Cpu, CheckCircle } from 'lucide-react';

export default function UploadPage() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadKey, setUploadKey] = useState(0);
  const [toasts, setToasts] = useState([]);

  const apiBaseUrl = useMemo(() => (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3200').replace(/\/$/, ''), []);

  const addToast = (type, title, description) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6000);
  };

  const handleUploadChange = (files) => {
    if (files.length > 100) {
      addToast('warning', 'Upload Limit Exceeded', 'You cannot upload more than 100 images at a time.');
      setSelectedFiles(files.slice(0, 100));
      return;
    }
    setSelectedFiles(files);
    setUploadResult(null);
    setUploadError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    if (selectedFiles.length > 100) {
      addToast('warning', 'Upload Limit Exceeded', 'You cannot upload more than 100 images at a time.');
      return;
    }

    setLoading(true);
    setUploadResult(null);
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

      if (!response.ok && response.status !== 207) {
        throw new Error(payload.message || 'Bulk import failed.');
      }

      setUploadResult(payload);
      if (payload.successfullyImported > 0) {
        setSelectedFiles([]);
        setUploadKey((current) => current + 1);
      }

      if (payload.failedImports > 0) {
        if (payload.successfullyImported > 0) {
          addToast(
            'warning',
            'Partial Import Complete',
            `⚠️ ${payload.successfullyImported} images imported successfully, ${payload.failedImports} failed.`
          );
        } else {
          addToast(
            'error',
            'Import Failed',
            `❌ ${payload.failureReasons?.map((f) => `${f.originalFilename || f.filename}: ${f.reason}`).join(' | ') || 'All images failed to import.'}`
          );
        }
      } else {
        addToast(
          'success',
          'Import Successful',
          `✅ Successfully imported and indexed ${payload.successfullyImported} image${payload.successfullyImported === 1 ? '' : 's'}.`
        );
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

  const importFeedback = uploadResult
    ? (
      uploadResult.failedImports > 0
        ? {
          type: uploadResult.successfullyImported > 0 ? "warning" : "error",
          title:
            uploadResult.successfullyImported > 0
              ? "Partial Import Complete"
              : "Import Failed",
          message:
            uploadResult.successfullyImported > 0
              ? `${uploadResult.successfullyImported} of ${uploadResult.totalUploaded} files imported. ${uploadResult.failureReasons
                ?.map(
                  (f) =>
                    `${f.originalFilename || f.filename}: ${f.reason}`
                )
                .join(" | ") || ""
              }`
              : `All ${uploadResult.totalUploaded} files failed. ${uploadResult.failureReasons
                ?.map(
                  (f) =>
                    `${f.originalFilename || f.filename}: ${f.reason}`
                )
                .join(" | ") || ""
              }`,
        }
        : {
          type: "success",
          title: "Import Successful",
          message: `Successfully imported ${uploadResult.successfullyImported} image${uploadResult.successfullyImported === 1 ? "" : "s"
            }.`,
        }
    )
    : uploadError
      ? {
        type: "error",
        title: "Upload Failed",
        message: uploadError,
      }
      : null;

  return (
    <div className="space-y-6">
      <div>
        <H2 className="text-stone-800">Index New Designs</H2>
        <Body className="text-stone-500">Upload jewellery design images to extract feature vectors and update the AI search catalogue index.</Body>
      </div>

      {importFeedback && (
        <Alert type={importFeedback.type} title={importFeedback.title}>
          {importFeedback.message}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Left Panel: Primary Upload Zone */}
        <div className="lg:col-span-3 flex flex-col">
          <Card className="p-6 flex-1 flex flex-col justify-between min-h-[320px]">
            <div className="space-y-2 mb-4">
              <H2 className="text-stone-800 text-base font-semibold">Image Upload Zone</H2>
              <Body className="text-stone-500 text-xs">
                Drag and drop or click to upload. Features are extracted automatically when you import the selected files.
              </Body>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <UploadZone key={uploadKey} accept="image/*" maxSize={10} multiple onUpload={handleUploadChange} className="w-full flex-1" />
            </div>
          </Card>
        </div>

        {/* Right Panel: Upload Actions & Info */}
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
                    <p className="text-xs text-stone-400 mt-0.5">OpenCLIP ViT-H-14 Feature Extraction</p>
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
                disabled={selectedCount === 0}
                loading={loading}
              >
                Import {selectedCount > 0 ? `${selectedCount} Image${selectedCount === 1 ? '' : 's'}` : 'Images'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSelectedFiles([]);
                  setUploadResult(null);
                  setUploadError(null);
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

      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
}
