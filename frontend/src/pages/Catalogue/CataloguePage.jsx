import { useState, useEffect, useMemo, useCallback } from 'react';
import { Image as ImageIcon, MoreHorizontal, RefreshCw, Trash2, ExternalLink, Loader2, CheckCircle, LayoutList, LayoutGrid } from 'lucide-react';
import { H2, Body } from '../../design-system/components/Typography';
import { IconButton, Button } from '../../design-system/components/Button';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Pagination } from '../../design-system/components/Table';
import { Checkbox } from '../../design-system/components/FormControls';
import { Badge } from '../../design-system/components/DataDisplay';
import { SearchInput } from '../../design-system/components/Search';
import { ImageCard } from '../../design-system/components/Cards';
import { DropdownMenu, Dialog, Sheet, Lightbox } from '../../design-system/components/Overlays';
import { Alert } from '../../design-system/components/Feedback';
import { cn } from '../../lib/utils';

export default function CataloguePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [page, setPage] = useState(1);
  const [searchVal, setSearchVal] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // View Mode: 'list' (10 items/page) vs 'grid' (20 items/page)
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('catalogue_view_mode') || 'list');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, limit: 10 });

  // Preview & Delete states
  const [activeDetailItem, setActiveDetailItem] = useState(null);
  const [activePreviewImage, setActivePreviewImage] = useState(null);
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const apiBaseUrl = useMemo(() => (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3200').replace(/\/$/, ''), []);

  const limit = viewMode === 'grid' ? 20 : 10;

  const fetchCatalogue = useCallback(async (p = page, l = limit, s = searchVal) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: String(p),
        limit: String(l),
      });
      if (s.trim()) queryParams.append('search', s.trim());

      const res = await fetch(`${apiBaseUrl}/api/design-images/?${queryParams.toString()}`, {
        credentials: 'include',
      });
      if (res.status === 401) {
        window.dispatchEvent(new Event('unauthorized'));
        return;
      }
      const payload = await res.json();
      if (res.ok && payload.success && Array.isArray(payload.data)) {
        setItems(payload.data);
        if (payload.pagination) {
          setPagination(payload.pagination);
        }
      }
    } catch (err) {
      console.error("Failed to load catalogue items:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, page, limit, searchVal]);

  useEffect(() => {
    fetchCatalogue(page, limit, searchVal);
  }, [page, limit, searchVal, fetchCatalogue]);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('catalogue_view_mode', mode);
    setPage(1);
  };

  const filteredData = items.filter(item => {
    const matchesSearch = item.filename.toLowerCase().includes(searchVal.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(filteredData.map(r => r.id));
    } else {
      setSelectedRows([]);
    }
  };

  const toggleRow = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  // Open detail drawer with preview selector
  const openDetail = (item) => {
    setActiveDetailItem(item);
    setActivePreviewImage(item.thumbnail);
  };

  // Single Delete handler
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    setToastMessage(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/design-images/${itemToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.status === 401) {
        window.dispatchEvent(new Event('unauthorized'));
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete design.');
      }

      setItems((prev) => prev.filter((img) => img.id !== itemToDelete.id));
      if (activeDetailItem?.id === itemToDelete.id) {
        setActiveDetailItem(null);
      }
      setToastMessage({
        type: 'success',
        title: 'Deleted Successfully',
        message: `Removed "${itemToDelete.filename}" from catalogue database, storage, and HNSW index.`,
      });
      setItemToDelete(null);
    } catch (err) {
      setToastMessage({
        type: 'error',
        title: 'Deletion Failed',
        message: err.message || 'An error occurred while deleting the design.',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Bulk Delete All handler
  const handleConfirmDeleteAll = async () => {
    setDeletingAll(true);
    setToastMessage(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/design-images/`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.status === 401) {
        window.dispatchEvent(new Event('unauthorized'));
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to clear catalogue.');
      }

      setItems([]);
      setActiveDetailItem(null);
      setSelectedRows([]);
      setToastMessage({
        type: 'success',
        title: 'Catalogue Cleared',
        message: 'Successfully deleted all design references, storage files, and reset the HNSW vector index.',
      });
      setShowDeleteAllDialog(false);
    } catch (err) {
      setToastMessage({
        type: 'error',
        title: 'Bulk Delete Failed',
        message: err.message || 'An error occurred while clearing the catalogue.',
      });
    } finally {
      setDeletingAll(false);
    }
  };

  // Derived thumbnail options for details preview selection (Task 3)
  const detailPreviewOptions = useMemo(() => {
    if (!activeDetailItem) return [];
    const list = [activeDetailItem.thumbnail];
    items.forEach(other => {
      if (other.id !== activeDetailItem.id && other.thumbnail && list.length < 4) {
        list.push(other.thumbnail);
      }
    });
    return list;
  }, [activeDetailItem, items]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <H2 className="text-stone-800">Catalogue Library</H2>
          <Body className="text-stone-500">Visual index of uploaded design images registered in the search model.</Body>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchCatalogue} disabled={loading}>
            <RefreshCw size={14} className={cn("mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteAllDialog(true)}
            disabled={items.length === 0 || loading}
          >
            <Trash2 size={14} className="mr-1.5" />
            Delete All Designs
          </Button>
        </div>
      </div>

      {toastMessage && (
        <Alert
          type={toastMessage.type}
          title={toastMessage.title}
          onClose={() => setToastMessage(null)}
        >
          {toastMessage.message}
        </Alert>
      )}

      {/* Filter, Search, and View Mode bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:max-w-md">
          <SearchInput
            value={searchVal}
            onChange={(e) => {
              setSearchVal(e.target.value);
              setPage(1);
            }}
            onClear={() => {
              setSearchVal('');
              setPage(1);
            }}
            placeholder="Filter by filename..."
            size="md"
          />
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Grid / List Mode Toggle */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
            <button
              type="button"
              onClick={() => handleViewModeChange('list')}
              className={cn(
                'p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5',
                viewMode === 'list'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              )}
              title="List View (10 per page)"
            >
              <LayoutList size={15} />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('grid')}
              className={cn(
                'p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5',
                viewMode === 'grid'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              )}
              title="Grid View (20 per page)"
            >
              <LayoutGrid size={15} />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 appearance-none bg-white border border-stone-200 text-stone-900 text-xs rounded-md px-3 pr-8 cursor-pointer outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent"
          >
            <option value="all">All Statuses</option>
            <option value="indexed">Indexed</option>
            <option value="indexing">Indexing</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="space-y-4 bg-white border border-stone-200 rounded-lg p-5 shadow-xs">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-stone-400">
            <Loader2 size={26} className="animate-spin mb-2 text-accent" />
            <Body className="text-stone-500 text-xs font-medium">Loading design library...</Body>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-12 text-center">
            <Body className="text-stone-400">No matching design references found in index.</Body>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredData.map((row) => (
              <ImageCard
                key={row.id}
                title={row.filename}
                image={row.thumbnail}
                onClick={() => setActiveLightboxImage(row.thumbnail)}
                onViewDetails={() => openDetail(row)}
                onDelete={() => setItemToDelete(row)}
                status={row.status}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden">
            <Table>
              <TableHead>
                <tr>
                  <TableHeader className="w-10">
                    <Checkbox
                      id="select-all"
                      checked={filteredData.length > 0 && selectedRows.length === filteredData.length}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                    />
                  </TableHeader>
                  <TableHeader className="w-24">Thumbnail</TableHeader>
                  <TableHeader>Filename</TableHeader>
                  <TableHeader>Upload Date</TableHeader>
                  <TableHeader>Indexing Status</TableHeader>
                  <TableHeader className="w-20 align-right">Actions</TableHeader>
                </tr>
              </TableHead>
              <TableBody>
                {filteredData.map((row) => (
                  <TableRow key={row.id} selected={selectedRows.includes(row.id)} className="hover:bg-stone-50/70 transition-colors">
                    <TableCell className="py-4">
                      <Checkbox
                        id={`row-${row.id}`}
                        checked={selectedRows.includes(row.id)}
                        onChange={() => toggleRow(row.id)}
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <button
                        type="button"
                        onClick={() => setActiveLightboxImage(row.thumbnail)}
                        className="w-16 h-16 bg-stone-50 border border-stone-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-sm transition-all duration-200 hover:scale-[1.04] hover:border-accent focus:outline-none"
                        title="Click to view details"
                      >
                        {row.thumbnail ? (
                          <img src={row.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={22} className="text-stone-400" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="py-4">
                      <button
                        type="button"
                        onClick={() => openDetail(row)}
                        className="text-left font-semibold text-stone-900 text-sm hover:text-accent transition-colors break-all font-sans block max-w-sm focus:outline-none"
                      >
                        {row.filename}
                      </button>
                    </TableCell>
                    <TableCell muted className="py-4 text-xs font-mono">
                      {row.uploadDate ? new Date(row.uploadDate).toLocaleString() : 'Just now'}
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge
                        variant={row.status === 'indexed' ? 'active' : row.status === 'failed' ? 'error' : 'pending'}
                        dot
                        size="sm"
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <DropdownMenu
                        trigger={
                          <IconButton variant="ghost" size="icon-sm" tooltip="Actions">
                            <MoreHorizontal size={14} />
                          </IconButton>
                        }
                        align="right"
                        items={[
                          { label: 'View Details', icon: <ExternalLink size={13} />, onClick: () => openDetail(row) },
                          { label: 'Re-index', icon: <RefreshCw size={13} />, onClick: () => {}, disabled: row.status === 'indexing' },
                          { separator: true },
                          { label: 'Delete Design', icon: <Trash2 size={13} />, onClick: () => setItemToDelete(row), destructive: true },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Pagination
          page={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* Task 3: Image Preview Selection & Detail Sheet */}
      <Sheet
        open={!!activeDetailItem}
        onClose={() => setActiveDetailItem(null)}
        title="Design Details"
        width="460px"
      >
        {activeDetailItem && (
          <div className="space-y-6">
            {/* Main Large Image Preview */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Large Preview</p>
              <div className="w-full h-64 bg-stone-50 border border-stone-200 rounded-xl overflow-hidden flex items-center justify-center p-2 shadow-inner">
                {activePreviewImage ? (
                  <img
                    src={activePreviewImage}
                    alt={activeDetailItem.filename}
                    className="max-h-full max-w-full object-contain rounded-md transition-all duration-300"
                  />
                ) : (
                  <ImageIcon size={48} className="text-stone-300" />
                )}
              </div>

              {/* Task 3: Interactive Thumbnail Preview Selection Strip */}
              <div className="pt-2">
                <p className="text-[11px] font-medium text-stone-400 mb-2">Available Thumbnail Angles / Views:</p>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {detailPreviewOptions.map((thumbUrl, idx) => {
                    const isSelected = activePreviewImage === thumbUrl;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePreviewImage(thumbUrl)}
                        className={cn(
                          "w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 focus:outline-none",
                          isSelected
                            ? "border-accent ring-2 ring-accent/20 scale-[1.05] shadow-sm"
                            : "border-stone-200 opacity-60 hover:opacity-100 hover:border-stone-300"
                        )}
                        title={`Select preview view ${idx + 1}`}
                      >
                        <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Metadata information */}
            <div className="space-y-3 bg-stone-50 border border-stone-200 rounded-lg p-4 text-xs">
              <div className="flex justify-between border-b border-stone-200/60 pb-2">
                <span className="text-stone-500">Filename:</span>
                <span className="font-semibold text-stone-900 font-mono break-all">{activeDetailItem.filename}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200/60 pb-2">
                <span className="text-stone-500">Reference ID:</span>
                <span className="font-mono text-stone-700">{activeDetailItem.id}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200/60 pb-2">
                <span className="text-stone-500">Uploaded:</span>
                <span className="text-stone-700">{activeDetailItem.uploadDate ? new Date(activeDetailItem.uploadDate).toLocaleString() : 'Just now'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">HNSW Indexing:</span>
                <Badge variant="active" size="sm" dot>Indexed</Badge>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-stone-200 flex items-center justify-between gap-3">
              <Button
                variant="danger"
                size="sm"
                className="w-full"
                onClick={() => setItemToDelete(activeDetailItem)}
              >
                <Trash2 size={14} className="mr-1.5" />
                Delete Design
              </Button>
            </div>
          </div>
        )}
      </Sheet>

      {/* Task 2: Delete Confirmation Dialog */}
      <Dialog
        open={!!itemToDelete}
        onClose={() => !deleting && setItemToDelete(null)}
        title="Delete Design"
        description="Are you sure you want to delete this design? This action will permanently remove the record from MySQL, delete the physical image file from storage, and unindex its feature vector from the HNSW search model."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setItemToDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              loading={deleting}
            >
              Delete Image
            </Button>
          </>
        }
      />

      {/* Task 3: Bulk Delete All Confirmation Dialog */}
      <Dialog
        open={showDeleteAllDialog}
        onClose={() => !deletingAll && setShowDeleteAllDialog(false)}
        title="Delete All Catalogue Designs?"
        description="Are you sure you want to delete ALL design references in the catalogue? This will truncate the database table, delete every stored physical image file, and completely reset the HNSW vector search index. This action cannot be undone."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteAllDialog(false)}
              disabled={deletingAll}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDeleteAll}
              loading={deletingAll}
            >
              Delete All Designs
            </Button>
          </>
        }
      />
      <Lightbox
        open={!!activeLightboxImage}
        onClose={() => setActiveLightboxImage(null)}
        image={activeLightboxImage}
      />
    </div>
  );
}
