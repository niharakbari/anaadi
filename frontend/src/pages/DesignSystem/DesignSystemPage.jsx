import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Upload, Database, LayoutDashboard, Settings,
  Bell, Plus, Download, Filter, MoreHorizontal, Gem,
  Layers, Sparkles, Tag as TagIcon, TrendingUp,
  Archive, Edit2, Trash2, ExternalLink, Copy, Share2,
  Users, ChevronRight, Star, Zap, ShieldCheck, Clock, Info, AlertCircle
} from 'lucide-react';

// Design System Imports
import { Display, H1, H2, H3, H4, Body, BodyLg, BodySm, Caption, Label, Code } from '../../design-system/components/Typography';
import { Button, IconButton, ButtonGroup } from '../../design-system/components/Button';
import { Input, Textarea, FormField, Select, Checkbox, Switch } from '../../design-system/components/FormControls';
import { SearchInput, SearchFilters } from '../../design-system/components/Search';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, ImageCard, StatCard, ActionCard, Divider } from '../../design-system/components/Cards';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Pagination } from '../../design-system/components/Table';
import { Badge, Tag, Avatar, AvatarGroup } from '../../design-system/components/DataDisplay';
import { Toast, ToastContainer, Alert } from '../../design-system/components/Feedback';
import { EmptyState, Spinner, SkeletonCard, SkeletonImageCard, ErrorState, SuccessState } from '../../design-system/components/States';
import { Dialog, Sheet, Tooltip, DropdownMenu } from '../../design-system/components/Overlays';
import { UploadZone } from '../../design-system/components/Upload';
import { Sidebar, TopBar, Breadcrumb } from '../../design-system/components/Navigation';

// ─── Demo Data ────────────────────────────────────────────────────────────────
const tableData = [
  { id: 'SKU-0012', name: 'Diamond Solitaire Ring', category: 'Rings', material: '18K Gold', status: 'active',  updated: '2h ago' },
  { id: 'SKU-0034', name: 'Emerald Pendant Set',    category: 'Pendants', material: 'Platinum', status: 'pending',  updated: '1d ago' },
  { id: 'SKU-0067', name: 'Ruby Bangles Classic',   category: 'Bangles', material: '22K Gold', status: 'active',  updated: '3d ago' },
  { id: 'SKU-0091', name: 'Pearl Drop Earrings',    category: 'Earrings', material: 'Sterling Silver', status: 'archived', updated: '1w ago' },
  { id: 'SKU-0102', name: 'Sapphire Tennis Bracelet',category:'Bracelets',material: 'White Gold', status: 'error', updated: 'just now' },
];

const filterOptions = [
  { key: 'rings',    label: 'Rings',    count: 248 },
  { key: 'pendants', label: 'Pendants', count: 124 },
  { key: 'earrings', label: 'Earrings', count: 96  },
  { key: 'bangles',  label: 'Bangles',  count: 72  },
  { key: 'custom',   label: 'Custom',   count: 18  },
];

const imageMockCards = [
  { title: 'Diamond Solitaire Ring', sku: 'SKU-0012', category: 'Rings · 18K Gold', similarity: 0.97, status: 'active' },
  { title: 'Twisted Band Ring',      sku: 'SKU-0088', category: 'Rings · Platinum', similarity: 0.84, status: 'active' },
  { title: 'Eternity Band',          sku: 'SKU-0045', category: 'Rings · 22K Gold', similarity: 0.79, status: 'pending'},
  { title: 'Halo Engagement Ring',   sku: 'SKU-0023', category: 'Rings · White Gold', similarity: 0.71, status: 'archived'},
];

// ─── Section Wrapper ──────────────────────────────────────────────────────────
function Section({ id, title, subtitle, children }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      className="py-12 border-b border-stone-100 last:border-0"
    >
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-5 bg-accent rounded-full" />
          <H3 className="text-stone-800">{title}</H3>
        </div>
        {subtitle && <BodySm className="text-stone-400 ml-3">{subtitle}</BodySm>}
      </div>
      {children}
    </motion.section>
  );
}

function SubSection({ title, children, className }) {
  return (
    <div className={`space-y-4 ${className || ''}`}>
      <Label className="text-stone-400">{title}</Label>
      {children}
    </div>
  );
}

