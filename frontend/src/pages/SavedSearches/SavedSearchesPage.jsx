import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { H2, Body } from '../../design-system/components/Typography';
import { SearchInput } from '../../design-system/components/Search';
import { Card } from '../../design-system/components/Cards';
import { Dialog } from '../../design-system/components/Overlays';
import { Input, Textarea, FormField } from '../../design-system/components/FormControls';
import { Button } from '../../design-system/components/Button';
import { ToastContainer, Alert } from '../../design-system/components/Feedback';
import { Calendar, Trash2, Edit2, Image as ImageIcon, Maximize, Download } from 'lucide-react';
import { AdvancedLightbox } from '../../design-system/components/AdvancedLightbox';
import { EmptyState } from '../../design-system/components/States';

function Thumbnail({ src, alt, apiBaseUrl }) {
  const [error, setError] = useState(false);
  
  if (!src || error) {
    return (
      <div className="w-16 h-16 rounded bg-stone-50 flex-shrink-0 border border-stone-100 flex items-center justify-center">
        <ImageIcon size={20} className="text-stone-300" />
      </div>
    );
  }

  return (
    <div className="w-16 h-16 rounded overflow-hidden bg-stone-100 flex-shrink-0 border border-stone-200">
      <img
        src={src.startsWith('http') ? src : `${apiBaseUrl}${src}`}
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
}

export default function SavedSearchesPage() {
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState([]);

  const [selectedSearch, setSelectedSearch] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  const [editName, setEditName] = useState('');
  const [editDealer, setEditDealer] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [previewItem, setPreviewItem] = useState(null);
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  
  const apiBaseUrl = useMemo(() => (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3200').replace(/\/$/, ''), []);

  const addToast = (type, title, description) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6000);
  };

  useEffect(() => {
    const fetchSearches = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiBaseUrl}/api/saved-searches`, {
          credentials: 'include'
        });
        if (res.status === 401) {
          window.dispatchEvent(new Event('unauthorized'));
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch saved searches');
        setSearches(data.data || []);
      } catch (err) {
        addToast('error', 'Error', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSearches();
  }, [apiBaseUrl]);

  const filteredAndSortedSearches = useMemo(() => {
    let result = searches;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(s => 
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.dealerName && s.dealerName.toLowerCase().includes(q)) ||
        (s.notes && s.notes.toLowerCase().includes(q)) ||
        (s.queryImage && s.queryImage.originalName && s.queryImage.originalName.toLowerCase().includes(q)) ||
        (s.designImage && s.designImage.title && s.designImage.title.toLowerCase().includes(q))
      );
    }
    
    return result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'name_az') return a.name.localeCompare(b.name);
      if (sortBy === 'name_za') return b.name.localeCompare(a.name);
      return 0;
    });
  }, [searches, searchTerm, sortBy]);

  const handleOpenDetails = (item) => {
    setSelectedSearch(item);
    setEditName(item.name);
    setEditDealer(item.dealerName || '');
    setEditNotes(item.notes || '');
    setDetailsOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !selectedSearch) return;

    setSaving(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/saved-searches/${selectedSearch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), dealerName: editDealer.trim(), notes: editNotes.trim() }),
        credentials: 'include'
      });
      if (res.status === 401) {
        window.dispatchEvent(new Event('unauthorized'));
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update');
      
      addToast('success', 'Updated', 'Saved search updated successfully.');
      setDetailsOpen(false);

      setSearches(prev => prev.map(s => s.id === selectedSearch.id ? { ...s, name: editName.trim(), dealerName: editDealer.trim(), notes: editNotes.trim() } : s));
      setSelectedSearch(prev => ({ ...prev, name: editName.trim(), dealerName: editDealer.trim(), notes: editNotes.trim() }));
    } catch (err) {
      addToast('error', 'Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  
  const handleDownload = async (imgUrl, title) => {
    if (!imgUrl) return;
    const fullUrl = imgUrl.startsWith('http') ? imgUrl : `${apiBaseUrl}${imgUrl}`;
    try {
      const response = await fetch(fullUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = title ? `${title}.jpg` : 'design.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed', error);
      const a = document.createElement('a');
      a.href = fullUrl;
      a.download = title ? `${title}.jpg` : 'design.jpg';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this saved search?")) return;
    
    try {
      const res = await fetch(`${apiBaseUrl}/api/saved-searches/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.status === 401) {
        window.dispatchEvent(new Event('unauthorized'));
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete');
      
      addToast('success', 'Deleted', 'Saved search deleted.');
      setSearches(prev => prev.filter(s => s.id !== id));
      if (selectedSearch?.id === id) {
        setDetailsOpen(false);
      }
    } catch (err) {
      addToast('error', 'Error', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <H2 className="text-stone-800">Saved Searches</H2>
          <Body className="text-stone-500">Access your saved client enquiries and selected designs.</Body>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-64">
            <SearchInput
              id="saved-search-filter"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
              placeholder="Search by name, notes, or dealer..."
              size="md"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 appearance-none bg-white border border-stone-200 text-stone-700 text-sm font-medium rounded-md px-3 pr-8 cursor-pointer outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name_az">Name A-Z</option>
            <option value="name_za">Name Z-A</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-stone-500">Loading saved searches...</div>
        ) : searches.length === 0 && !searchTerm ? (
          <div className="col-span-full">
            <EmptyState
              type="search"
              title="No saved searches yet"
              description="Save important design matches to quickly access them later."
              action={<Button variant="primary" onClick={() => navigate('/search')}>Go to Search</Button>}
            />
          </div>
        ) : filteredAndSortedSearches.length === 0 ? (
          <div className="col-span-full">
             <Alert type="info" title="No Matches">
               No saved searches matched your current filter.
             </Alert>
          </div>
        ) : (
          filteredAndSortedSearches.map(item => (
            <Card 
              key={item.id} 
              padding="sm" 
              className="flex flex-col h-full bg-white relative group"
            >
              <button 
                onClick={(e) => { e.stopPropagation(); handleOpenDetails(item); }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="Edit Search Details"
              >
                <Edit2 size={14} />
              </button>

              <div className="flex gap-3 items-center mb-3">
                <div className="flex -space-x-4 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setPreviewItem(item)}>
                  <Thumbnail src={item.queryImage.path} alt="Query" apiBaseUrl={apiBaseUrl} />
                  <div className="z-10 shadow-sm border border-stone-200 rounded bg-white">
                    <Thumbnail src={item.designImage.path} alt="Result" apiBaseUrl={apiBaseUrl} />
                  </div>
                </div>
                <div className="min-w-0 flex-1 ml-2">
                  <h3 className="text-sm font-semibold text-stone-900 truncate pr-6" title={item.name}>{item.name}</h3>
                  {item.dealerName && (
                    <div className="text-xs text-accent font-medium mt-0.5 truncate" title={item.dealerName}>
                      {item.dealerName}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-stone-400">
                    <Calendar size={10} />
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 text-xs text-stone-600 line-clamp-3 mb-4 bg-stone-50 p-2 rounded border border-stone-100 overflow-hidden break-words">
                {item.notes || <span className="italic text-stone-400">No notes provided.</span>}
              </div>
              
              <div className="mt-auto pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs py-1.5 h-auto" onClick={() => setPreviewItem(item)}>
                  <Maximize size={14} className="mr-1.5" /> Preview
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs py-1.5 h-auto" onClick={() => handleDownload(item.designImage.path, item.name)}>
                  <Download size={14} className="mr-1.5" /> Download
                </Button>
                <Button variant="outline" size="sm" className="text-error border-red-200 hover:bg-red-50 text-xs px-2 py-1.5 h-auto" onClick={() => handleDelete(item.id)} title="Delete">
                  <Trash2 size={14} />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {selectedSearch && (
        <Dialog
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          title="Edit Saved Search"
          size="sm"
        >
          <form id="edit-saved-search" onSubmit={handleUpdate} className="space-y-4 pt-2">
            <FormField label="Saved Search Name" htmlFor="editName" required>
              <Input 
                id="editName" 
                value={editName}
                onChange={e => setEditName(e.target.value)}
                autoFocus
              />
            </FormField>
            
            <FormField label="Dealer / Customer Name (Optional)" htmlFor="editDealer">
              <Input 
                id="editDealer" 
                placeholder="e.g. Acme Jewellery Corp"
                value={editDealer}
                onChange={e => setEditDealer(e.target.value)}
              />
            </FormField>
            
            <FormField label="Notes" htmlFor="editNotes">
              <Textarea 
                id="editNotes" 
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                rows={4}
              />
            </FormField>
            
            <div className="pt-4 flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setDetailsOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={saving}>Save Changes</Button>
            </div>
          </form>
        </Dialog>
      )}

      <AdvancedLightbox
        open={!!previewItem}
        onClose={() => setPreviewItem(null)}
        items={previewItem ? [{
          image: previewItem.designImage.path,
          title: previewItem.name,
          sku: previewItem.designImage.sku
        }] : []}
        currentIndex={0}
        apiBaseUrl={apiBaseUrl}
      />
      
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
}
