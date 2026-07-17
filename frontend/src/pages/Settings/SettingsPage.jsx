import { useState } from 'react';
import { H2, Body } from '../../design-system/components/Typography';
import { Card } from '../../design-system/components/Cards';
import { FormField, Input, Select, Switch } from '../../design-system/components/FormControls';
import { Button } from '../../design-system/components/Button';
import { Alert } from '../../design-system/components/Feedback';

export default function SettingsPage() {
  const [success, setSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <H2 className="text-stone-800">System Settings</H2>
        <Body className="text-stone-500">Configure application preferences, search layouts, and local interface settings.</Body>
      </div>

      {success && (
        <Alert type="success" title="Settings Saved">
          Your changes have been applied successfully.
        </Alert>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Workspace Details */}
        <Card className="p-6 space-y-4">
          <H2 className="text-stone-800 text-base font-semibold">Enterprise Workspace</H2>
          
          <FormField label="Workspace Name" htmlFor="workspace-name">
            <Input id="workspace-name" defaultValue="Anaadi Jewellery India" />
          </FormField>

          <FormField label="Search Result Default Layout" htmlFor="default-layout">
            <Select id="default-layout" defaultValue="grid">
              <option value="grid">Visual Grid View (Recommended)</option>
              <option value="list">Compact List View</option>
            </Select>
          </FormField>
        </Card>

        {/* User Preferences */}
        <Card className="p-6 space-y-4">
          <H2 className="text-stone-800 text-base font-semibold">Search Preferences</H2>
          
          <div className="space-y-3">
            <Switch id="auto-trigger" label="Search automatically on upload completion" defaultChecked />
            <Switch id="notify-updates" label="Notify me when catalogue index model finishes sync updates" defaultChecked />
          </div>
        </Card>

        {/* Technical Infrastructure */}
        <Card className="p-6 space-y-4">
          <H2 className="text-stone-800 text-base font-semibold">Technical Infrastructure</H2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b border-stone-100 last:border-0">
              <span className="text-stone-500">AI Model Framework</span>
              <span className="font-semibold text-stone-800">OpenCLIP (ViT-H-14)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-stone-100 last:border-0">
              <span className="text-stone-500">Execution Engine</span>
              <span className="font-semibold text-stone-800">ONNX Runtime (CPU/GPU)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-stone-100 last:border-0">
              <span className="text-stone-500">Vector Index Database</span>
              <span className="font-semibold text-stone-800">HNSW Index</span>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
