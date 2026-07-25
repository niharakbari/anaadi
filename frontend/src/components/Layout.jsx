import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';

import { Sidebar, TopBar } from '../design-system/components/Navigation';
import { Button } from '../design-system/components/Button';
import { Sheet } from '../design-system/components/Overlays';

import GlobalImportIndicator from './GlobalImportIndicator';
import { PAGE_TITLES, ROUTES } from '../constants/routes';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentRoute =
    location.pathname.split('/')[1] || 'dashboard';

  const currentTitle =
    PAGE_TITLES[currentRoute] ?? 'Not Found';

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">

      <Sidebar />

      <Sheet
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        side="left"
        className="p-0 w-[80vw] max-w-[280px]"
      >
        <Sidebar className="w-full border-r-0 md:hidden flex" onItemClick={() => setMobileMenuOpen(false)} />
      </Sheet>

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

        <TopBar
          title={currentTitle}
          onMenuClick={() => setMobileMenuOpen(true)}
          breadcrumb={[
            {
              label: 'Anaadi AI',
              href: ROUTES.dashboard,
            },
            {
              label: currentTitle,
            },
          ]}
          actions={
            <Button
              size="sm"
              iconLeft={<Upload size={12} />}
              onClick={() => navigate(ROUTES.upload)}
            >
              <span className="hidden sm:inline">Upload</span>
            </Button>
          }
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>

      </div>
      <GlobalImportIndicator />
    </div>
  );
}