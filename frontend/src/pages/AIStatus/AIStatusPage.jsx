import { Cpu, Server, Activity } from 'lucide-react';
import { H2, Body } from '../../design-system/components/Typography';
import { StatCard, Card } from '../../design-system/components/Cards';
import { Badge } from '../../design-system/components/DataDisplay';

export default function AIStatusPage() {
  return (
    <div className="space-y-6">
      <div>
        <H2 className="text-stone-800">AI Model Status & System Health</H2>
        <Body className="text-stone-500">Monitor HNSW vector indexes, OpenCLIP embedder neural networks, and execution runtime uptimes.</Body>
      </div>

      {/* Services Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="HNSW Vector Database" value="Online" icon={Server} change="0.4ms Latency" trend="up" />
        <StatCard label="OpenCLIP Embedder (ViT-H-14)" value="Active" icon={Cpu} change="ONNX Runtime Engine" trend="up" />
        <StatCard label="Node.js AI Service Gateway" value="Active" icon={Activity} change="Uptime: 100%" trend="up" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Model Meta info */}
        <Card className="p-6 space-y-4">
          <H2 className="text-stone-800 text-sm font-semibold mb-2">Model Specifications</H2>
          <div className="space-y-3">
            {[
              { label: 'Active Model Version', value: 'OpenCLIP ViT-H-14 (laion2b_s32b_b79k)' },
              { label: 'Vector Dimensions', value: '1024 float32' },
              { label: 'Index Database Engine', value: 'HNSW (Hierarchical Navigable Small World)' },
              { label: 'Execution Runtime', value: 'ONNX Runtime (CPU/GPU-accelerated)' },
              { label: 'API Orchestrator', value: 'Node.js AI service' },
              { label: 'Total Index Size', value: '12,480 vectors' },
              { label: 'Last Model Update', value: 'July 12, 2026' },
            ].map((row) => (
              <div key={row.label} className="flex justify-between py-2 border-b border-stone-100 last:border-0 text-sm">
                <span className="text-stone-500">{row.label}</span>
                <span className="font-semibold text-stone-800">{row.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Index updates stream */}
        <Card className="p-6 space-y-4">
          <H2 className="text-stone-800 text-sm font-semibold mb-2">Recent Index Updates</H2>
          <div className="space-y-4">
            {[
              { time: '10:14 AM', event: 'Vector model updated for newly indexed design references', tag: 'Updated' },
              { time: '09:44 AM', event: 'HNSW Index saved & flushed to vector database', tag: 'System' },
              { time: '09:30 AM', event: 'Imported 12 new vectors from Node.js sync coordinator', tag: 'Import' },
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
