import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';


import { Sidebar, TopBar } from '../design-system/components/Navigation';
import { Button } from '../design-system/components/Button';

import { PAGE_TITLES, ROUTES } from '../constants/routes';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentRoute =
    location.pathname.split('/')[1] || 'dashboard';

  const currentTitle =
    PAGE_TITLES[currentRoute] ?? 'Not Found';

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">

      <Sidebar />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

        <TopBar
          title={currentTitle}
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
              Upload
            </Button>
          }
        />

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>

      </div>

    </div>
  );
}