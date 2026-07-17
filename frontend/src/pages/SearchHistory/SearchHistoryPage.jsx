import { useState } from 'react';
import { Search, Clock, ArrowRight } from 'lucide-react';
import { H2, Body, BodySm } from '../../design-system/components/Typography';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Pagination } from '../../design-system/components/Table';
import { Badge } from '../../design-system/components/DataDisplay';

const historyData = [
  { id: 'Q-0182', query: 'reference_sketch_ring.png', type: 'Image search', match: 'SKU-0012', similarity: 0.97, time: '2 mins ago' },
  { id: 'Q-0181', query: 'diamond solitaire band platinum', type: 'Text search', match: 'SKU-0088', similarity: 0.84, time: '14 mins ago' },
  { id: 'Q-0180', query: 'sample_emerald_pendant.jpg', type: 'Image search', match: 'SKU-0034', similarity: 0.91, time: '1 hour ago' },
  { id: 'Q-0179', query: 'pearl drops silver earring', type: 'Text search', match: 'SKU-0091', similarity: 0.89, time: '3 hours ago' },
  { id: 'Q-0178', query: 'twisted_rope_chain.jpg', type: 'Image search', match: 'SKU-0120', similarity: 0.72, time: '1 day ago' },
];

export default function SearchHistoryPage() {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="space-y-6">
      <div>
        <H2 className="text-stone-800">Search History</H2>
        <Body className="text-stone-500">Audit trail of AI queries, search methods, matching catalogue items, and similarity percentages.</Body>
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
            {historyData.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <code className="text-xs font-mono text-stone-500">{row.id}</code>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-stone-900 flex items-center gap-2">
                    {row.type.startsWith('Image') ? <Clock size={12} className="text-amber-600" /> : <Search size={12} className="text-stone-400" />}
                    {row.query}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={row.type.startsWith('Image') ? 'accent' : 'default'} size="sm">
                    {row.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs flex items-center gap-1">
                    {row.match} <ArrowRight size={10} className="text-stone-400" />
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-stone-800">
                    {Math.round(row.similarity * 100)}% Match
                  </span>
                </TableCell>
                <TableCell align="right" muted>{row.time}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Pagination page={currentPage} totalPages={3} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}
