import { useState } from 'react';
import { H2, Body, Label } from '../../design-system/components/Typography';
import { SearchInput } from '../../design-system/components/Search';
import { Card, ImageCard } from '../../design-system/components/Cards';
import { UploadZone } from '../../design-system/components/Upload';
import { EmptyState } from '../../design-system/components/States';
import { Button } from '../../design-system/components/Button';
import { X } from 'lucide-react';

const mockResults = [
  { title: 'Diamond Solitaire Ring', sku: 'SKU-0012', category: 'Rings · 18K Gold', similarity: 0.97, status: 'active' },
  { title: 'Twisted Band Ring',      sku: 'SKU-0088', category: 'Rings · Platinum', similarity: 0.84, status: 'active' },
  { title: 'Eternity Band',          sku: 'SKU-0045', category: 'Rings · 22K Gold', similarity: 0.79, status: 'pending'},
  { title: 'Halo Engagement Ring',   sku: 'SKU-0023', category: 'Rings · White Gold', similarity: 0.71, status: 'archived'},
];

export default function AISearchPage() {
  const [searchVal, setSearchVal] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleUpload = (files) => {
    if (files.length > 0) {
      const file = files[0];
      setUploadedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setHasSearched(true);
    }
  };

  const handleTextSearch = (e) => {
    if (e.key === 'Enter' && searchVal.trim() !== '') {
      setHasSearched(true);
    }
  };

  const triggerSearch = () => {
    if (searchVal.trim() !== '' || uploadedFile) {
      setHasSearched(true);
    }
  };

  const handleClear = () => {
    setSearchVal('');
    setUploadedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setHasSearched(false);
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
              <Label className="text-stone-500 block font-semibold">Search Input</Label>
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
                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleClear}
                    disabled={!searchVal && !uploadedFile}
                    className="flex-1 sm:flex-initial"
                  >
                    Clear
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={triggerSearch}
                    disabled={!searchVal.trim() && !uploadedFile}
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
        
        {hasSearched ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mockResults.map((card) => (
              <ImageCard
                key={card.sku}
                {...card}
                onClick={() => {}}
              />
            ))}
          </div>
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
