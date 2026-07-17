import { H2, Body } from '../../design-system/components/Typography';
import { Card } from '../../design-system/components/Cards';
import { UploadZone } from '../../design-system/components/Upload';
import { Button } from '../../design-system/components/Button';
import { useState } from 'react';
import { Alert } from '../../design-system/components/Feedback';
import { FileText, Cpu, CheckCircle } from 'lucide-react';

export default function UploadPage() {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleUploadChange = (files) => {
    if (files.length > 0) {
      setSelectedFile(files[0]);
      setSuccess(false);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setLoading(true);
    setSuccess(false);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setSelectedFile(null);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <H2 className="text-stone-800">Index New Designs</H2>
        <Body className="text-stone-500">Upload jewellery design images to extract feature vectors and update the AI search catalogue index.</Body>
      </div>

      {success && (
        <Alert type="success" title="Upload Successful">
          The reference image has been indexed and is now searchable in the AI database.
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
        {/* Left Panel: Primary Upload Zone */}
        <div className="lg:col-span-3 flex flex-col">
          <Card className="p-6 flex-1 flex flex-col justify-between min-h-[320px]">
            <div className="space-y-2 mb-4">
              <H2 className="text-stone-800 text-base font-semibold">Image Upload Zone</H2>
              <Body className="text-stone-500 text-xs">
                Drag and drop or click to upload. Features are extracted automatically upon clicking Index.
              </Body>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <UploadZone accept="image/*" maxSize={10} multiple={false} onUpload={handleUploadChange} className="w-full flex-1" />
            </div>
          </Card>
        </div>

        {/* Right Panel: Upload Actions & Info */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="p-6 flex-1 flex flex-col justify-between min-h-[320px]">
            <div className="space-y-4">
              <H2 className="text-stone-800 text-base font-semibold">Indexing Summary</H2>
              
              <div className="space-y-3">
                <div className="flex items-start gap-2.5 p-3 bg-stone-50 border border-stone-200 rounded-lg">
                  <FileText size={16} className="text-accent shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-stone-700">Selected File</p>
                    <p className="text-xs text-stone-400 mt-0.5 truncate font-mono">
                      {selectedFile ? selectedFile.name : 'No file selected'}
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
                disabled={!selectedFile}
                loading={loading}
              >
                Index Reference Image
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setSelectedFile(null)}
                disabled={!selectedFile}
              >
                Clear Selection
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}