function Row({ children, className }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className || ''}`}>
      {children}
    </div>
  );
}

// ─── Color Swatch ─────────────────────────────────────────────────────────────
function Swatch({ color, label, hex, textDark }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-[80px]">
      <div
        className="w-full h-12 rounded-lg border border-stone-200/50 shadow-xs"
        style={{ backgroundColor: hex }}
      />
      <div>
        <p className={`text-[11px] font-medium ${textDark ? 'text-stone-700' : 'text-stone-600'}`}>{label}</p>
        <p className="text-[10px] text-stone-400 font-mono">{hex}</p>
      </div>
    </div>
  );
}

export default function DesignSystemPage() {
  // State for interactive demos
  const [searchVal, setSearchVal]         = useState('');
  const [activeFilters, setActiveFilters] = useState(['rings']);
  const [checked, setChecked]             = useState(true);
  const [switched, setSwitched]           = useState(true);
  const [dialogOpen, setDialogOpen]       = useState(false);
  const [sheetOpen, setSheetOpen]         = useState(false);
  const [sortDir, setSortDir]             = useState('asc');
  const [currentPage, setCurrentPage]     = useState(2);
  const [activeNav, setActiveNav]         = useState('search');
  const [toasts, setToasts]               = useState([]);
  const [selectedRows, setSelectedRows]   = useState([]);

  const addToast = (type, title, description) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const toggleFilter = (key) => {
    setActiveFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const nav = [
    { id: 'colors',      label: 'Colors' },
    { id: 'typography',  label: 'Typography' },
    { id: 'buttons',     label: 'Buttons' },
    { id: 'forms',       label: 'Form Controls' },
    { id: 'search',      label: 'Search' },
    { id: 'cards',       label: 'Cards' },
    { id: 'table',       label: 'Table' },
    { id: 'badges',      label: 'Badges & Tags' },
    { id: 'states',      label: 'States' },
    { id: 'upload',      label: 'Upload' },
    { id: 'overlays',    label: 'Overlays' },
    { id: 'navigation',  label: 'Navigation' },
    { id: 'motion',      label: 'Motion' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* ── Fixed Nav ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-sm border-b border-stone-200 h-14 flex items-center px-8 gap-6">
        <div className="flex items-center gap-2.5 mr-6 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <Gem size={14} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-900 leading-none">Anaadi</p>
            <p className="text-[9px] text-stone-400 leading-none mt-0.5">Design System</p>
          </div>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {nav.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="shrink-0 px-3 py-1.5 rounded-md text-xs font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-all duration-100"
            >
              {item.label}
            </a>
          ))}
        </div>
        <div className="ml-auto shrink-0">
          <Badge variant="accent" size="md" dot>v1.0 · Light</Badge>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="pt-14">
        <div className="max-w-5xl mx-auto px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
            className="mb-4"
          >
            <span className="inline-flex items-center gap-1.5 h-6 px-3 rounded-full bg-accent-subtle border border-amber-200 text-xs font-semibold text-accent mb-6">
              <Sparkles size={11} />
              Enterprise Design System
            </span>
            <Display className="mb-4 max-w-3xl">
              AI-Powered Jewellery Search
              <span className="block text-accent">Design System</span>
            </Display>
            <BodyLg className="text-stone-500 max-w-xl">
              A premium, minimal enterprise design language for internal manufacturing tools.
              Built with React, Tailwind CSS, and Framer Motion.
            </BodyLg>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
            className="flex flex-wrap items-center gap-3 mt-8"
          >
            {[
              { icon: Layers, label: '8px Grid System' },
              { icon: Sparkles, label: 'Framer Motion' },
              { icon: ShieldCheck, label: 'WCAG Accessible' },
              { icon: Zap, label: 'CVA Variants' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-medium text-stone-600">
                <Icon size={12} className="text-accent" />
                {label}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-8 pb-24 space-y-0">

        {/* ══ 01. COLORS ══════════════════════════════════════════════════ */}
        <Section id="colors" title="Color Palette" subtitle="Warm Stone neutrals + Amber gold accent — no cold greys">
          <div className="space-y-8">
            <SubSection title="Brand Accent">
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Accent',       hex: '#B45309' },
                  { label: 'Accent Hover', hex: '#92400E' },
                  { label: 'Accent Bright',hex: '#D97706' },
                  { label: 'Accent Subtle',hex: '#FEF3C7' },
                  { label: 'Accent Muted', hex: '#FDE68A' },
                ].map((s) => <Swatch key={s.label} {...s} />)}
              </div>
            </SubSection>

            <SubSection title="Stone Neutrals">
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Stone 50',  hex: '#FAFAF9' },
                  { label: 'Stone 100', hex: '#F5F5F4' },
                  { label: 'Stone 200', hex: '#E7E5E4' },
                  { label: 'Stone 300', hex: '#D6D3D1' },
                  { label: 'Stone 400', hex: '#A8A29E' },
                  { label: 'Stone 500', hex: '#78716C' },
                  { label: 'Stone 600', hex: '#57534E' },
                  { label: 'Stone 700', hex: '#44403C' },
                  { label: 'Stone 800', hex: '#292524' },
                  { label: 'Stone 900', hex: '#1C1917' },
                ].map((s) => <Swatch key={s.label} {...s} />)}
              </div>
            </SubSection>

            <SubSection title="Semantic Colors">
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Success',      hex: '#15803D' },
                  { label: 'Success Sub.', hex: '#DCFCE7' },
                  { label: 'Warning',      hex: '#D97706' },
                  { label: 'Warning Sub.', hex: '#FEF3C7' },
                  { label: 'Error',        hex: '#DC2626' },
                  { label: 'Error Sub.',   hex: '#FEF2F2' },
                  { label: 'Info',         hex: '#2563EB' },
                  { label: 'Info Sub.',    hex: '#EFF6FF' },
                ].map((s) => <Swatch key={s.label} {...s} />)}
              </div>
            </SubSection>

            <SubSection title="Usage Roles">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { role: 'Background Base',  token: '--bg-base',      hex: '#FAFAF9', desc: 'App background' },
                  { role: 'Surface',          token: '--bg-surface',   hex: '#FFFFFF', desc: 'Cards, panels' },
                  { role: 'Text Primary',     token: '--text-primary', hex: '#1C1917', desc: 'Headings, body' },
                  { role: 'Text Secondary',   token: '--text-secondary',hex:'#57534E', desc: 'Descriptions' },
                  { role: 'Border Default',   token: '--border-default',hex:'#E7E5E4', desc: 'Cards, inputs' },
                  { role: 'Border Focus',     token: '--border-focus', hex: '#B45309', desc: 'Active inputs' },
                ].map((row) => (
                  <div key={row.role} className="flex items-center gap-3 p-3 bg-white border border-stone-200 rounded-lg">
                    <div className="w-8 h-8 rounded-md border border-stone-200 shrink-0" style={{ backgroundColor: row.hex }} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-stone-800">{row.role}</p>
                      <p className="text-[10px] text-stone-400 font-mono">{row.token}</p>
                    </div>
                    <Caption className="ml-auto shrink-0">{row.desc}</Caption>
                  </div>
                ))}
              </div>
            </SubSection>
          </div>
        </Section>

        {/* ══ 02. TYPOGRAPHY ══════════════════════════════════════════════ */}
        <Section id="typography" title="Typography" subtitle="Inter (sans) + JetBrains Mono (code) · 8-step scale">
          <div className="space-y-6">
            <Card padding="lg">
              <div className="space-y-5 divide-y divide-stone-100">
                {[
                  { comp: <Display>Display — 36px / 700</Display>, label: 'Display', spec: '36px · 700 · −0.02em' },
                  { comp: <H1>Heading 1 — 28px / 600</H1>, label: 'H1', spec: '28px · 600 · −0.02em' },
                  { comp: <H2>Heading 2 — 22px / 600</H2>, label: 'H2', spec: '22px · 600 · −0.015em' },
                  { comp: <H3>Heading 3 — 18px / 600</H3>, label: 'H3', spec: '18px · 600 · −0.01em' },
                  { comp: <H4>Heading 4 — 15px / 600</H4>, label: 'H4', spec: '15px · 600 · −0.005em' },
                  { comp: <BodyLg>Body Large — 16px / 400 — Used for primary reading text and descriptions where comfortable reading is priority.</BodyLg>, label: 'Body LG', spec: '16px · 400 · 1.6 leading' },
                  { comp: <Body>Body — 14px / 400 — Default UI text across the entire application.</Body>, label: 'Body', spec: '14px · 400 · 1.5 leading' },
                  { comp: <BodySm>Body Small — 13px / 400 — Secondary text, helper text, metadata labels.</BodySm>, label: 'Body SM', spec: '13px · 400' },
                  { comp: <Caption>Caption — 12px / 400 — Timestamps, file sizes, subordinate metadata</Caption>, label: 'Caption', spec: '12px · 400' },
                  { comp: <Label>Label — 12px / 500 · uppercase · +0.02em tracking</Label>, label: 'Label', spec: '12px · 500 · UPPERCASE' },
                  { comp: <Code>const result = await searchJewellery(query);</Code>, label: 'Code', spec: '13px · JetBrains Mono' },
                ].map(({ comp, label, spec }) => (
                  <div key={label} className="flex items-baseline gap-6 py-4 first:pt-0 last:pb-0">
                    <div className="w-20 shrink-0">
                      <Caption>{label}</Caption>
                      <p className="text-[10px] text-stone-300 mt-0.5 font-mono">{spec}</p>
                    </div>
                    <div className="flex-1 min-w-0">{comp}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </Section>

        {/* ══ 03. BUTTONS ═════════════════════════════════════════════════ */}
        <Section id="buttons" title="Button Variants" subtitle="CVA-powered variants — all with focus ring, active scale, and loading state">
          <div className="space-y-8">
            <SubSection title="Variants">
              <Row>
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="accent-subtle">Accent Subtle</Button>
                <Button variant="link">Link Button</Button>
              </Row>
            </SubSection>

            <SubSection title="Sizes">
              <Row className="items-end">
                <Button size="xs">Extra Small</Button>
                <Button size="sm">Small</Button>
                <Button size="md">Medium (Default)</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
              </Row>
            </SubSection>

            <SubSection title="With Icons">
              <Row>
                <Button iconLeft={<Plus size={14} />}>New Design</Button>
                <Button variant="secondary" iconLeft={<Upload size={14} />}>Upload Image</Button>
                <Button variant="outline" iconRight={<Download size={14} />}>Export CSV</Button>
                <Button variant="ghost" iconLeft={<Filter size={14} />}>Filter</Button>
              </Row>
            </SubSection>

            <SubSection title="Loading States">
              <Row>
                <Button loading>Searching…</Button>
                <Button variant="secondary" loading>Uploading…</Button>
                <Button variant="outline" loading>Processing…</Button>
              </Row>
            </SubSection>

            <SubSection title="Disabled">
              <Row>
                <Button disabled>Primary Disabled</Button>
                <Button variant="secondary" disabled>Secondary Disabled</Button>
                <Button variant="outline" disabled>Outline Disabled</Button>
              </Row>
            </SubSection>

            <SubSection title="Icon Buttons">
              <Row>
                <Tooltip content="Add item">
                  <IconButton variant="primary" size="icon"><Plus size={16} /></IconButton>
                </Tooltip>
                <Tooltip content="Upload">
                  <IconButton variant="secondary" size="icon"><Upload size={16} /></IconButton>
                </Tooltip>
                <Tooltip content="Settings">
                  <IconButton variant="ghost" size="icon"><Settings size={16} /></IconButton>
                </Tooltip>
                <Tooltip content="Delete" side="bottom">
                  <IconButton variant="ghost" size="icon" className="text-error hover:bg-error-subtle hover:text-error">
                    <Trash2 size={16} />
                  </IconButton>
                </Tooltip>
              </Row>
            </SubSection>

            <SubSection title="Button Group (Segmented Control)">
              <ButtonGroup>
                <Button variant="secondary" size="sm">Grid</Button>
                <Button variant="ghost" size="sm">List</Button>
                <Button variant="ghost" size="sm">Table</Button>
              </ButtonGroup>
            </SubSection>
          </div>
        </Section>

        {/* ══ 04. FORM CONTROLS ═══════════════════════════════════════════ */}
        <Section id="forms" title="Form Controls" subtitle="Inputs, selects, checkboxes, and switches with consistent focus rings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1 */}
            <div className="space-y-5">
              <FormField label="Design Name" htmlFor="design-name" hint="Enter the official catalogue name">
                <Input id="design-name" placeholder="Diamond Solitaire Ring" />
              </FormField>

              <FormField label="SKU Code" htmlFor="sku" required>
                <Input id="sku" placeholder="SKU-XXXX" iconLeft={<TagIcon size={14} />} />
              </FormField>

              <FormField label="Category" htmlFor="category">
                <Select id="category" defaultValue="">
                  <option value="" disabled>Select a category…</option>
                  <option>Rings</option>
                  <option>Pendants</option>
                  <option>Earrings</option>
                  <option>Bangles</option>
                  <option>Bracelets</option>
                </Select>
              </FormField>

              <FormField label="Description" htmlFor="desc" hint="Visible in the catalogue search results">
                <Textarea id="desc" placeholder="Describe the design, materials, and occasion…" rows={3} />
              </FormField>
            </div>

            {/* Column 2 */}
            <div className="space-y-5">
              <FormField label="Input States">
                <div className="space-y-2.5">
                  <Input placeholder="Default state" />
                  <Input placeholder="Error state" state="error" defaultValue="Invalid SKU format" />
                  <Input placeholder="Success state" state="success" defaultValue="SKU-0042 · Verified" />
                  <Input placeholder="Disabled state" disabled defaultValue="Cannot edit" />
                </div>
              </FormField>

              <Card padding="md">
                <p className="text-xs font-semibold text-stone-700 mb-4">Toggles & Selections</p>
                <div className="space-y-4">
                  <Checkbox
                    id="check-1"
                    label="Include archived designs"
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                  />
                  <Checkbox
                    id="check-2"
                    label="Show similarity percentage"
                    checked={false}
                    onChange={() => {}}
                  />
                  <Checkbox
                    id="check-3"
                    label="Disabled option"
                    checked={false}
                    onChange={() => {}}
                    disabled
                  />
                  <div className="h-px bg-stone-100" />
                  <Switch
                    id="switch-1"
                    label="AI-enhanced search"
                    checked={switched}
                    onChange={setSwitched}
                  />
                  <Switch
                    id="switch-2"
                    label="Auto-tag new uploads"
                    checked={false}
                    onChange={() => {}}
                  />
                </div>
              </Card>
            </div>
          </div>
        </Section>

        {/* ══ 05. SEARCH ══════════════════════════════════════════════════ */}
        <Section id="search" title="Search Components" subtitle="The core interaction for AI-powered image search">
          <div className="space-y-6">
            <SubSection title="Search Bar Sizes">
              <div className="space-y-3 max-w-2xl">
                <SearchInput
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  onClear={() => setSearchVal('')}
                  size="sm"
                  placeholder="Small search bar…"
                />
                <SearchInput
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  onClear={() => setSearchVal('')}
                  size="md"
                  placeholder="Search jewellery designs, SKUs, collections…"
                />
                <SearchInput
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  onClear={() => setSearchVal('')}
                  size="lg"
                  placeholder="Large — hero search bar…"
                />
              </div>
            </SubSection>

            <SubSection title="Loading State">
              <div className="max-w-2xl">
                <SearchInput
                  value="diamond rings"
                  onChange={() => {}}
                  loading={true}
                  placeholder=""
                />
              </div>
            </SubSection>

            <SubSection title="Filter Chips">
              <SearchFilters
                filters={filterOptions}
                activeFilters={activeFilters}
                onToggle={toggleFilter}
              />
            </SubSection>
          </div>
        </Section>

        {/* ══ 06. CARDS ═══════════════════════════════════════════════════ */}
        <Section id="cards" title="Cards" subtitle="Base card, image result card, KPI stat card, and action card">
          <div className="space-y-8">
            <SubSection title="Image Result Cards (with similarity scores)">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imageMockCards.map((card) => (
                  <ImageCard
                    key={card.sku}
                    {...card}
                    onClick={() => {}}
                  />
                ))}
              </div>
            </SubSection>

            <SubSection title="Stat Cards (KPI / Metrics)">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Designs"   value="12,480" icon={Database}    change="+124" changeLabel="this month" trend="up" />
                <StatCard label="Searches Today"  value="348"    icon={Search}      change="+12%" changeLabel="vs yesterday" trend="up" />
                <StatCard label="Pending Reviews" value="27"     icon={Clock}       change="+3"   changeLabel="new" trend="down" />
                <StatCard label="Upload Rate"     value="98.4"   unit="%" icon={TrendingUp} change="+0.6%" changeLabel="this week" trend="up" />
              </div>
            </SubSection>

            <SubSection title="Action Cards">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ActionCard title="Upload Image" description="Upload a jewellery photo to find similar designs." icon={Upload} onClick={() => {}} />
                <ActionCard title="Browse Catalogue" description="Explore all designs by category, material, and SKU." icon={Database} onClick={() => {}} />
                <ActionCard title="Team Management" description="Manage access, roles, and permissions." icon={Users} onClick={() => {}} />
              </div>
            </SubSection>

            <SubSection title="Base Card with Header & Footer">
              <Card className="max-w-md">
                <CardHeader
                  action={
                    <IconButton variant="ghost" size="icon-sm">
                      <MoreHorizontal size={14} />
                    </IconButton>
                  }
                >
                  <CardTitle>Catalogue Overview</CardTitle>
                  <CardDescription>Last synced 2 minutes ago</CardDescription>
                </CardHeader>
                <Body className="text-stone-500">
                  Your jewellery catalogue contains 12,480 designs across 8 categories.
                  AI indexing is current.
                </Body>
                <CardFooter>
                  <Caption className="text-stone-400">Updated · July 2026</Caption>
                  <Button variant="ghost" size="sm" iconRight={<ChevronRight size={12} />}>View all</Button>
                </CardFooter>
              </Card>
            </SubSection>

            <SubSection title="Divider">
              <div className="space-y-3 max-w-md">
                <Divider />
                <Divider label="Or continue with" />
              </div>
            </SubSection>
          </div>
        </Section>

        {/* ══ 07. TABLE ═══════════════════════════════════════════════════ */}
        <Section id="table" title="Data Table" subtitle="Sortable headers, status badges, row selection, and pagination">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <H4>Jewellery Catalogue</H4>
                <BodySm className="text-stone-400 mt-0.5">{tableData.length} designs</BodySm>
              </div>
              <Row>
                <Button variant="ghost" size="sm" iconLeft={<Filter size={12} />}>Filter</Button>
                <Button size="sm" iconLeft={<Plus size={12} />}>Add Design</Button>
              </Row>
            </div>

            <Table>
              <TableHead>
                <tr>
                  <TableHeader className="w-10">
                    <Checkbox id="select-all" checked={false} onChange={() => {}} />
                  </TableHeader>
                  <TableHeader sortable sortDir={sortDir} onSort={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>SKU</TableHeader>
                  <TableHeader sortable>Design Name</TableHeader>
                  <TableHeader>Category</TableHeader>
                  <TableHeader>Material</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader align="right">Updated</TableHeader>
                  <TableHeader className="w-10" />
                </tr>
              </TableHead>
              <TableBody>
                {tableData.map((row) => (
                  <TableRow key={row.id} selected={selectedRows.includes(row.id)}>
                    <TableCell>
                      <Checkbox
                        id={`row-${row.id}`}
                        checked={selectedRows.includes(row.id)}
                        onChange={() => setSelectedRows(prev =>
                          prev.includes(row.id) ? prev.filter(r => r !== row.id) : [...prev, row.id]
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <code className="text-xs font-mono text-stone-500">{row.id}</code>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-stone-900">{row.name}</span>
                    </TableCell>
                    <TableCell muted>{row.category}</TableCell>
                    <TableCell muted>{row.material}</TableCell>
                    <TableCell>
                      <Badge
                        variant={row.status}
                        dot
                        size="sm"
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell align="right" muted>{row.updated}</TableCell>
                    <TableCell>
                      <IconButton variant="ghost" size="icon-sm">
                        <MoreHorizontal size={13} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Pagination page={currentPage} totalPages={8} onPageChange={setCurrentPage} />
          </div>
        </Section>

        {/* ══ 08. BADGES & TAGS ═══════════════════════════════════════════ */}
        <Section id="badges" title="Badges, Tags & Avatars" subtitle="Status indicators, removable tags, and user avatars">
          <div className="space-y-8">
            <SubSection title="Status Badges">
              <Row>
                <Badge variant="active"   dot>Active</Badge>
                <Badge variant="pending"  dot>Pending</Badge>
                <Badge variant="archived" dot>Archived</Badge>
                <Badge variant="error"    dot>Error</Badge>
                <Badge variant="info"     dot>Info</Badge>
                <Badge variant="accent">New</Badge>
                <Badge variant="default">Default</Badge>
              </Row>
            </SubSection>

            <SubSection title="Solid Badges">
              <Row>
                <Badge variant="solid-active">Active</Badge>
                <Badge variant="solid-error">Error</Badge>
                <Badge variant="solid-accent">Accent</Badge>
                <Badge variant="solid-neutral">Neutral</Badge>
              </Row>
            </SubSection>

            <SubSection title="Badge Sizes">
              <Row className="items-center">
                <Badge variant="active" size="xs" dot>XS Active</Badge>
                <Badge variant="active" size="sm" dot>SM Active</Badge>
                <Badge variant="active" size="md" dot>MD Active</Badge>
              </Row>
            </SubSection>

            <SubSection title="Tags (Removable)">
              <Row className="flex-wrap">
                {['Diamond', '18K Gold', 'Solitaire', 'Wedding', 'Certified', 'New Arrival'].map((tag) => (
                  <Tag key={tag} onRemove={() => {}}>{tag}</Tag>
                ))}
                <Tag>No Remove</Tag>
              </Row>
            </SubSection>

            <SubSection title="Avatars">
              <Row className="items-end">
                <Avatar name="Rahul Verma"   size="xs" />
                <Avatar name="Priya Sharma"  size="sm" status="online" />
                <Avatar name="Aarav Mehta"   size="md" status="busy" />
                <Avatar name="Kavya Reddy"   size="lg" status="offline" />
                <Avatar name="Neha Joshi"    size="xl" />
              </Row>
            </SubSection>

            <SubSection title="Avatar Group">
              <AvatarGroup
                users={[
                  { name: 'Rahul Verma' },
                  { name: 'Priya Sharma' },
                  { name: 'Aarav Mehta' },
                  { name: 'Kavya Reddy' },
                  { name: 'Neha Joshi' },
                  { name: 'Amit Singh' },
                ]}
                max={4}
              />
            </SubSection>
          </div>
        </Section>

        {/* ══ 09. STATES ══════════════════════════════════════════════════ */}
        <Section id="states" title="States" subtitle="Empty, loading (skeleton + spinner), error, and success states">
          <div className="space-y-8">
            <SubSection title="Empty States">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card padding="none" className="overflow-hidden">
                  <EmptyState type="search" size="sm" />
                </Card>
                <Card padding="none" className="overflow-hidden">
                  <EmptyState type="empty" size="sm" action="Upload First Image" onAction={() => {}} />
                </Card>
                <Card padding="none" className="overflow-hidden">
                  <EmptyState type="offline" size="sm" action="Retry" onAction={() => {}} />
                </Card>
              </div>
            </SubSection>

            <SubSection title="Skeleton Loaders">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <SkeletonImageCard />
                <SkeletonImageCard />
                <SkeletonImageCard />
                <SkeletonImageCard />
              </div>
            </SubSection>

            <SubSection title="Spinners">
              <Row className="items-center">
                <Spinner size="xs" />
                <Spinner size="sm" />
                <Spinner size="md" />
                <Spinner size="lg" />
                <Spinner size="xl" />
              </Row>
            </SubSection>

            <SubSection title="Error & Success States">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card padding="none" className="overflow-hidden">
                  <ErrorState
                    title="Failed to load results"
                    description="The AI search service is temporarily unavailable."
                    onRetry={() => {}}
                  />
                </Card>
                <Card padding="none" className="overflow-hidden">
                  <SuccessState
                    title="Image uploaded successfully"
                    description="Your design has been indexed and is now searchable."
                    action="Search Similar"
                    onAction={() => {}}
                  />
                </Card>
              </div>
            </SubSection>

            <SubSection title="Inline Alerts">
              <div className="space-y-3 max-w-2xl">
                <Alert type="success" title="Design saved">
                  SKU-0042 has been added to the catalogue and is ready for AI search.
                </Alert>
                <Alert type="warning" title="Low confidence match">
                  The AI similarity score is below 70%. Consider uploading a clearer image.
                </Alert>
                <Alert type="error" title="Upload failed" dismissible onDismiss={() => {}}>
                  The file exceeds the 10MB limit. Please compress and retry.
                </Alert>
                <Alert type="info" title="AI model updated">
                  The search model was updated today. Results may slightly differ.
                </Alert>
              </div>
            </SubSection>
          </div>
        </Section>

        {/* ══ 10. UPLOAD ══════════════════════════════════════════════════ */}
        <Section id="upload" title="Upload Component" subtitle="Drag-and-drop zone with file preview, progress, and error states">
          <div className="max-w-lg">
            <UploadZone accept="image/*" maxSize={10} multiple />
          </div>
        </Section>

        {/* ══ 11. OVERLAYS ════════════════════════════════════════════════ */}
        <Section id="overlays" title="Overlays" subtitle="Dialog, Sheet, Tooltip, and Dropdown Menu">
          <div className="space-y-8">
            <SubSection title="Triggers">
              <Row>
                <Button onClick={() => setDialogOpen(true)} iconLeft={<Gem size={14} />}>
                  Open Dialog
                </Button>
                <Button variant="secondary" onClick={() => setSheetOpen(true)} iconLeft={<Layers size={14} />}>
                  Open Sheet
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => addToast('success', 'Design saved', 'SKU-0042 has been indexed.')}
                >
                  Toast: Success
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addToast('error', 'Upload failed', 'File exceeds 10MB limit.')}
                >
                  Toast: Error
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => addToast('warning', 'Low confidence', 'Similarity below 70%.')}
                >
                  Toast: Warning
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => addToast('info', 'Model updated', 'AI model v2.4 is active.')}
                >
                  Toast: Info
                </Button>
              </Row>
            </SubSection>

            <SubSection title="Tooltips">
              <Row>
                <Tooltip content="Create new design" side="top">
                  <Button variant="secondary" size="sm">Hover: Top</Button>
                </Tooltip>
                <Tooltip content="Open settings panel" side="bottom">
                  <Button variant="secondary" size="sm">Hover: Bottom</Button>
                </Tooltip>
                <Tooltip content="View design details" side="right">
                  <Button variant="secondary" size="sm">Hover: Right</Button>
                </Tooltip>
                <Tooltip content="Go back" side="left">
                  <Button variant="secondary" size="sm">Hover: Left</Button>
                </Tooltip>
              </Row>
            </SubSection>

            <SubSection title="Dropdown Menu">
              <DropdownMenu
                trigger={
                  <Button variant="secondary" size="sm" iconRight={<MoreHorizontal size={14} />}>
                    Design Actions
                  </Button>
                }
                items={[
                  { label: 'View Details',   icon: <ExternalLink size={13} />, onClick: () => {}, shortcut: '⌘O' },
                  { label: 'Edit Metadata',  icon: <Edit2 size={13} />,       onClick: () => {}, shortcut: '⌘E' },
                  { label: 'Duplicate',      icon: <Copy size={13} />,        onClick: () => {} },
                  { label: 'Export',         icon: <Download size={13} />,    onClick: () => {} },
                  { label: 'Share',          icon: <Share2 size={13} />,      onClick: () => {} },
                  { separator: true },
                  { label: 'Archive Design', icon: <Archive size={13} />,     onClick: () => {} },
                  { label: 'Delete Design',  icon: <Trash2 size={13} />,      onClick: () => {}, destructive: true },
                ]}
              />
            </SubSection>
          </div>
        </Section>

        {/* ══ 12. NAVIGATION ══════════════════════════════════════════════ */}
        <Section id="navigation" title="Navigation" subtitle="Collapsible sidebar, topbar, and breadcrumb">
          <div className="space-y-6">
            <SubSection title="Sidebar (Live — toggle collapse with arrow)">
              <div className="h-[380px] border border-stone-200 rounded-xl overflow-hidden shadow-md flex">
                <Sidebar activeItem={activeNav} onItemClick={setActiveNav} />
                <div className="flex-1 flex flex-col bg-stone-50">
                  <TopBar
                    breadcrumb={[
                      { label: 'Dashboard', href: '#' },
                      { label: 'Image Search', href: '#' },
                      { label: 'Results' },
                    ]}
                    actions={
                      <Row>
                        <IconButton variant="ghost" size="icon-sm"><Bell size={15} /></IconButton>
                        <Button size="sm" iconLeft={<Upload size={12} />}>Upload</Button>
                      </Row>
                    }
                  />
                  <div className="flex-1 flex items-center justify-center">
                    <EmptyState
                      type="empty"
                      size="sm"
                      title="Content area"
                      description="Click sidebar items to change the active route"
                    />
                  </div>
                </div>
              </div>
            </SubSection>

            <SubSection title="Breadcrumb (Standalone)">
              <Breadcrumb
                items={[
                  { label: 'Catalogue', href: '#' },
                  { label: 'Rings', href: '#' },
                  { label: 'Diamond Solitaire Ring' },
                ]}
              />
            </SubSection>
          </div>
        </Section>

        {/* ══ 13. MOTION ══════════════════════════════════════════════════ */}
        <Section id="motion" title="Motion Guidelines" subtitle="Purposeful, fast, never decorative — all variants defined in tokens.js">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { name: 'Micro',      ms: '100ms', ease: 'ease-out',        use: 'Hover colors, opacity, icon swap' },
              { name: 'Fast',       ms: '150ms', ease: 'ease-out',        use: 'Button press, badge appear, chip select' },
              { name: 'Standard',   ms: '200ms', ease: 'ease-in-out',     use: 'Panel open, card mount, tab switch' },
              { name: 'Gentle',     ms: '300ms', ease: 'spring(300,30)',  use: 'Dropdown, dialog open, stagger list' },
              { name: 'Deliberate', ms: '400ms', ease: 'spring(200,25)',  use: 'Page transitions, sheet/drawer' },
            ].map((m) => (
              <div key={m.name} className="flex items-start gap-4 p-4 bg-white border border-stone-200 rounded-lg">
                <div className="w-2.5 h-2.5 rounded-full bg-accent mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="text-sm font-semibold text-stone-800">{m.name}</p>
                    <code className="text-[11px] text-accent font-mono">{m.ms}</code>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">{m.ease}</p>
                  <p className="text-xs text-stone-600 mt-1">{m.use}</p>
                </div>
              </div>
            ))}

            <div className="p-4 bg-stone-900 rounded-lg">
              <p className="text-xs font-semibold text-stone-300 mb-3">Rule: Never looping animations</p>
              <p className="text-xs text-stone-400 leading-relaxed">
                Only two exceptions: <span className="text-white">loading spinners</span> and{' '}
                <span className="text-white">skeleton shimmer</span> — because they communicate
                "waiting" state. All other animations must have a clear start and end state.
              </p>
            </div>
          </div>

          {/* Live motion demos */}
          <div className="mt-6">
            <Label className="text-stone-400 mb-4 block">Live Demos</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Fade Up', 'Scale In', 'Slide Right', 'Spring'].map((name, i) => (
                <motion.div
                  key={name}
                  whileHover={
                    i === 0 ? { y: -4 } :
                    i === 1 ? { scale: 1.05 } :
                    i === 2 ? { x: 4 } :
                    { scale: 1.08, rotate: 2 }
                  }
                  transition={
                    i < 2
                      ? { duration: 0.2, ease: 'easeOut' }
                      : { type: 'spring', stiffness: 400, damping: 25 }
                  }
                  className="flex flex-col items-center justify-center h-20 bg-white border border-stone-200 rounded-lg cursor-pointer shadow-xs hover:shadow-md hover:border-accent/30 transition-shadow duration-200"
                >
                  <p className="text-xs font-semibold text-stone-700">{name}</p>
                  <p className="text-[10px] text-stone-400 mt-1">Hover me</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-stone-200 bg-white py-8 mt-8">
        <div className="max-w-5xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
              <Gem size={12} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-700">Anaadi Design System</p>
              <p className="text-[10px] text-stone-400">v1.0 · Light Theme · July 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {['React 19', 'Tailwind CSS 3', 'Framer Motion', 'Lucide Icons'].map((tech) => (
              <span key={tech} className="text-xs text-stone-400">{tech}</span>
            ))}
          </div>
        </div>
      </footer>

      {/* ── Dialog ────────────────────────────────────────────────────────── */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Add New Design"
        description="Upload a jewellery image and add it to the searchable catalogue."
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { setDialogOpen(false); addToast('success', 'Design added', 'SKU-0201 has been indexed.'); }}>
              Save Design
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Design Name" htmlFor="dialog-name" required>
            <Input id="dialog-name" placeholder="E.g. Diamond Solitaire Ring" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category" htmlFor="dialog-cat">
              <Select id="dialog-cat">
                <option>Rings</option>
                <option>Pendants</option>
                <option>Earrings</option>
              </Select>
            </FormField>
            <FormField label="Material" htmlFor="dialog-mat">
              <Select id="dialog-mat">
                <option>18K Gold</option>
                <option>22K Gold</option>
                <option>Platinum</option>
                <option>Sterling Silver</option>
              </Select>
            </FormField>
          </div>
          <UploadZone accept="image/*" maxSize={10} />
        </div>
      </Dialog>

      {/* ── Sheet ─────────────────────────────────────────────────────────── */}
      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Design Details"
        width="420px"
      >
        <div className="space-y-5">
          <div className="aspect-square w-full bg-stone-100 rounded-xl flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-stone-300">
              <Layers size={40} />
              <p className="text-sm">Design Preview</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Design Name', value: 'Diamond Solitaire Ring' },
              { label: 'SKU', value: 'SKU-0012' },
              { label: 'Category', value: 'Rings' },
              { label: 'Material', value: '18K Yellow Gold' },
              { label: 'Weight', value: '4.2g' },
              { label: 'Status', value: null },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                <Caption>{row.label}</Caption>
                {row.value
                  ? <Body className="text-stone-800 font-medium">{row.value}</Body>
                  : <Badge variant="active" dot>Active</Badge>
                }
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" variant="secondary" iconLeft={<Edit2 size={13} />}>Edit</Button>
            <Button className="flex-1" iconLeft={<Search size={13} />}>Find Similar</Button>
          </div>
        </div>
      </Sheet>

      {/* ── Toast Container ───────────────────────────────────────────────── */}
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}
