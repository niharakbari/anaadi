import { createContext, useContext, useState, useRef, useMemo } from 'react';

const UploadContext = createContext(null);

export function UploadProvider({ children }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingState, setProcessingState] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [isManagerVisible, setIsManagerVisible] = useState(false);

  const xhrRef = useRef(null);

  const apiBaseUrl = useMemo(
    () => (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3200').replace(/\/$/, ''),
    []
  );

  const processingMetrics = useMemo(() => {
    if (!processingState) return { phase: 'uploading', processed: 0, total: 0, percent: 0, time: '' };
    
    const phase = processingState.phase || 'importing';
    const total = processingState.discovered || 0;
    const processed = (processingState.imported || 0) + 
                      (processingState.skipped || 0) + 
                      (processingState.unsupported || 0) + 
                      (processingState.failed || 0) + 
                      (processingState.duplicates || 0);
                      
    const percent = total > 0 ? Math.round((processed / total) * 100) : 0;
    const time = processingState.elapsedTime || '';
    
    return { phase, processed, total, percent, time };
  }, [processingState]);

  const startUpload = async (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadResult(null);
    setUploadError(null);
    setUploadProgress(0);
    setProcessingState(null);
    setSelectedCount(selectedFiles.length);
    setIsManagerVisible(true);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      const response = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.open('POST', `${apiBaseUrl}/api/design-images/import`, true);
        xhr.withCredentials = true;

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        };

        let lastReadIndex = 0;
        let finalPayload = null;

        xhr.onreadystatechange = () => {
          if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
            if (xhr.status === 401) {
              window.dispatchEvent(new Event('unauthorized'));
              resolve(null);
              return;
            }
          }
          if (xhr.readyState === XMLHttpRequest.LOADING || xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 401) return;
            const text = xhr.responseText;
            const newText = text.substring(lastReadIndex);
            const lines = newText.split('\n');

            const linesToProcess = xhr.readyState === XMLHttpRequest.DONE ? lines : lines.slice(0, -1);

            for (const line of linesToProcess) {
              if (line.trim()) {
                try {
                  const chunk = JSON.parse(line);
                  if (chunk.type === 'start') {
                    // stream started
                  } else if (chunk.type === 'progress') {
                    setProcessingState(chunk.data);
                  } else if (chunk.type === 'result') {
                    finalPayload = chunk;
                  } else if (chunk.type === 'error') {
                    reject(new Error(chunk.message || 'Error processing files.'));
                    return;
                  }
                } catch (_) {
                  console.error('Failed to parse chunk', line);
                }
              }
            }
            if (xhr.readyState !== XMLHttpRequest.DONE) {
              lastReadIndex += linesToProcess.join('\n').length + (linesToProcess.length > 0 ? 1 : 0);
            }
          }

          if (xhr.readyState === XMLHttpRequest.DONE) {
            if (finalPayload) {
              resolve({ ok: true, status: finalPayload.status, payload: finalPayload.data });
            } else if (xhr.status >= 400) {
              try {
                const errPayload = JSON.parse(xhr.responseText);
                reject(new Error(errPayload.message || 'Bulk import failed.'));
              } catch (_) {
                reject(new Error('Network error during upload.'));
              }
            } else {
              reject(new Error('Invalid response from server.'));
            }
          }
        };

        xhr.onabort = () => {
          reject(new Error('Upload cancelled by user.'));
        };

        xhr.onerror = () => {
          reject(new Error('Network error during upload.'));
        };

        xhr.send(formData);
      });

      if (!response) return;

      const { payload } = response;
      if (!response.ok && response.status !== 207) {
        throw new Error(payload.message || 'Bulk import failed.');
      }

      setUploadResult(payload);
    } catch (error) {
      setUploadError(error.message || 'Bulk import failed.');
    } finally {
      setIsUploading(false);
      xhrRef.current = null;
    }
  };

  const cancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
  };

  const clearUpload = () => {
    setIsManagerVisible(false);
    setTimeout(() => {
      setUploadResult(null);
      setUploadError(null);
      setUploadProgress(0);
      setProcessingState(null);
      setSelectedCount(0);
      setIsUploading(false);
    }, 300); // animation delay
  };

  return (
    <UploadContext.Provider
      value={{
        isUploading,
        uploadProgress,
        processingState,
        uploadResult,
        uploadError,
        selectedCount,
        isManagerVisible,
        startUpload,
        cancelUpload,
        clearUpload,
        setIsManagerVisible,
        processingMetrics,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
}
