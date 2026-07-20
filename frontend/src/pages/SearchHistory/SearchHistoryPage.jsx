import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAISearch } from '../../context/AISearchContext';
import { Search, Clock, ArrowRight, Image as ImageIcon, Trash2 } from 'lucide-react';
import { H2, Body } from '../../design-system/components/Typography';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Pagination } from '../../design-system/components/Table';
import { Badge } from '../../design-system/components/DataDisplay';
import { Button } from '../../design-system/components/Button';
import { ToastContainer } from '../../design-system/components/Feedback';

function Thumbnail({ src, alt, apiBaseUrl, type }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="w-12 h-12 rounded bg-stone-50 flex-shrink-0 border border-stone-100 flex items-center justify-center">
        {type?.startsWith('Image') ? <ImageIcon size={16} className="text-stone-300" /> : <Search size={16} className="text-stone-200" />}
      </div>
    );
  }

  return (
    <div className="w-12 h-12 rounded overflow-hidden bg-stone-100 flex-shrink-0 border border-stone-200 flex items-center justify-center">
      <img
        src={src.startsWith('http') ? src : `${apiBaseUrl}${src}`}
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
}

export default function SearchHistoryPage() {
  const navigate = useNavigate();
  const { setPreviewUrl, setSearchResults, setHasSearched, setUploadedFile, setSearchVal } = useAISearch();
  
  const [historyData, setHistoryData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const apiBaseUrl = useMemo(() => (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3200').replace(/\/$/, ''), []);

  const addToast = (type, title, description) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6000);
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/search/history?page=${currentPage}&limit=10`, {
        credentials: 'include'
      });
      if (res.status === 401) {
        window.dispatchEvent(new Event('unauthorized'));
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch history');
      
      setHistoryData(data.rows || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      addToast('error', 'Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear all your search history? This cannot be undone.")) {
      return;
    }
    
    try {
      const res = await fetch(`${apiBaseUrl}/api/search/history`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.status === 401) {
        window.dispatchEvent(new Event('unauthorized'));
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to clear history');
      
      addToast('success', 'Success', 'Search history cleared successfully.');
      setHistoryData([]);
      setTotalPages(1);
      setCurrentPage(1);
    } catch (err) {
      addToast('error', 'Error', err.message);
    }
  };

  const handleRowClick = async (row) => {
    if (row.type?.startsWith('Image')) {
      if (row.query_image_path) {
        const fullUrl = row.query_image_path.startsWith('http') ? row.query_image_path : `${apiBaseUrl}${row.query_image_path}`;
        
        try {
          const res = await fetch(fullUrl);
          if (!res.ok) throw new Error('Image fetch failed');
          const blob = await res.blob();
          
          const file = new File([blob], row.query_image_original_name || 'query_image.jpg', { type: blob.type || 'image/jpeg' });
          setUploadedFile(file);
          setPreviewUrl(URL.createObjectURL(file));
        } catch (err) {
          setUploadedFile(new File([], row.query_image_original_name || 'image.jpg', { type: 'image/jpeg' }));
          setPreviewUrl(fullUrl);
        }
      } else {
        setPreviewUrl(null);
        setUploadedFile(null);
      }
      setSearchVal('');
    } else {
      setSearchVal(row.query);
      setPreviewUrl(null);
      setUploadedFile(null);
    }

    setSearchResults(row.search_history_results || []);
    setHasSearched(true);
    navigate('/search');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <H2 className="text-stone-800">Search History</H2>
          <Body className="text-stone-500">Audit trail of AI queries, search methods, matching catalogue items, and similarity percentages.</Body>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleClearHistory} 
          disabled={historyData.length === 0}
          className="text-error border-red-200 hover:bg-red-50"
        >
          <Trash2 size={14} className="mr-2" />
          Clear History
        </Button>
      </div>

      <div className="space-y-4 bg-white border border-stone-200 rounded-lg p-5 shadow-xs">
        <Table>
          <TableHead>
            <tr>
              <TableHeader>Query ID</TableHeader>
              <TableHeader>Query Parameter</TableHeader>
              <TableHeader>Search Type</TableHeader>
              <TableHeader>Top AI Match</TableHeader>
              <TableHeader>Similarity Score</TableHeader>
              <TableHeader align="right">Executed At</TableHeader>
            </tr>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-stone-500">Loading history...</TableCell>
              </TableRow>
            ) : historyData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-stone-500">No search history found.</TableCell>
              </TableRow>
            ) : (
              historyData.map((row) => (
                <TableRow 
                  key={row.id} 
                  onClick={() => handleRowClick(row)}
                  className="cursor-pointer hover:bg-stone-50 transition-colors"
                >
                  <TableCell>
                    <code className="text-xs font-mono text-stone-500">{row.id}</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Thumbnail 
                        src={row.query_image_path} 
                        alt={row.query_image_original_name || row.query} 
                        apiBaseUrl={apiBaseUrl} 
                        type={row.type}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-stone-900 truncate max-w-[200px]" title={row.query_image_original_name || row.query}>
                          {row.query_image_original_name || row.query}
                        </span>
                        <span className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
                          {row.type?.startsWith('Image') ? <Clock size={10} className="text-amber-600" /> : <Search size={10} className="text-stone-400" />}
                          {row.type}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.type?.startsWith('Image') ? 'accent' : 'default'} size="sm">
                      {row.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs flex items-center gap-1">
                      {row.match || '-'} {row.match && <ArrowRight size={10} className="text-stone-400" />}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-stone-800">
                      {Math.round((row.similarity || 0) * 100)}% Match
                    </span>
                  </TableCell>
                  <TableCell align="right" muted>
                    {new Date(row.time).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {historyData.length > 0 && (
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        )}
      </div>

      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
}
