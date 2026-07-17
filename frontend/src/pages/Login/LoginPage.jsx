import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gem, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Card } from '../../design-system/components/Cards';
import { FormField, Input } from '../../design-system/components/FormControls';
import { Button } from '../../design-system/components/Button';
import { Body } from '../../design-system/components/Typography';
import { Alert } from '../../design-system/components/Feedback';

export default function LoginPage() {
  const navigate = useNavigate();

  // Authentication states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Simulating future authentication logic
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic credentials validation
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all credentials.');
      return;
    }

    setLoading(true);

    // Mock API authentication delay
    setTimeout(() => {
      setLoading(false);
      // Redirection to main Dashboard
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen w-screen bg-stone-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        
        {/* App Logo & Title */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-sm">
            <Gem size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight leading-none">
              Anaadi
            </h1>
            <p className="text-[11px] text-stone-400 font-semibold uppercase tracking-wider mt-1.5">
              Jewellery AI Search
            </p>
            <Body className="text-stone-500 text-xs mt-1">
              Internal Enterprise Authentication Portal
            </Body>
          </div>
        </div>

        {error && (
          <Alert type="error" title="Authentication Error">
            {error}
          </Alert>
        )}

        {/* Login Card */}
        <Card className="p-8 shadow-md">
          <form onSubmit={handleSignIn} className="space-y-4">
            <FormField label="Enterprise Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                iconLeft={<Mail size={14} />}
                disabled={loading}
                required
              />
            </FormField>

            <FormField label="Password" htmlFor="password">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                iconLeft={<Lock size={14} />}
                iconRight={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-stone-400 hover:text-stone-600 transition-colors focus:outline-none"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
                disabled={loading}
                required
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              loading={loading}
            >
              Sign In
            </Button>
          </form>
        </Card>

        {/* Footer Audit Message */}
        <div className="text-center">
          <Body className="text-[10px] text-stone-400 leading-normal">
            Authorized Personnel Only · Audit Log Active
          </Body>
          <Body className="text-[9px] text-stone-300 font-mono mt-0.5">
            Security context: internal-net-2026
          </Body>
        </div>

      </div>
    </div>
  );
}
