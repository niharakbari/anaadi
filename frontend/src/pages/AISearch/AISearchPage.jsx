import { useState, useMemo } from 'react';
import { H2, Body, Label } from '../../design-system/components/Typography';
import { SearchInput } from '../../design-system/components/Search';
import { Card, ImageCard } from '../../design-system/components/Cards';
import { UploadZone } from '../../design-system/components/Upload';
import { EmptyState } from '../../design-system/components/States';
import { Button } from '../../design-system/components/Button';
import { Alert } from '../../design-system/components/Feedback';
import { X, Loader2, RotateCcw } from 'lucide-react';
import { useAISearch } from '../../context/AISearchContext';

export default function AISearchPage() {
  const {
    uploadedFile,
    setUploadedFile,
    previewUrl,
    setPreviewUrl,
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
    searchNext,
  } = useAISearch();

  const [searching, setSearching] = useState(false);

  const apiBaseUrl = useMemo(() => (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3200').replace(/\/$/, ''), []);

  const executeImageSearch = async (file, limit = resultLimit) => {
    if (!file) return;
    setSearching(true);
    setSearchError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('k', String(limit));

      const res = await fetch(`${apiBaseUrl}/api/search/image`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Image search failed.');
      }
      setSearchResults(Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []));
      setHasSearched(true);
    } catch (err) {
      setSearchError(err.message || 'Image search failed.');
    } finally {
      setSearching(false);
    }
  };

  const handleUpload = (files) => {
    if (files.length > 0) {
      const file = files[0];
      setUploadedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      executeImageSearch(file);
    }
  };

  const handleTextSearch = (e) => {
    if (e.key === 'Enter' && searchVal.trim() !== '') {
      setHasSearched(true);
    }
  };

  const triggerSearch = () => {
    if (uploadedFile) {
      executeImageSearch(uploadedFile);
    } else if (searchVal.trim() !== '') {
      setHasSearched(true);
    }
  };

  const handleClear = () => {
    searchNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <H2 className="text-stone-800">AI Jewellery Search</H2>
        <Body className="text-stone-500">Query the index using text, SKU codes, or upload reference images.</Body>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Drag & Drop Upload and Image Preview */}
          <div className="lg:col-span-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-stone-200 pb-6 lg:pb-0 lg:pr-6">
            <div className="space-y-3 h-full flex flex-col justify-between">
              <Label className="text-stone-500 block font-semibold">Reference Image</Label>
              {previewUrl ? (
                <div className="relative flex-1 min-h-[160px] bg-stone-50 border border-stone-200 rounded-xl overflow-hidden flex flex-col items-center justify-center p-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-[140px] max-w-full object-contain rounded-lg shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/85 hover:bg-white text-stone-500 hover:text-stone-700 shadow-xs transition-colors border border-stone-200"
                    title="Remove image"
                  >
                    <X size={14} />
                  </button>
                  <p className="text-xs text-stone-400 mt-2 truncate max-w-full font-mono">
                    {uploadedFile?.name}
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <UploadZone accept="image/*" maxSize={10} onUpload={handleUpload} className="flex-1 min-h-[160px]" />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Search Inputs & Actions */}
          <div className="lg:col-span-7 flex flex-col justify-between pl-0 lg:pl-6 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-stone-500 block font-semibold">Search Input</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="result-limit-select" className="text-stone-500 text-xs font-semibold shrink-0">
                    Results to Display:
                  </Label>
                  <select
                    id="result-limit-select"
                    value={resultLimit}
                    onChange={(e) => {
                      const newLimit = parseInt(e.target.value, 10);
                      setResultLimit(newLimit);
                      if (uploadedFile) {
                        executeImageSearch(uploadedFile, newLimit);
                      }
                    }}
                    disabled={searching}
                    className="h-8 appearance-none bg-white border border-stone-200 text-stone-900 text-xs font-medium rounded-md px-2.5 pr-7 cursor-pointer outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value={5}>Top 5</option>
                    <option value={10}>Top 10</option>
                    <option value={15}>Top 15</option>
                    <option value={20}>Top 20</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <div className="flex-1">
                  <SearchInput
                    id="search-input"
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    onKeyDown={handleTextSearch}
                    onClear={handleClear}
                    placeholder="Enter design keywords or details..."
                    size="md"
                    showShortcut={false}
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {hasSearched ? (
                    <Button
                      variant="outline"
                      size="md"
                      onClick={searchNext}
                      className="flex-1 sm:flex-initial border-accent/40 text-accent hover:bg-accent-subtle"
                      title="Clear query image and search results to start a new search"
                    >
                      <RotateCcw size={14} className="mr-1.5" />
                      Search Next
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="md"
                      onClick={handleClear}
                      disabled={!searchVal && !uploadedFile}
                      className="flex-1 sm:flex-initial"
                    >
                      Clear
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="md"
                    onClick={triggerSearch}
                    disabled={!searchVal.trim() && !uploadedFile}
                    loading={searching}
                    className="flex-1 sm:flex-initial"
                  >
                    Search
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 text-xs text-stone-500 space-y-1">
              <p className="font-semibold text-stone-700">Search Instructions:</p>
              <p>• Type keywords directly to match indexed visual terms.</p>
              <p>• Alternatively, drop an image on the left to activate visual feature matching.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Results grid */}
      <div className="space-y-4">
        <H2 className="text-stone-800 text-base font-semibold">
          {hasSearched ? 'Search Results' : 'Recommended Designs'}
        </H2>
        
        {searchError && (
          <Alert type="error" title="Search Failed">
            {searchError}
          </Alert>
        )}

        {searching ? (
          <div className="p-12 flex flex-col items-center justify-center bg-white border border-stone-200 rounded-lg text-stone-500">
            <Loader2 className="animate-spin text-accent mb-2" size={24} />
            <p className="text-sm font-medium">Extracting visual features and querying vector index...</p>
          </div>
        ) : hasSearched ? (
          searchResults.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {searchResults.map((card) => {
                const imgUrl = card.image
                  ? (card.image.startsWith('http') ? card.image : `${apiBaseUrl}${card.image}`)
                  : null;
                return (
                  <ImageCard
                    key={card.imageId || card.sku}
                    title={card.title || card.originalFilename || 'Jewellery Design'}
                    sku={card.sku}
                    category={card.category}
                    similarity={card.similarityScore !== undefined ? card.similarityScore / 100 : card.similarity}
                    status={card.status || 'active'}
                    image={imgUrl}
                    onClick={() => {}}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState
              type="search"
              title="No matching designs found"
              description="Try uploading a clearer reference image or adjusting your search thresholds."
            />
          )
        ) : (
          <EmptyState
            type="search"
            title="Start your search"
            description="Type a search query or drag an image on the left to query the vector database."
          />
        )}
      </div>
    </div>
  );
}
