import { useState } from 'react';
import { Image as ImageIcon, MoreHorizontal, RefreshCw, Trash2, ExternalLink } from 'lucide-react';
import { H2, Body } from '../../design-system/components/Typography';
import { IconButton } from '../../design-system/components/Button';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Pagination } from '../../design-system/components/Table';
import { Checkbox } from '../../design-system/components/FormControls';
import { Badge } from '../../design-system/components/DataDisplay';
import { SearchInput } from '../../design-system/components/Search';
import { DropdownMenu } from '../../design-system/components/Overlays';

const catalogueData = [
  { id: '1', filename: 'diamond_solitaire_ring_top.png', uploadDate: '2026-07-16 14:30', status: 'indexed', thumbnail: null },
  { id: '2', filename: 'emerald_cut_pendant_reference.jpg', uploadDate: '2026-07-15 09:12', status: 'indexed', thumbnail: null },
  { id: '3', filename: 'bangle_rope_gold_model.webp', uploadDate: '2026-07-14 18:45', status: 'indexing', thumbnail: null },
  { id: '4', filename: 'ruby_stud_drawing_sketch.png', uploadDate: '2026-07-12 11:20', status: 'indexed', thumbnail: null },
  { id: '5', filename: 'pearl_necklace_macro.jpg', uploadDate: '2026-07-10 16:05', status: 'failed', thumbnail: null },
  { id: '6', filename: 'sapphire_band_half_size.png', uploadDate: '2026-07-09 13:50', status: 'indexed', thumbnail: null },
];

export default function CataloguePage() {
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchVal, setSearchVal] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredData = catalogueData.filter(item => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <H2 className="text-stone-800">Catalogue Library</H2>
          <Body className="text-stone-500">Visual index of uploaded design images registered in the search model.</Body>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:max-w-md">
          <SearchInput
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onClear={() => setSearchVal('')}
            placeholder="Filter by filename..."
            size="md"
          />
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
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
              {filteredData.length > 0 ? (
                filteredData.map((row) => (
                  <TableRow key={row.id} selected={selectedRows.includes(row.id)}>
                    <TableCell className="py-4">
                      <Checkbox
                        id={`row-${row.id}`}
                        checked={selectedRows.includes(row.id)}
                        onChange={() => toggleRow(row.id)}
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="w-16 h-16 bg-stone-50 border border-stone-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-sm transition-transform duration-200 hover:scale-[1.03]">
                        {row.thumbnail ? (
                          <img src={row.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={22} className="text-stone-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="font-semibold text-stone-900 text-sm break-all font-sans block max-w-sm">
                        {row.filename}
                      </span>
                    </TableCell>
                    <TableCell muted className="py-4 text-xs font-mono">
                      {row.uploadDate}
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
                          { label: 'View Details', icon: <ExternalLink size={13} />, onClick: () => {} },
                          { label: 'Re-index', icon: <RefreshCw size={13} />, onClick: () => {}, disabled: row.status === 'indexing' },
                          { separator: true },
                          { label: 'Delete Reference', icon: <Trash2 size={13} />, onClick: () => {}, destructive: true },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Body className="text-stone-400">No matching design references found in index.</Body>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination page={currentPage} totalPages={3} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}
