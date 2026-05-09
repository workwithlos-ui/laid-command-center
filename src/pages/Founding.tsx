import { useState, useEffect, useCallback } from 'react';
import {
  Check,
  Clock,
  Zap,
  Users,
  BarChart3,
  Mail,
  Video,
  Camera,
  ChevronDown,
  Star,
  Shield,
  ArrowRight,
  Flame,
  MessageSquare,
  FileText,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { checkoutFoundingTier, getFoundingStatus } from '@/lib/checkout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FoundingStatus {
  claimed: number;
  remaining: number;
  total: number;
}

// ─── Avatar Data (from seed) ──────────────────────────────────────────────────

const AVATARS = [
  { id: 1, name: 'Nadia', niche: 'Finance', style: 'Confident, no-fluff', imagePlaceholder: '/avatars/nadia.jpg' },
  { id: 2, name: 'Rosa', niche: 'Beauty', style: 'Warm, relatable', imagePlaceholder: '/avatars/rosa.jpg' },
  { id: 3, name: 'Corey', niche: 'Fitness', style: 'High-energy, bro-coded', imagePlaceholder: '/avatars/corey.jpg' },
  { id: 4, name: 'Dani', niche: 'Lifestyle', style: 'Aesthetic, aspirational', imagePlaceholder: '/avatars/dani.jpg' },
  { id: 5, name: 'Marcus', niche: 'Business', style: 'Direct, authority', imagePlaceholder: '/avatars/marcus.jpg' },
  { id: 6, name: 'Priya', niche: 'Tech', style: 'Sharp, smart-casual', imagePlaceholder: '/avatars/priya.jpg' },
  { id: 7, name: 'Tyler', niche: 'Real Estate', style: 'Polished, persuasive', imagePlaceholder: '/avatars/tyler.jpg' },
  { id: 8, name: 'Zoe', niche: 'Wellness', style: 'Calm, nurturing', imagePlaceholder: '/avatars/zoe.jpg' },
  { id: 9, name: 'Jordan', niche: 'SaaS', style: 'Casual founder energy', imagePlaceholder: '/avatars/jordan.jpg' },
  { id: 10, name: 'Kai', niche: 'Agency', style: 'Creative, edgy', imagePlaceholder: '/avatars/kai.jpg' },
  { id: 11, name: 'Amara', niche: 'Consulting', style: 'Authoritative, polished', imagePlaceholder: '/avatars/amara.jpg' },
  { id: 12, name: 'Eli', niche: 'E-comm', style: 'Hyper-casual, iPhone native', imagePlaceholder: '/avatars/eli.jpg' },
];

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: Video, label: 'AI Video Generation', desc: 'Kling 3.0 Pro / Veo 3.1 / Sora 2 — your pick' },
  { icon: Zap, label: 'Hook Selector', desc: '50+ proven viral hook formulas, auto-matched to your topic' },
  { icon: BarChart3, label: 'Audience Intel', desc: 'Reddit + comment mining — know what to make before you film' },
  { icon: Users, label: 'Built-in CRM', desc: 'Track leads, DMs, and deals from the same dashboard' },
  { icon: Layers, label: 'Content Cascade', desc: 'One prompt → video + caption + email + ad copy + carousel' },
  { icon: ArrowRight, label: 'Auto-Poster', desc: 'Schedule and publish to TikTok, IG, YouTube — one click' },
  { icon: Mail, label: 'Email Sequences', desc: 'Pre-built nurture flows triggered by video views and DMs' },
  { icon: MessageSquare, label: 'Paywall + Churn Templates', desc: 'Copy-paste scripts for upsells, downgrades, and saves' },
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQ = [
  {
    q: 'What is LAID?',
    a: 'LAID is an AI-avatar video generator built for personal brands and service businesses. You pick a pre-built avatar, type a topic, and get a full content stack — talking-head video, hook, caption, email, ad copy, and carousel — in under 60 seconds. No camera, no script, no editor.',
  },
  {
    q: 'Why are you offering a lifetime deal?',
    a: 'We\'re in early growth and want 50 operators who are invested in the product — not just subscribers. Founding members get the best price we\'ll ever offer, direct access to the product team, and they help shape what we build next. After May 31, this price is gone. Forever.',
  },
  {
    q: 'What if I don\'t like it? Is there a refund?',
    a: 'Yes. 14-day no-questions refund. Email support@laidapp.com within 14 days of purchase and we\'ll send your money back — no forms, no hoops.',
  },
  {
    q: 'Do I need an iPhone, camera, or any equipment?',
    a: 'No. The avatars are already built. You never go on camera unless you want to. Just type a topic and go.',
  },
  {
    q: 'Can I use my own face / clone myself?',
    a: 'Yes. Founding members get voice cloning free (normally $97/mo) and self-avatar creation is on the roadmap for Q3. You can clone your likeness and have LAID post as you, 24/7.',
  },
  {
    q: 'How is this different from HeyGen or Synthesia?',
    a: 'HeyGen and Synthesia make corporate presentation videos — you can tell immediately they\'re AI. LAID\'s avatars are built to look like real iPhone-filmed UGC creators: natural lighting, casual framing, real creator energy. The goal is to not look like AI.',
  },
  {
    q: 'When does founding close?',
    a: 'May 31, 2026 OR when all 50 seats are claimed — whichever comes first. We\'re not extending the deadline.',
  },
  {
    q: 'What happens if I\'m seat #51?',
    a: 'You\'ll be put on the waitlist and offered a recurring plan when we open to the public: $147/mo, $397/mo, or $997/mo depending on usage. No lifetime option will ever be offered again.',
  },
];

