import { ShieldAlert } from 'lucide-react';
import { H2, Body } from '../../design-system/components/Typography';
import { Button } from '../../design-system/components/Button';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6 max-w-md mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-error-subtle flex items-center justify-center mb-6 text-error">
        <ShieldAlert size={32} />
      </div>
      <H2 className="text-stone-900 text-2xl font-bold tracking-tight mb-2">Page Not Found</H2>
      <Body className="text-stone-500 mb-6 leading-relaxed">
        The route you are trying to access does not exist or has been relocated to another module.
      </Body>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
        <Button variant="primary" onClick={() => navigate('/')}>
          Return Home
        </Button>
      </div>
    </div>
  );
}
