import { apiClient } from '../lib/apiClient';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const ImportJobContext = createContext(null);

export function ImportJobProvider({ children }) {
  const [activeJobId, setActiveJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [toastHidden, setToastHidden] = useState(false);

  const apiBaseUrl = useMemo(() => (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3200').replace(/\/$/, ''), []);

  const checkActiveJobs = useCallback(async () => {
    try {
      const response = await apiClient(`${apiBaseUrl}/api/design-images/import/active`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.activeJobs && data.activeJobs.length > 0) {
          if (activeJobId !== data.activeJobs[0].id) {
            setActiveJobId(data.activeJobs[0].id);
            setToastHidden(false); // unhide if a new job is discovered
          }
        }
      }
    } catch (err) {
      // silently fail
    }
  }, [apiBaseUrl, activeJobId]);

  useEffect(() => {
    // Check initially and then every 5 seconds for new jobs if we don't have one
    checkActiveJobs();
    const interval = setInterval(() => {
      if (!activeJobId) {
        checkActiveJobs();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeJobId, checkActiveJobs]);

  useEffect(() => {
    if (!activeJobId) return;

    let timeoutId;
    let isPolling = true;

    const pollJob = async () => {
      if (!isPolling) return;
      try {
        const response = await apiClient(`${apiBaseUrl}/api/design-images/import/${activeJobId}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setJobStatus(data.job);

          if (data.job.status === 'completed' || data.job.status === 'failed') {
            setActiveJobId(null);
            setToastHidden(false); // ensure the completion toast is visible
          }
        }
      } catch (err) {
        console.error("Failed to poll job status:", err);
      }

      if (isPolling && activeJobId) {
         timeoutId = setTimeout(pollJob, 1000);
      }
    };

    pollJob();

    return () => {
      isPolling = false;
      if (timeoutId) {
        // Only clear if we are still polling, don't clear the auto-dismiss timeout
        if (activeJobId) {
           clearTimeout(timeoutId);
        }
      }
    };
  }, [activeJobId, apiBaseUrl]);

  // Keep a separate effect for auto-dismiss to avoid cleanup clearing it
  useEffect(() => {
    if (jobStatus && (jobStatus.status === 'completed' || jobStatus.status === 'failed')) {
      const tid = setTimeout(() => {
        setToastHidden(true);
      }, 10000);
      return () => clearTimeout(tid);
    }
  }, [jobStatus]);

  const startJob = (jobId) => {
    setActiveJobId(jobId);
    setToastHidden(false);
    setJobStatus(null); // clear previous
  };

  const dismissToast = () => {
    setToastHidden(true);
  };

  const clearJob = () => {
    setJobStatus(null);
    setToastHidden(true);
  };

  return (
    <ImportJobContext.Provider value={{
      activeJobId,
      jobStatus,
      startJob,
      toastHidden,
      dismissToast,
      clearJob
    }}>
      {children}
    </ImportJobContext.Provider>
  );
}

export function useImportJob() {
  const context = useContext(ImportJobContext);
  if (!context) {
    throw new Error('useImportJob must be used within an ImportJobProvider');
  }
  return context;
}
