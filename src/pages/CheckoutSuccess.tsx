import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router';
import { CheckCircle, ArrowRight, Slack, Mail, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SessionData {
  seatNumber?: number;
  email?: string;
  loading: boolean;
  error?: string;
}

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const tier = params.get('tier');

  const [session, setSession] = useState<SessionData>({ loading: true });

  useEffect(() => {
    if (!sessionId) {
      setSession({ loading: false, error: 'No session ID found.' });
      return;
    }

    // In production this would call an API to get the seat number from the session.
    // For now, we derive a plausible seat number and show the success state.
    const mockSeat = Math.floor(Math.random() * 20) + 10; // 10–29 range for now
    const timer = setTimeout(() => {
      setSession({ loading: false, seatNumber: mockSeat });
    }, 800);
    return () => clearTimeout(timer);
  }, [sessionId]);

  if (session.loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#d4ff00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">Confirming your seat…</p>
        </div>
      </div>
    );
  }

  if (session.error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-black text-white mb-3">Something went wrong</h1>
          <p className="text-zinc-400 mb-6">{session.error}</p>
          <p className="text-zinc-500 text-sm">
            If you completed a purchase, email{' '}
            <a href="mailto:support@laidapp.com" className="text-[#d4ff00]">support@laidapp.com</a>{' '}
            with your receipt and we'll sort it out immediately.
          </p>
        </div>
      </div>
    );
  }

  const isFoundingTier = !tier || tier === 'founding_lifetime';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-['Inter',sans-serif] antialiased">

      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#d4ff00]/6 blur-[140px]" />
      </div>

      <div className="relative flex flex-col items-center justify-center min-h-screen px-4 py-20 text-center">

        {/* Check icon */}
        <div className="w-20 h-20 rounded-full bg-[#d4ff00]/10 border border-[#d4ff00]/30 flex items-center justify-center mb-6">
          <CheckCircle size={36} className="text-[#d4ff00]" />
        </div>

        {isFoundingTier && session.seatNumber && (
          <Badge className="bg-[#d4ff00]/10 text-[#d4ff00] border border-[#d4ff00]/30 mb-4 px-4 py-1.5 text-sm font-semibold">
            Founding Seat #{session.seatNumber} of 50
          </Badge>
        )}

        <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
          {isFoundingTier
            ? "You're in. Welcome to the founding 50."
            : "You're in. Welcome to LAID."}
        </h1>

        <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-12 leading-relaxed">
          {isFoundingTier
            ? "Your seat is locked. You'll never pay more than $1,997 for LAID — ever. Here's everything that happens next."
            : "Your account is being set up. Here's what happens next."}
        </p>

        {/* Next steps */}
        <div className="w-full max-w-2xl mx-auto space-y-4 mb-14 text-left">
          {[
            {
              step: '01',
              icon: Mail,
              title: 'Check your email',
              desc: 'A confirmation + magic login link is on its way. Check your spam if you don\'t see it in 2 minutes.',
            },
            {
              step: '02',
              icon: Zap,
              title: 'Log in and pick your first avatar',
              desc: 'Your account is ready. Pick an avatar, type a topic, and run your first generation — it takes 60 seconds.',
            },
            ...(isFoundingTier ? [{
              step: '03',
              icon: Slack,
              title: 'Join the founding Slack',
              desc: 'You\'ll receive a Slack invite in the same email. This is where you get direct access to Los for 90 days.',
            }] : []),
          ].map(({ step, icon: Icon, title, desc }) => (
            <div key={step} className="flex gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="w-10 h-10 rounded-lg bg-[#d4ff00]/10 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-[#d4ff00]" />
              </div>
              <div>
                <div className="text-[#d4ff00] font-mono text-xs font-bold mb-1">STEP {step}</div>
                <h3 className="font-semibold text-white mb-1">{title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Primary action */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button className="bg-[#d4ff00] text-black hover:bg-[#e0ff33] font-bold px-8 py-4 rounded-xl text-base">
              Go to the app
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
          <a href="mailto:support@laidapp.com">
            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-900 px-8 py-4 rounded-xl text-base"
            >
              Email support
            </Button>
          </a>
        </div>

        {sessionId && (
          <p className="text-zinc-700 text-xs mt-10">
            Order reference: {sessionId}
          </p>
        )}
      </div>
    </div>
  );
}
