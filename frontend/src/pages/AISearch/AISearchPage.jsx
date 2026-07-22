import { useState, useMemo, useRef, useEffect } from 'react';
import { H2, Body, Label } from '../../design-system/components/Typography';
import { SearchInput } from '../../design-system/components/Search';
import { Card, ImageCard } from '../../design-system/components/Cards';
import { UploadZone } from '../../design-system/components/Upload';
import { EmptyState } from '../../design-system/components/States';
import { Button } from '../../design-system/components/Button';
import { Alert, ToastContainer } from '../../design-system/components/Feedback';
import { Dialog } from '../../design-system/components/Overlays';
import { AdvancedLightbox } from '../../design-system/components/AdvancedLightbox';
import { Input, Textarea, FormField } from '../../design-system/components/FormControls';
import { X, Loader2, RotateCcw, Crop } from 'lucide-react';
import { useAISearch } from '../../context/AISearchContext';
import { ImageCropperModal } from '../../design-system/components/ImageCropperModal';

export default function AISearchPage() {
  const {
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
  } = useAISearch();

  const [searching, setSearching] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveModalCard, setSaveModalCard] = useState(null);
  const [saveName, setSaveName] = useState('');
  const [saveDealer, setSaveDealer] = useState('');
  const [saveNotes, setSaveNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(null);
  const [queryPreviewOpen, setQueryPreviewOpen] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);

  const saveNameInputRef = useRef(null);

  // Auto-select text when save modal opens
  useEffect(() => {
    if (saveModalOpen && saveNameInputRef.current) {
      // Small timeout ensures the DOM has rendered the input
      setTimeout(() => {
        saveNameInputRef.current.select();
      }, 50);
    }
  }, [saveModalOpen]);

  const apiBaseUrl = useMemo(() => (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3200').replace(/\/$/, ''), []);

  const addToast = (type, title, description) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6000);
  };

  const generateDefaultName = (filename) => {
    if (!filename) {
      return `Reference Design - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    const namePart = filename.split('.').slice(0, -1).join('.') || filename;
    const readable = namePart
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    return `${readable} Reference`;
  };

  const openSaveModal = (card) => {
    setSaveModalCard(card);
    setSaveName(generateDefaultName(uploadedFile?.name));
    setSaveDealer('');
    setSaveNotes('');
    setSaveModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!saveName.trim() || !currentSearchHistoryId || !saveModalCard) return;

    setSaving(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/saved-searches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          searchHistoryId: currentSearchHistoryId,
          designImageId: saveModalCard.imageId || saveModalCard.id || saveModalCard.sku.split('-')[1], // Depending on schema
          name: saveName.trim() || generateDefaultName(uploadedFile?.name),
          dealerName: saveDealer.trim(),
          notes: saveNotes.trim()
        }),
        credentials: 'include'
      });

      if (res.status === 401) {
        window.dispatchEvent(new Event('unauthorized'));
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save search');

      setSaveModalOpen(false);
      addToast('success', 'Search Saved', `Successfully saved as "${saveName.trim()}".`);
    } catch (err) {
      addToast('error', 'Save Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  const executeImageSearch = async (file, limit = resultLimit) => {
    if (!file) return;
    setSearching(true);
    setSearchError(null);
    setCurrentSearchHistoryId(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('k', String(limit));

      const res = await fetch(`${apiBaseUrl}/api/search/image`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (res.status === 401) {
        window.dispatchEvent(new Event('unauthorized'));
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Image search failed.');
      }
      setSearchResults(Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []));
      if (data.searchHistoryId) {
        setCurrentSearchHistoryId(data.searchHistoryId);
      }
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
      const url = URL.createObjectURL(file);
      setOriginalFile(file);
      setOriginalPreviewUrl(url);
      setUploadedFile(file);
      setPreviewUrl(url);
      executeImageSearch(file);
    }
  };

  const handleCropComplete = (croppedFile, croppedUrl) => {
    setUploadedFile(croppedFile);
    setPreviewUrl(croppedUrl);
    setCropModalOpen(false);
    executeImageSearch(croppedFile);
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
                <div
                  className="relative flex-1 bg-stone-50 border border-stone-200 rounded-xl overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-all group"
                  onClick={() => setQueryPreviewOpen(true)}
                  title="Click to preview"
                  style={{ minHeight: '160px', maxHeight: '400px' }}
                >
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-300"
                    style={{ maxHeight: '400px' }}
                  />
                  <div className="absolute top-2 right-2 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleClear(); }}
                      className="p-2 rounded-full bg-stone-900/50 hover:bg-stone-900/70 text-white backdrop-blur-md shadow-sm transition-colors flex items-center justify-center"
                      title="Remove image"
                    >
                      <X size={16} />
                    </button>
                    {originalPreviewUrl && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setCropModalOpen(true); }}
                        className="p-2 rounded-full bg-accent/80 hover:bg-accent text-white backdrop-blur-md shadow-sm transition-colors flex items-center justify-center"
                        title="Crop Image"
                      >
                        <Crop size={16} />
                      </button>
                    )}
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-stone-900/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <p className="text-xs text-white truncate max-w-full font-mono relative z-10">
                      {uploadedFile?.name}
                    </p>
                  </div>
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
              {searchResults.map((card, index) => {
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
                    onClick={() => setPreviewIndex(index)}
                    onSave={currentSearchHistoryId ? () => openSaveModal(card) : undefined}
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

      <AdvancedLightbox
        open={previewIndex !== null || queryPreviewOpen}
        onClose={() => { setPreviewIndex(null); setQueryPreviewOpen(false); }}
        items={queryPreviewOpen ? [{
          image: previewUrl,
          title: uploadedFile?.name || 'Reference Image',
          sku: 'Query Image'
        }] : searchResults}
        currentIndex={queryPreviewOpen ? 0 : (previewIndex ?? 0)}
        onIndexChange={queryPreviewOpen ? undefined : setPreviewIndex}
        onViewDetails={(item) => console.log('View details', item)}
        apiBaseUrl={apiBaseUrl}
      />

      <Dialog
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title="Save Search Context"
        description="Save this design match along with your query image for later reference."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setSaveModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving} disabled={!saveName.trim()}>Save</Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <FormField label="Saved Search Name" htmlFor="saveName">
            <Input
              id="saveName"
              ref={saveNameInputRef}
              placeholder="e.g. XYZ Dealer Ring"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              autoFocus
            />
          </FormField>

          <FormField label="Dealer / Customer Name (Optional)" htmlFor="saveDealer">
            <Input
              id="saveDealer"
              placeholder="e.g. Acme Jewellery Corp"
              value={saveDealer}
              onChange={e => setSaveDealer(e.target.value)}
            />
          </FormField>

          <FormField label="Optional Notes" htmlFor="saveNotes">
            <Textarea
              id="saveNotes"
              placeholder="e.g. Dealer requested yellow gold..."
              value={saveNotes}
              onChange={e => setSaveNotes(e.target.value)}
              rows={3}
            />
          </FormField>
        </form>
      </Dialog>

      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      <ImageCropperModal
        open={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageSrc={originalPreviewUrl}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
