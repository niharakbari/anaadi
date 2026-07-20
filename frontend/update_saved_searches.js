const fs = require('fs');

const file = './src/pages/SavedSearches/SavedSearchesPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replacements
content = content.replace(
  "import { Calendar, Trash2, Edit2, ChevronRight, Image as ImageIcon } from 'lucide-react';",
  "import { Calendar, Trash2, Edit2, ChevronRight, Image as ImageIcon, Maximize, Download } from 'lucide-react';\nimport { AdvancedLightbox } from '../../design-system/components/AdvancedLightbox';\nimport { EmptyState } from '../../design-system/components/States';"
);

// Add dealerName to edit state
content = content.replace(
  "const [editName, setEditName] = useState('');\n  const [editNotes, setEditNotes] = useState('');",
  "const [editName, setEditName] = useState('');\n  const [editDealer, setEditDealer] = useState('');\n  const [editNotes, setEditNotes] = useState('');\n  const [sortBy, setSortBy] = useState('newest');\n  const [previewItem, setPreviewItem] = useState(null);\n  const navigate = useNavigate();"
);

// Update fetchSearches
content = content.replace(
  /const fetchSearches = async[^\}]+\};\s*\n\s*useEffect\(\(\) => \{[^}]+\}, \[searchTerm\]\);/g,
  `const fetchSearches = async () => {
    setLoading(true);
    try {
      const res = await fetch(\`\${apiBaseUrl}/api/saved-searches\`, {
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

  useEffect(() => {
    fetchSearches();
  }, []);

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
  }, [searches, searchTerm, sortBy]);`
);

// Update handleOpenDetails
content = content.replace(
  /const handleOpenDetails = \(item\) => \{[\s\S]*?setDetailsOpen\(true\);\n  \};/,
  `const handleOpenDetails = (item) => {
    setSelectedSearch(item);
    setEditName(item.name);
    setEditDealer(item.dealerName || '');
    setEditNotes(item.notes || '');
    setEditMode(true);
    setDetailsOpen(true);
  };`
);

// Update handleUpdate
content = content.replace(
  /body: JSON\.stringify\(\{ name: editName\.trim\(\), notes: editNotes\.trim\(\) \}\),/g,
  `body: JSON.stringify({ name: editName.trim(), dealerName: editDealer.trim(), notes: editNotes.trim() }),`
);

content = content.replace(
  /\{ \.\.\.s, name: editName\.trim\(\), notes: editNotes\.trim\(\) \}/g,
  `{ ...s, name: editName.trim(), dealerName: editDealer.trim(), notes: editNotes.trim() }`
);

content = content.replace(
  /\{ \.\.\.prev, name: editName\.trim\(\), notes: editNotes\.trim\(\) \}/g,
  `{ ...prev, name: editName.trim(), dealerName: editDealer.trim(), notes: editNotes.trim() }`
);

// Add download function
const handleDownloadCode = `
  const handleDownload = async (imgUrl, title) => {
    if (!imgUrl) return;
    const fullUrl = imgUrl.startsWith('http') ? imgUrl : \`\${apiBaseUrl}\${imgUrl}\`;
    try {
      const response = await fetch(fullUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = title ? \`\${title}.jpg\` : 'design.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed', error);
      const a = document.createElement('a');
      a.href = fullUrl;
      a.download = title ? \`\${title}.jpg\` : 'design.jpg';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };
`;
content = content.replace("const handleDelete = async (id) => {", handleDownloadCode + "\n  const handleDelete = async (id) => {");

// Update top header area (add sort by)
content = content.replace(
  /<div className="flex items-center justify-between">[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/,
  `<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
      </div>`
);

// Update grid and empty state
content = content.replace(
  /searches\.length === 0 \? \([\s\S]*?\) : \(/,
  `searches.length === 0 && !searchTerm ? (
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
        ) : (`
);

content = content.replace(/searches\.map/g, "filteredAndSortedSearches.map");

// Card update
const oldCardRegex = /<Card[\s\S]*?<\/Card>/;
const newCard = `<Card 
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
            </Card>`;
content = content.replace(oldCardRegex, newCard);

// Remove complex details modal visual section, just keep edit form
const oldDialogRegex = /<Dialog[\s\S]*?<\/Dialog>/;
const newDialog = `<Dialog
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
        </Dialog>`;
content = content.replace(oldDialogRegex, newDialog);

// Add AdvancedLightbox before ToastContainer
content = content.replace(
  /<ToastContainer/,
  `<AdvancedLightbox
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
      
      <ToastContainer`
);

fs.writeFileSync(file, content);
console.log('SavedSearchesPage updated');
