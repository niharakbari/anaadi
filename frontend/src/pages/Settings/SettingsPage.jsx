import { H2, Body } from '../../design-system/components/Typography';
import { Card } from '../../design-system/components/Cards';
import { FormField, Input, Select } from '../../design-system/components/FormControls';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <H2 className="text-stone-800">System Settings</H2>
        <Body className="text-stone-500">Configure application preferences, search layouts, and local interface settings.</Body>
      </div>

      <div className="space-y-6">
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

        {/* AI Search Configuration */}
        <Card className="p-6 space-y-4">
          <H2 className="text-stone-800 text-base font-semibold">AI Search Configuration</H2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b border-stone-100 last:border-0">
              <span className="text-stone-500">AI Search Status</span>
              <span className="font-semibold text-emerald-600">Active</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-stone-100 last:border-0">
              <span className="text-stone-500">Search Mode</span>
              <span className="font-semibold text-stone-800">Visual Match</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-stone-100 last:border-0">
              <span className="text-stone-500">Indexed Designs</span>
              <span className="font-semibold text-stone-800">14,350</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-stone-100 last:border-0">
              <span className="text-stone-500">Last Catalogue Update</span>
              <span className="font-semibold text-stone-800">Today, 08:30 AM</span>
            </div>
          </div>
        </Card>

        <div className="text-center text-sm text-stone-400 pt-2">
          Changes are saved automatically.
        </div>
      </div>
    </div>
  );
}
