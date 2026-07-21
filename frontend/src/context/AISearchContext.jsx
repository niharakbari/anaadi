import { createContext, useContext, useState, useCallback } from 'react';

const AISearchContext = createContext(null);

export function AISearchProvider({ children }) {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState(null);
  const [searchVal, setSearchVal] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [resultLimit, setResultLimit] = useState(5);

  const [currentSearchHistoryId, setCurrentSearchHistoryId] = useState(null);

  const searchNext = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (originalPreviewUrl && originalPreviewUrl !== previewUrl) {
      URL.revokeObjectURL(originalPreviewUrl);
    }
    setUploadedFile(null);
    setOriginalFile(null);
    setPreviewUrl(null);
    setOriginalPreviewUrl(null);
    setSearchVal('');
    setSearchResults([]);
    setHasSearched(false);
    setSearchError(null);
    setCurrentSearchHistoryId(null);
  }, [previewUrl]);

  const value = {
    uploadedFile,
    setUploadedFile,
    originalFile,
    setOriginalFile,
    previewUrl,
    setPreviewUrl,
    originalPreviewUrl,
    setOriginalPreviewUrl,
    searchVal,
    setSearchVal,
    searchResults,
    setSearchResults,
    hasSearched,
    setHasSearched,
    searchError,
    setSearchError,
    resultLimit,
    setResultLimit,
    currentSearchHistoryId,
    setCurrentSearchHistoryId,
    searchNext,
  };

  return (
    <AISearchContext.Provider value={value}>
      {children}
    </AISearchContext.Provider>
  );
}

export function useAISearch() {
  const context = useContext(AISearchContext);
  if (!context) {
    throw new Error('useAISearch must be used within an AISearchProvider');
  }
  return context;
}
