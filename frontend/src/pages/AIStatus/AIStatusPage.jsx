import { useState, useEffect, useCallback } from 'react';
import { Cpu, Server, Activity, RefreshCw } from 'lucide-react';
import { H2, Body } from '../../design-system/components/Typography';
import { StatCard, Card } from '../../design-system/components/Cards';
import { Badge } from '../../design-system/components/DataDisplay';
import { Button } from '../../design-system/components/Button';

export default function AIStatusPage() {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3200').replace(/\/$/, '');

  const fetchMetadata = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`${apiBaseUrl}/api/health/ai`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setMetadata(data);
    } catch (err) {
      console.error('Metadata fetch error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // Derived properties from backend response
  const meta = metadata?.metadata || {};
  const isEmbedderReady = metadata?.embeddingService?.ready;
  const isIndexReady = metadata?.indexService?.ready;
  const isReady = isEmbedderReady && isIndexReady;

  return (
    <div className="space-y-6">
      <div>
        <H2 className="text-stone-800">AI Status & Health</H2>
        <Body className="text-stone-500">Monitor the active AI model, index size, and system health.</Body>
      </div>

      {/* Services Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Vector Database" value={isIndexReady ? "Online" : "Loading"} icon={Server} change="Local HNSW" trend="up" />
        <StatCard 
          label={meta?.displayName || 'Embedder Model'} 
          value={isEmbedderReady ? "Active" : "Initializing"} 
          icon={Cpu} 
          change={meta?.runtime || 'ONNX Runtime'} 
          trend="up" 
        />
        <StatCard label="AI Gateway" value="Active" icon={Activity} change="Node.js Service" trend="up" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Model Meta info */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <H2 className="text-stone-800 text-sm font-semibold">Model Specifications</H2>
            {error && (
              <Button onClick={fetchMetadata} variant="outline" size="sm" className="h-8 flex items-center gap-2">
                <RefreshCw size={14} /> Retry
              </Button>
            )}
          </div>
          
          <div className="space-y-3">
            {loading ? (
              // Skeleton Loaders
              [...Array(8)].map((_, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-stone-100 last:border-0">
                  <div className="h-4 w-24 bg-stone-100 rounded animate-pulse" />
                  <div className="h-4 w-32 bg-stone-100 rounded animate-pulse" />
                </div>
              ))
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                <p className="text-sm font-semibold text-stone-700">Model information is currently unavailable.</p>
                <p className="text-xs text-stone-500">The AI search service may still be operational.</p>
              </div>
            ) : (
              [
                { label: 'Model Name', value: `${meta.displayName} ${meta.variant}` },
                { label: 'Architecture', value: meta.displayName?.includes('CLIP') ? 'Vision Transformer' : 'Neural Network' },
                { label: 'Embedding Dimension', value: `${meta.embeddingDimension}` },
                { label: 'Input Size', value: `${meta.inputResolution} × ${meta.inputResolution}` },
                { label: 'Similarity', value: meta.distanceMetric ? meta.distanceMetric.charAt(0).toUpperCase() + meta.distanceMetric.slice(1) : 'Cosine' },
                { label: 'Index', value: 'HNSW' },
                { label: 'Indexed Designs', value: meta.loadedVectors?.toLocaleString() || '0' },
                { 
                  label: 'Status', 
                  value: (
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isReady ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      {isReady ? 'Ready' : 'Loading'}
                    </span>
                  )
                },
              ].map((row) => (
                <div key={row.label} className="flex justify-between py-2 border-b border-stone-100 last:border-0 text-sm">
                  <span className="text-stone-500">{row.label}</span>
                  <span className="font-medium text-stone-800">{row.value}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Index updates stream */}
        <Card className="p-6 space-y-4">
          <H2 className="text-stone-800 text-sm font-semibold mb-2">Recent Index Updates</H2>
          <div className="space-y-4">
            {[
              { time: '10:14 AM', event: 'Vector model updated for newly indexed design references', tag: 'Updated' },
              { time: '09:44 AM', event: 'HNSW Index saved & flushed to vector database', tag: 'System' },
              { time: '09:30 AM', event: 'Imported new vectors from bulk upload', tag: 'Import' },
            ].map((e, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-700">{e.event}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{e.time} · {e.tag}</p>
                </div>
                <Badge variant="info" size="xs">Success</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
