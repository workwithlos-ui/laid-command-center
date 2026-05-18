import { Clipboard, Copy, MessageSquare, PhoneCall, Target, Timer, Trophy, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const dmOpener = `Saw your post about [specific topic]. You have enough raw expertise to be posting 5x more without sounding generic. I am building AI content command centers that turn calls, notes, and videos into source-checked LinkedIn posts, threads, emails, and lead magnets. Want me to show you what that would look like for your business?`;

const followUp = `The useful part is not just AI writing. It is the system: research, organize, optimize, write, source check, edit, tone check, engagement check. Then it learns from edits and performance. I can build a lightweight version around your offer.`;

const closeScript = `This is not a content calendar. It is an operating system for turning your expertise into proof-backed assets. I can build the first version in 14 days. You get the workspace, brand memory, agent pipeline, and 10 content packs. Setup is $3,500. If you want me to manage the system after, it is $1,250/month.`;

const leadTypes = ['B2B agencies', 'AI consultants', 'SaaS founders', 'high-ticket coaches', 'local services doing $1M+', 'recruiters, brokers, consultants'];

const callFlow = [
  'Ask what they sell and average deal size.',
  'Ask where content comes from now.',
  'Ask how much founder time content takes weekly.',
  'Ask what happens after someone engages.',
  'Show source input, brief approval, agent artifacts, pack modal, and client handoff.',
  'Pitch a 14-day build.',
  'Close setup fee plus monthly support.',
];

const fulfillment = [
  'Day 1: create workspace, add offer, audience, proof, voice, banned phrases.',
  'Days 2-4: build first 5 packs, edit voice, save learnings.',
  'Days 5-7: run Market Radar, score 20 ideas, pick 10 assets.',
  'Days 8-14: ship content, track DMs, calls, revenue, and feed performance back.',
];

export function SalesKitView() {
  const [copied, setCopied] = useState('');

  const copyText = async (label: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 1400);
  };

  return (
    <div className="space-y-8">
      <section className="obsidian-card obsidian-glow rounded-[28px] p-6 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#22D3EE]">Sales Kit</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[#F8FAFC] md:text-5xl">Sell 15 agent systems in June.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[#A1A1AA]">
              Use this as the daily sales cockpit: lead targets, scripts, call flow, and fulfillment path for selling Content Command as a company system.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric icon={Target} label="June" value="15" />
            <Metric icon={Timer} label="15 days" value="7" />
            <Metric icon={Users} label="DMs/day" value="60" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <ScriptCard title="DM Opener" body={dmOpener} copied={copied === 'DM Opener'} onCopy={() => copyText('DM Opener', dmOpener)} />
        <ScriptCard title="Follow Up" body={followUp} copied={copied === 'Follow Up'} onCopy={() => copyText('Follow Up', followUp)} />
        <ScriptCard title="Close Script" body={closeScript} copied={copied === 'Close Script'} onCopy={() => copyText('Close Script', closeScript)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel icon={Trophy} title="Best Leads">
          <div className="grid gap-2 sm:grid-cols-2">
            {leadTypes.map((lead) => (
              <div key={lead} className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2 text-sm text-[#A1A1AA]">{lead}</div>
            ))}
          </div>
        </Panel>

        <Panel icon={PhoneCall} title="Call Flow">
          <ol className="space-y-2 text-sm leading-6 text-[#A1A1AA]">
            {callFlow.map((item, index) => <li key={item}>{index + 1}. {item}</li>)}
          </ol>
        </Panel>
      </section>

      <Panel icon={Clipboard} title="14-Day Fulfillment Path">
        <div className="grid gap-3 md:grid-cols-2">
          {fulfillment.map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-[#A1A1AA]">{item}</div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) {
  return (
    <div className="min-w-24 rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <Icon className="mx-auto h-4 w-4 text-[#22D3EE]" />
      <div className="mt-2 text-2xl font-semibold text-[#F8FAFC]">{value}</div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-[#71717A]">{label}</div>
    </div>
  );
}

function ScriptCard({ title, body, copied, onCopy }: { title: string; body: string; copied: boolean; onCopy: () => void }) {
  return (
    <article className="obsidian-elevated rounded-[24px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <MessageSquare className="h-5 w-5 text-[#22D3EE]" />
          <h3 className="mt-3 text-base font-semibold text-[#F8FAFC]">{title}</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onCopy} className="h-8 rounded-xl px-3 text-xs text-[#A1A1AA] hover:bg-white/[0.06] hover:text-[#22D3EE]">
          <Copy className="mr-1 h-3.5 w-3.5" /> {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#A1A1AA]">{body}</p>
    </article>
  );
}

function Panel({ icon: Icon, title, children }: { icon: typeof Trophy; title: string; children: ReactNode }) {
  return (
    <section className="rounded-[24px] border border-white/[0.08] bg-[#101014]/82 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl border border-[#A855F7]/25 bg-[#A855F7]/12 text-[#D8B4FE]">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-[#F8FAFC]">{title}</h3>
      </div>
      {children}
    </section>
  );
}