// ─── Seat Counter ─────────────────────────────────────────────────────────────

function SeatCounter({ status }: { status: FoundingStatus }) {
  const pct = (status.claimed / status.total) * 100;
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-[#d4ff00] font-semibold">{status.claimed} of {status.total} seats claimed</span>
        <span className="text-zinc-400">{status.remaining} left</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#d4ff00] rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Countdown ────────────────────────────────────────────────────────────────

function Countdown() {
  const deadline = new Date('2026-05-31T23:59:59Z');
  const [diff, setDiff] = useState(deadline.getTime() - Date.now());

  useEffect(() => {
    const interval = setInterval(() => setDiff(deadline.getTime() - Date.now()), 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const days = Math.max(0, Math.floor(diff / 86400000));
  const hours = Math.max(0, Math.floor((diff % 86400000) / 3600000));
  const mins = Math.max(0, Math.floor((diff % 3600000) / 60000));
  const secs = Math.max(0, Math.floor((diff % 60000) / 1000));

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-3 justify-center">
      {[{ label: 'days', val: days }, { label: 'hrs', val: hours }, { label: 'min', val: mins }, { label: 'sec', val: secs }].map(({ label, val }) => (
        <div key={label} className="flex flex-col items-center">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 min-w-[52px] text-center">
            <span className="text-2xl font-mono font-bold text-white">{pad(val)}</span>
          </div>
          <span className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── CTA Form ─────────────────────────────────────────────────────────────────

function CTAForm({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Enter your email to continue'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email'); return; }
    setError('');
    setLoading(true);
    try {
      await checkoutFoundingTier(email.trim());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
      setLoading(false);
    }
  }, [email]);

  if (size === 'sm') {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-lg mx-auto">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="flex-1 px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#d4ff00] text-sm"
        />
        <Button
          type="submit"
          disabled={loading}
          className="bg-[#d4ff00] text-black hover:bg-[#e0ff33] font-bold px-6 py-3 rounded-lg text-sm whitespace-nowrap disabled:opacity-60"
        >
          {loading ? 'Redirecting…' : 'Claim my seat →'}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-xl mx-auto">
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full px-5 py-4 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#d4ff00] text-base"
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#d4ff00] text-black hover:bg-[#e0ff33] font-black text-lg py-6 rounded-xl disabled:opacity-60 transition-all"
      >
        {loading ? 'Redirecting to checkout…' : 'Claim a founding seat — $1,997'}
      </Button>
      <p className="text-zinc-500 text-sm text-center">14-day no-questions refund · Secure checkout via Stripe</p>
    </form>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center px-6 py-5 text-left hover:bg-zinc-900/50 transition-colors"
      >
        <span className="font-semibold text-white">{q}</span>
        <ChevronDown
          size={18}
          className={`text-zinc-400 shrink-0 ml-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-5 text-zinc-400 text-sm leading-relaxed border-t border-zinc-800 pt-4">
          {a}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Founding() {
  const [status, setStatus] = useState<FoundingStatus>({ claimed: 12, remaining: 38, total: 50 });

  useEffect(() => {
    getFoundingStatus().then(setStatus).catch(() => {});
    const interval = setInterval(() => {
      getFoundingStatus().then(setStatus).catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-['Inter',sans-serif] antialiased">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-4 pt-20 pb-24 text-center">
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#d4ff00]/8 blur-[120px]" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <Badge className="bg-[#d4ff00]/10 text-[#d4ff00] border border-[#d4ff00]/30 mb-6 px-4 py-1.5 text-sm font-semibold">
            <Flame size={13} className="mr-1.5 inline" />
            Founding 50 — closes May 31, 2026
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.05] tracking-tight mb-6">
            Stop being on camera.<br />
            <span className="text-[#d4ff00]">Start shipping content.</span>
          </h1>

          <p className="text-zinc-400 text-lg sm:text-xl max-w-2xl mx-auto mb-4 leading-relaxed">
            LAID turns a one-line topic into a full content stack — talking-head UGC video + hook + caption + email + ad copy — in under 60 seconds. Real-looking avatars. Zero camera time. Completely automated.
          </p>

          <p className="text-zinc-500 text-base mb-10">
            Built for personal brands, agency owners, and $1–30M service businesses who want leverage — not more hours on camera.
          </p>

          {/* Seat counter */}
          <div className="mb-8">
            <SeatCounter status={status} />
          </div>

          {/* Countdown */}
          <div className="mb-10">
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Offer closes in</p>
            <Countdown />
          </div>

          {/* VSL Placeholder */}
          <div
            id="vsl-placeholder"
            className="w-full max-w-3xl mx-auto aspect-video bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mb-10 overflow-hidden"
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#d4ff00]/10 border border-[#d4ff00]/30 flex items-center justify-center mx-auto mb-3">
                <Video size={28} className="text-[#d4ff00]" />
              </div>
              <p className="text-zinc-500 text-sm">60-second product demo — coming soon</p>
            </div>
          </div>

          {/* Primary CTA */}
          <CTAForm size="lg" />
        </div>
      </section>

      {/* ── THE PROBLEM ── */}
      <section className="px-4 py-20 bg-zinc-950/50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#d4ff00] text-xs uppercase tracking-widest font-semibold mb-3">The Problem</p>
          <h2 className="text-3xl sm:text-4xl font-black mb-4">Your current content pipeline is burning you</h2>
          <p className="text-zinc-400 max-w-xl mx-auto mb-14 text-base">
            Scripting, filming, editing, captioning, posting — for every single piece of content. Here's what that actually costs.
          </p>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                stat: '8–14 hrs/week',
                label: 'Average time creators spend on content production',
                vs: 'LAID: ~4 minutes per full content stack',
                icon: Clock,
              },
              {
                stat: '$2,400–$6,000/mo',
                label: 'What agencies charge for monthly content production',
                vs: 'LAID founding: $1,997 ONCE — forever',
                icon: BarChart3,
              },
              {
                stat: '73%',
                label: 'Creators who admit their content quality drops when they\'re tired or overworked',
                vs: 'LAID\'s output is consistent — same energy every time',
                icon: Zap,
              },
            ].map(({ stat, label, vs, icon: Icon }) => (
              <div key={stat} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-left">
                <Icon size={20} className="text-zinc-500 mb-4" />
                <div className="text-3xl font-black text-white mb-2">{stat}</div>
                <p className="text-zinc-400 text-sm mb-4 leading-relaxed">{label}</p>
                <div className="border-t border-zinc-800 pt-4">
                  <p className="text-[#d4ff00] text-xs font-semibold">{vs}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCT DEMO ── */}
      <section className="px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#d4ff00] text-xs uppercase tracking-widest font-semibold mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">Pick avatar → Type topic → Hit go → Get 30+ assets</h2>
            <p className="text-zinc-400 max-w-lg mx-auto text-base">
              Four steps. No camera. No script. No editor. Full content stack delivered in under 60 seconds.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Pick your avatar',
                desc: '40+ pre-built UGC creators. Finance bros, wellness girlies, agency founders. Pick the one that fits your brand.',
                icon: Camera,
              },
              {
                step: '02',
                title: 'Type your topic',
                desc: '"3 reasons your email list isn\'t converting" — that\'s it. LAID handles the rest.',
                icon: FileText,
              },
              {
                step: '03',
                title: 'Hit generate',
                desc: 'Our engine pulls from Kling 3.0 Pro, Veo 3.1, and Sora 2 to produce the highest-quality output available.',
                icon: Zap,
              },
              {
                step: '04',
                title: 'Get 30+ assets',
                desc: 'Video + 5 hook variants + caption + email copy + ad script + carousel slides — ready to post.',
                icon: Layers,
              },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="relative">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 h-full">
                  {/* Screenshot placeholder */}
                  <div className="w-full aspect-video bg-zinc-800 rounded-lg mb-5 flex items-center justify-center border border-zinc-700">
                    <Icon size={24} className="text-zinc-600" />
                  </div>
                  <div className="text-[#d4ff00] font-mono text-xs font-bold mb-2">{step}</div>
                  <h3 className="font-bold text-white mb-2">{title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AVATAR SHOWCASE ── */}
      <section className="px-4 py-20 bg-zinc-950/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#d4ff00] text-xs uppercase tracking-widest font-semibold mb-3">The Avatars</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">40+ creators. Zero camera time.</h2>
            <p className="text-zinc-400 max-w-lg mx-auto text-base">
              Every avatar is built to look like a real person filmed on an iPhone — not a corporate AI bot. Your audience won't know.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {AVATARS.map(avatar => (
              <div
                key={avatar.id}
                className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-[#d4ff00]/40 transition-all"
              >
                <div className="aspect-[3/4] bg-zinc-800 relative overflow-hidden">
                  <img
                    src={avatar.imagePlaceholder}
                    alt={`${avatar.name} — ${avatar.niche} UGC avatar: ${avatar.style}`}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center mx-auto mb-2">
                        <Camera size={18} className="text-zinc-500" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <Badge className="bg-[#d4ff00]/10 text-[#d4ff00] border-none text-[10px] px-2 py-0.5">
                      {avatar.niche}
                    </Badge>
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm text-white">{avatar.name}</p>
                  <p className="text-zinc-500 text-xs mt-0.5 leading-tight">{avatar.style}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-zinc-500 text-sm mt-8">
            + 28 more avatars being added in June. Founding members get all future avatars at no charge.
          </p>
        </div>
      </section>

      {/* ── WHAT'S INCLUDED ── */}
      <section className="px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#d4ff00] text-xs uppercase tracking-widest font-semibold mb-3">Everything Included</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">The entire content pipeline. One tool.</h2>
            <p className="text-zinc-400 max-w-lg mx-auto text-base">
              This replaces your video editor, copywriter, VA, email marketer, and social media manager.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all">
                <div className="w-10 h-10 rounded-lg bg-[#d4ff00]/10 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-[#d4ff00]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm mb-1">{label}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING COMPARISON ── */}
      <section className="px-4 py-20 bg-zinc-950/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#d4ff00] text-xs uppercase tracking-widest font-semibold mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">They rent. You own.</h2>
            <p className="text-zinc-400 max-w-lg mx-auto text-base">
              In 7 months, HeyGen costs more than LAID founding — and you still don't own anything.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {/* HeyGen */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-zinc-400 text-sm font-semibold mb-1">HeyGen</p>
              <div className="text-3xl font-black text-white mb-1">$300<span className="text-base font-normal text-zinc-500">/mo</span></div>
              <p className="text-zinc-500 text-xs mb-5">= $3,600/yr</p>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="flex items-center gap-2"><span className="text-red-400">✕</span> Corporate-looking avatars</li>
                <li className="flex items-center gap-2"><span className="text-red-400">✕</span> No content cascade</li>
                <li className="flex items-center gap-2"><span className="text-red-400">✕</span> No audience intel</li>
                <li className="flex items-center gap-2"><span className="text-red-400">✕</span> No CRM or email</li>
                <li className="flex items-center gap-2"><span className="text-red-400">✕</span> You pay forever</li>
              </ul>
            </div>

            {/* Synthesia */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-zinc-400 text-sm font-semibold mb-1">Synthesia</p>
              <div className="text-3xl font-black text-white mb-1">$60<span className="text-base font-normal text-zinc-500">/mo</span></div>
              <p className="text-zinc-500 text-xs mb-5">= $720/yr</p>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="flex items-center gap-2"><span className="text-red-400">✕</span> Presentation avatars only</li>
                <li className="flex items-center gap-2"><span className="text-red-400">✕</span> No UGC look</li>
                <li className="flex items-center gap-2"><span className="text-red-400">✕</span> No copy generation</li>
                <li className="flex items-center gap-2"><span className="text-red-400">✕</span> No audience research</li>
                <li className="flex items-center gap-2"><span className="text-red-400">✕</span> You pay forever</li>
              </ul>
            </div>

            {/* LAID Founding */}
            <div className="bg-zinc-900 border-2 border-[#d4ff00] rounded-2xl p-6 relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#d4ff00] text-black text-xs font-bold px-3 py-1 border-none">
                BEST VALUE
              </Badge>
              <p className="text-[#d4ff00] text-sm font-semibold mb-1">LAID Founding</p>
              <div className="text-3xl font-black text-white mb-1">$1,997<span className="text-base font-normal text-zinc-400"> once</span></div>
              <p className="text-zinc-500 text-xs mb-5">Pay once. Own forever.</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-white"><Check size={14} className="text-[#d4ff00] shrink-0" /> UGC avatars that look real</li>
                <li className="flex items-center gap-2 text-white"><Check size={14} className="text-[#d4ff00] shrink-0" /> Full content cascade engine</li>
                <li className="flex items-center gap-2 text-white"><Check size={14} className="text-[#d4ff00] shrink-0" /> Audience intel (Reddit + comments)</li>
                <li className="flex items-center gap-2 text-white"><Check size={14} className="text-[#d4ff00] shrink-0" /> CRM + email sequences</li>
                <li className="flex items-center gap-2 text-white"><Check size={14} className="text-[#d4ff00] shrink-0" /> All future features included</li>
              </ul>
            </div>
          </div>

          <p className="text-center text-zinc-500 text-sm mt-8">
            After founding closes: plans start at $147/mo. No lifetime option ever again.
          </p>
        </div>
      </section>

      {/* ── FOUNDING BONUSES ── */}
      <section className="px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#d4ff00] text-xs uppercase tracking-widest font-semibold mb-3">Founding Member Bonuses</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">You get more than the software.</h2>
            <p className="text-zinc-400 max-w-lg mx-auto text-base">
              Three extras that aren't available at any other tier — ever.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                title: 'Lifetime price lock on all future tiers',
                desc: 'As LAID scales, prices will increase. Founding members are locked in at today\'s rate on all functionality, even features that move to higher tiers.',
              },
              {
                num: '02',
                title: 'Voice cloning — free forever',
                desc: 'Clone your voice and have your avatars speak in it. This feature normally costs $97/mo. Founding members get it included at no charge, forever.',
              },
              {
                num: '03',
                title: 'Direct Slack with Los for 90 days',
                desc: 'Personal access to Los Silva — product feedback, content strategy, and operator mindset. This is not a community channel. This is direct.',
              },
            ].map(({ num, title, desc }) => (
              <div key={num} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7 relative overflow-hidden">
                <div className="text-6xl font-black text-zinc-800 absolute top-4 right-5 select-none leading-none">
                  {num}
                </div>
                <div className="relative">
                  <div className="w-8 h-1 bg-[#d4ff00] rounded mb-5" />
                  <h3 className="font-bold text-white mb-3 text-lg leading-snug">{title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="px-4 py-20 bg-zinc-950/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#d4ff00] text-xs uppercase tracking-widest font-semibold mb-3">Early Feedback</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">From people who've seen it run.</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                name: 'Sarah K.',
                role: 'Agency owner, 7-figure services',
                quote: 'I tested it on a client campaign and we 3x\'d their content output in the first week. The avatars actually look real — that was the one thing I wasn\'t sure about.',
              },
              {
                name: 'James R.',
                role: 'Executive coach, B2B SaaS',
                quote: 'I\'ve tried every AI video tool. This is the first one where I don\'t feel like I have to apologize for using AI. The quality is different.',
              },
              {
                name: 'Morgan T.',
                role: 'Personal brand, 180k followers',
                quote: 'It replaced three freelancers and a weekend of filming. I post more now than I did when I had a full production team.',
              },
            ].map(({ name, role, quote }) => (
              <div key={name} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className="fill-[#d4ff00] text-[#d4ff00]" />
                  ))}
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed mb-5">"{quote}"</p>
                <div>
                  <p className="font-semibold text-white text-sm">{name}</p>
                  <p className="text-zinc-500 text-xs">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#d4ff00] text-xs uppercase tracking-widest font-semibold mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">Every question you have.</h2>
          </div>

          <div className="space-y-3">
            {FAQ.map(({ q, a }) => (
              <FAQItem key={q} q={q} a={a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="px-4 py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[#d4ff00]/6 blur-[140px]" />
        </div>

        <div className="relative max-w-3xl mx-auto">
          <p className="text-[#d4ff00] text-xs uppercase tracking-widest font-semibold mb-4">Last call</p>
          <h2 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
            50 seats. One price.<br />Never again.
          </h2>
          <p className="text-zinc-400 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            When seat 50 is claimed — or when May 31 hits — this closes. The price becomes $147/mo. No lifetime, no exceptions.
          </p>

          <div className="mb-8">
            <SeatCounter status={status} />
          </div>

          <div className="mb-10">
            <Countdown />
          </div>

          <CTAForm size="lg" />

          <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-zinc-600" />
              <span>14-day no-questions refund</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={14} className="text-zinc-600" />
              <span>Only 50 seats total</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-zinc-600" />
              <span>Closes May 31 or when full</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-zinc-800 px-4 py-10 text-center">
        <p className="text-zinc-600 text-sm mb-2">
          © 2026 LAID. All rights reserved.
        </p>
        <p className="text-zinc-700 text-xs">
          Questions? Email{' '}
          <a href="mailto:support@laidapp.com" className="text-zinc-500 hover:text-[#d4ff00] transition-colors underline underline-offset-2">
            support@laidapp.com
          </a>
        </p>
      </footer>
    </div>
  );
}
