import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import {
  Layers,
  LayoutTemplate,
  ListOrdered,
  Split,
  GraduationCap,
  Zap,
  ArrowRight,
  Check,
  X,
  Trophy,
  ChevronRight,
  Star,
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  Shield,
  Cpu,
  Globe,
  Lock,
  Sparkles,
  MessageSquare,
  Palette,
  Users,
  Megaphone,
  Download,
  Eye,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Search,
  MousePointer,
  Rocket,
  Award,
  Image,
  Save,
  Type,
  Hash,
  Pencil,
  Heart,
  Bookmark,
  Share2,
} from 'lucide-react';

/* ─────────────── Types ─────────────── */

type ToolItem = {
  name: string;
  tagline: string;
  features: string[];
  icon: string;
};

type ListItem = {
  number: number;
  title: string;
  description: string;
  icon: string;
};

type StepItem = {
  number: number;
  title: string;
  description: string;
};

type HookData = {
  headline: string;
  subheadline: string;
  tagline: string;
  cta: string;
};

type ToolComparisonData = {
  title: string;
  tools: ToolItem[];
  winner: string;
  winnerReason: string;
  cta: string;
};

type ListicleData = {
  title: string;
  items: ListItem[];
  summary: string;
  cta: string;
};

type ProblemSolutionData = {
  problemTitle: string;
  problemPoints: string[];
  solutionTitle: string;
  solutionPoints: string[];
  resultTitle: string;
  resultMetric: string;
  resultDescription: string;
  cta: string;
};

type TutorialData = {
  title: string;
  steps: StepItem[];
  resultTitle: string;
  resultDescription: string;
  cta: string;
};

type TemplateKey = 'hook' | 'tools' | 'listicle' | 'problem' | 'tutorial';

/* ─────────────── Icon map ─────────────── */

const iconMap: Record<string, React.ElementType> = {
  Zap, ArrowRight, Check, X, Trophy, ChevronRight, Star,
  BarChart3, TrendingUp, Target, Clock, Shield, Cpu, Globe,
  Lock, Sparkles, MessageSquare, Palette, Users, Megaphone,
  Eye, Lightbulb, AlertTriangle, CheckCircle2, Wrench, Search,
  MousePointer, Rocket, Award, Image, Save, Type, Hash, Pencil,
  Heart, Bookmark, Share2, Layers, GraduationCap,
};

/* ─────────────── Defaults ─────────────── */

const defaultHook: HookData = {
  headline: 'The Hook Framework That Converts',
  subheadline: 'How top creators grab attention in 3 seconds and keep viewers watching until the CTA.',
  tagline: 'Swipe for the full breakdown',
  cta: 'Follow for more →',
};

const defaultTools: ToolComparisonData = {
  title: '3 AI Tools for Content Creators',
  tools: [
    {
      name: 'Tool A',
      tagline: 'Fastest generation speed',
      features: ['Real-time editing', 'Team collaboration', 'API access'],
      icon: 'Zap',
    },
    {
      name: 'Tool B',
      tagline: 'Best value for teams',
      features: ['Unlimited exports', 'Custom templates', 'Priority support'],
      icon: 'Shield',
    },
    {
      name: 'Tool C',
      tagline: 'Most advanced features',
      features: ['AI-powered insights', 'Auto-scheduling', 'Analytics dashboard'],
      icon: 'Cpu',
    },
  ],
  winner: 'Tool B',
  winnerReason: 'Best balance of features, price, and ease of use for most creators.',
  cta: 'Try the winner free →',
};

const defaultListicle: ListicleData = {
  title: '5 Ways to Grow Your Audience',
  items: [
    { number: 1, title: 'Post consistently', description: 'Show up every day. Consistency beats perfection when building trust.', icon: 'Clock' },
    { number: 2, title: 'Lead with value', description: 'Every post should teach, entertain, or inspire. No filler content.', icon: 'Star' },
    { number: 3, title: 'Engage in comments', description: 'Reply to every comment in the first hour. The algorithm rewards conversation.', icon: 'MessageSquare' },
    { number: 4, title: 'Study your data', description: 'Double down on what works. Analytics reveal what your audience actually wants.', icon: 'BarChart3' },
    { number: 5, title: 'Collaborate widely', description: 'Partner with creators in adjacent niches to cross-pollinate audiences.', icon: 'Users' },
  ],
  summary: 'Growth is a system, not a viral moment. Implement one tactic per week.',
  cta: 'Save this carousel →',
};

const defaultProblem: ProblemSolutionData = {
  problemTitle: 'Your content gets buried',
  problemPoints: [
    'Posting daily but low engagement',
    'No clear content strategy',
    'Inconsistent visual identity',
  ],
  solutionTitle: 'Build a content system',
  solutionPoints: [
    'Batch-create with a template library',
    'Use a repeatable format structure',
    'Design once, deploy everywhere',
  ],
  resultTitle: '2.4x engagement in 30 days',
  resultMetric: '2.4x',
  resultDescription: 'Creators using structured templates see measurable audience growth within the first month.',
  cta: 'Start building your system →',
};

const defaultTutorial: TutorialData = {
  title: 'How to Build a Carousel in 4 Steps',
  steps: [
    { number: 1, title: 'Define your hook', description: 'The first slide must stop the scroll. Use a bold claim or question.' },
    { number: 2, title: 'Outline your story', description: 'Map each slide to a single idea. One thought per slide, no exceptions.' },
    { number: 3, title: 'Design the visuals', description: 'Use a consistent grid, color palette, and icon style across every slide.' },
    { number: 4, title: 'End with a CTA', description: 'Tell the viewer exactly what to do next. Save, follow, comment, or click.' },
  ],
  resultTitle: 'Your carousel is ready',
  resultDescription: 'Download, post, and watch your engagement metrics climb.',
  cta: 'Build your next carousel →',
};

/* ─────────────── Slide wrapper ─────────────── */

function SlideWrapper({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative flex flex-col overflow-hidden bg-[#0a0a0a] ${className}`}
      style={{ width: 1080, height: 1350 }}
    >
      {children}
    </div>
  );
}

/* ─────────────── Template 1: The Hook ─────────────── */

function HookSlides({ data }: { data: HookData }) {
  return [
    <SlideWrapper key="hook-1">
      {/* Top accent bar */}
      <div className="h-2 w-full bg-[#c9a84c]" />
      <div className="flex flex-1 flex-col px-[72px] pt-[96px] pb-[72px]">
        {/* Tag */}
        <div className="mb-6 inline-flex items-center gap-2 self-start border border-[#c9a84c]/30 px-4 py-2">
          <Sparkles size={14} className="text-[#c9a84c]" />
          <span className="text-sm font-medium uppercase tracking-[0.12em] text-[#c9a84c]">
            Carousel
          </span>
        </div>
        {/* Headline */}
        <h1 className="mb-8 text-[88px] font-bold leading-[1.05] tracking-tight text-white">
          {data.headline}
        </h1>
        {/* Subheadline */}
        <p className="mb-auto max-w-[720px] text-[28px] leading-[1.4] text-[#a0a0a0]">
          {data.subheadline}
        </p>
        {/* Bottom row */}
        <div className="mt-auto flex items-end justify-between">
          <p className="text-lg text-[#666666]">{data.tagline}</p>
          <div className="inline-flex items-center gap-3 bg-[#c9a84c] px-8 py-4 text-[#0a0a0a]">
            <span className="text-lg font-semibold">{data.cta}</span>
            <ArrowRight size={20} />
          </div>
        </div>
      </div>
      {/* Grid lines decoration */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex h-[240px] items-end justify-between px-[72px]">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="w-[2px] bg-[#c9a84c]/10"
            style={{ height: `${40 + (i % 3) * 20}%` }}
          />
        ))}
      </div>
    </SlideWrapper>,
  ];
}

/* ─────────────── Template 2: Tool Comparison ─────────────── */

function ToolSlides({ data }: { data: ToolComparisonData }) {
  const slides: React.ReactNode[] = [];

  // Slide 1: Intro
  slides.push(
    <SlideWrapper key="tool-1">
      <div className="h-2 w-full bg-[#c9a84c]" />
      <div className="flex flex-1 flex-col px-[72px] pt-[96px] pb-[72px]">
        <span className="mb-6 text-sm font-medium uppercase tracking-[0.12em] text-[#c9a84c]">
          Tool Comparison
        </span>
        <h1 className="mb-8 max-w-[800px] text-[80px] font-bold leading-[1.05] tracking-tight text-white">
          {data.title}
        </h1>
        <p className="mb-auto text-[24px] leading-[1.5] text-[#a0a0a0]">
          Breaking down the top options so you can choose with confidence.
        </p>
        <div className="mt-auto flex items-center gap-4 text-[#666666]">
          <span className="text-lg">7 slides</span>
          <span className="text-lg">·</span>
          <span className="text-lg">Swipe to compare</span>
        </div>
      </div>
    </SlideWrapper>
  );

  // Slides 2-4: Individual tools
  data.tools.forEach((tool, idx) => {
    const Icon = iconMap[tool.icon] || Zap;
    slides.push(
      <SlideWrapper key={`tool-${idx + 2}`}>
        <div className="h-2 w-full bg-[#c9a84c]" />
        <div className="flex flex-1 flex-col px-[72px] pt-[96px] pb-[72px]">
          <div className="mb-10 flex items-center gap-5">
            <div className="flex h-[80px] w-[80px] items-center justify-center border border-[#c9a84c]/30 bg-[#111111]">
              <Icon size={36} className="text-[#c9a84c]" />
            </div>
            <div>
              <span className="mb-1 block text-sm font-medium uppercase tracking-[0.12em] text-[#666666]">
                Option {idx + 1}
              </span>
              <h2 className="text-[56px] font-bold leading-tight text-white">
                {tool.name}
              </h2>
            </div>
          </div>
          <p className="mb-12 text-[28px] leading-[1.4] text-[#a0a0a0]">
            {tool.tagline}
          </p>
          <div className="mt-auto space-y-5">
            {tool.features.map((feat, fIdx) => (
              <div key={fIdx} className="flex items-start gap-4">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center bg-[#c9a84c]">
                  <Check size={14} className="text-[#0a0a0a]" />
                </div>
                <span className="text-[24px] leading-[1.4] text-white">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </SlideWrapper>
    );
  });

  // Slide 5: Comparison table
  const allFeatures = Array.from(
    new Set(data.tools.flatMap((t) => t.features))
  );
  slides.push(
    <SlideWrapper key="tool-5">
      <div className="h-2 w-full bg-[#c9a84c]" />
      <div className="flex flex-1 flex-col px-[72px] pt-[72px] pb-[72px]">
        <span className="mb-6 text-sm font-medium uppercase tracking-[0.12em] text-[#c9a84c]">
          Head to Head
        </span>
        <h2 className="mb-10 text-[48px] font-bold leading-tight text-white">
          Feature Comparison
        </h2>
        <div className="flex-1 overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-[#c9a84c]">
                <th className="py-4 pr-4 text-left text-lg font-semibold text-[#666666]">
                  Feature
                </th>
                {data.tools.map((t) => (
                  <th key={t.name} className="py-4 px-4 text-center text-lg font-bold text-white">
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allFeatures.slice(0, 5).map((feat, fIdx) => (
                <tr key={fIdx} className="border-b border-[#222222]">
                  <td className="py-5 pr-4 text-[22px] text-[#a0a0a0]">{feat}</td>
                  {data.tools.map((t) => (
                    <td key={t.name} className="py-5 px-4 text-center">
                      {t.features.includes(feat) ? (
                        <Check size={24} className="mx-auto text-[#c9a84c]" />
                      ) : (
                        <X size={24} className="mx-auto text-[#666666]" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SlideWrapper>
  );

  // Slide 6: Winner
  slides.push(
    <SlideWrapper key="tool-6">
      <div className="h-2 w-full bg-[#c9a84c]" />
      <div className="flex flex-1 flex-col items-center justify-center px-[72px] text-center">
        <div className="mb-8 flex h-[100px] w-[100px] items-center justify-center bg-[#c9a84c]">
          <Trophy size={48} className="text-[#0a0a0a]" />
        </div>
        <span className="mb-4 text-sm font-medium uppercase tracking-[0.12em] text-[#c9a84c]">
          Winner
        </span>
        <h2 className="mb-6 text-[72px] font-bold leading-tight text-white">
          {data.winner}
        </h2>
        <p className="max-w-[640px] text-[24px] leading-[1.5] text-[#a0a0a0]">
          {data.winnerReason}
        </p>
      </div>
    </SlideWrapper>
  );

  // Slide 7: CTA
  slides.push(
    <SlideWrapper key="tool-7">
      <div className="h-2 w-full bg-[#c9a84c]" />
      <div className="flex flex-1 flex-col items-center justify-center px-[72px] text-center">
        <h2 className="mb-8 text-[64px] font-bold leading-tight text-white">
          Ready to choose?
        </h2>
        <div className="inline-flex items-center gap-3 bg-[#c9a84c] px-10 py-5 text-[#0a0a0a]">
          <span className="text-xl font-semibold">{data.cta}</span>
          <ArrowRight size={24} />
        </div>
        <p className="mt-10 text-lg text-[#666666]">Follow for more comparisons</p>
      </div>
    </SlideWrapper>
  );

  return slides;
}

/* ─────────────── Template 3: The Listicle ─────────────── */

function ListicleSlides({ data }: { data: ListicleData }) {
  const slides: React.ReactNode[] = [];

  // Slide 1: Hook
  slides.push(
    <SlideWrapper key="list-1">
      <div className="h-2 w-full bg-[#c9a84c]" />
      <div className="flex flex-1 flex-col px-[72px] pt-[96px] pb-[72px]">
        <span className="mb-6 text-sm font-medium uppercase tracking-[0.12em] text-[#c9a84c]">
          Save this post
        </span>
        <h1 className="mb-auto max-w-[800px] text-[80px] font-bold leading-[1.05] tracking-tight text-white">
          {data.title}
        </h1>
        <div className="mt-auto flex items-center gap-3 text-[#666666]">
          <Bookmark size={20} />
          <span className="text-lg">{data.items.length + 2} slides · Swipe through</span>
        </div>
      </div>
    </SlideWrapper>
  );

  // Item slides
  data.items.forEach((item) => {
    const Icon = iconMap[item.icon] || Star;
    slides.push(
      <SlideWrapper key={`list-${item.number + 1}`}>
        <div className="h-2 w-full bg-[#c9a84c]" />
        <div className="flex flex-1 flex-col px-[72px] pt-[80px] pb-[72px]">
          <div className="mb-8 flex items-baseline gap-6">
            <span className="text-[120px] font-bold leading-none text-[#c9a84c]/20">
              {String(item.number).padStart(2, '0')}
            </span>
          </div>
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-[56px] w-[56px] items-center justify-center border border-[#c9a84c]/30 bg-[#111111]">
              <Icon size={28} className="text-[#c9a84c]" />
            </div>
            <h2 className="text-[48px] font-bold leading-tight text-white">
              {item.title}
            </h2>
          </div>
          <p className="max-w-[720px] text-[28px] leading-[1.4] text-[#a0a0a0]">
            {item.description}
          </p>
          <div className="mt-auto flex items-center gap-2 text-[#666666]">
            <span className="text-lg">
              {item.number} / {data.items.length}
            </span>
          </div>
        </div>
      </SlideWrapper>
    );
  });

  // Summary slide
  slides.push(
    <SlideWrapper key="list-summary">
      <div className="h-2 w-full bg-[#c9a84c]" />
      <div className="flex flex-1 flex-col justify-center px-[72px]">
        <span className="mb-6 text-sm font-medium uppercase tracking-[0.12em] text-[#c9a84c]">
          Summary
        </span>
        <p className="max-w-[800px] text-[36px] font-medium leading-[1.4] text-white">
          {data.summary}
        </p>
      </div>
    </SlideWrapper>
  );

  // CTA slide
  slides.push(
    <SlideWrapper key="list-cta">
      <div className="h-2 w-full bg-[#c9a84c]" />
      <div className="flex flex-1 flex-col items-center justify-center px-[72px] text-center">
        <div className="mb-8 flex h-[80px] w-[80px] items-center justify-center border border-[#c9a84c]/30 bg-[#111111]">
          <Heart size={36} className="text-[#c9a84c]" />
        </div>
        <h2 className="mb-6 text-[56px] font-bold leading-tight text-white">
          Liked this list?
        </h2>
        <div className="inline-flex items-center gap-3 bg-[#c9a84c] px-10 py-5 text-[#0a0a0a]">
          <span className="text-xl font-semibold">{data.cta}</span>
          <Bookmark size={24} />
        </div>
        <p className="mt-10 text-lg text-[#666666]">Share with someone who needs to see this</p>
      </div>
    </SlideWrapper>
  );

  return slides;
}

/* ─────────────── Template 4: Problem/Solution ─────────────── */

function ProblemSolutionSlides({ data }: { data: ProblemSolutionData }) {
  const slides: React.ReactNode[] = [];

  // Slide 1: Problem
  slides.push(
    <SlideWrapper key="ps-1">
      <div className="h-2 w-full bg-[#666666]" />
      <div className="flex flex-1">
        <div className="flex w-1/2 flex-col justify-center border-r border-[#222222] px-[56px]">
          <div className="mb-6 flex items-center gap-3">
            <AlertTriangle size={24} className="text-[#666666]" />
            <span className="text-sm font-medium uppercase tracking-[0.12em] text-[#666666]">
              The Problem
            </span>
          </div>
          <h2 className="text-[52px] font-bold leading-[1.1] text-white">
            {data.problemTitle}
          </h2>
        </div>
        <div className="flex w-1/2 flex-col justify-center px-[56px]">
          <div className="space-y-6">
            {data.problemPoints.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <X size={22} className="mt-1 shrink-0 text-[#666666]" />
                <span className="text-[22px] leading-[1.4] text-[#a0a0a0]">{pt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideWrapper>
  );

  // Slide 2: Solution
  slides.push(
    <SlideWrapper key="ps-2">
      <div className="h-2 w-full bg-[#c9a84c]" />
      <div className="flex flex-1">
        <div className="flex w-1/2 flex-col justify-center border-r border-[#222222] px-[56px]">
          <div className="mb-6 flex items-center gap-3">
            <CheckCircle2 size={24} className="text-[#c9a84c]" />
            <span className="text-sm font-medium uppercase tracking-[0.12em] text-[#c9a84c]">
              The Solution
            </span>
          </div>
          <h2 className="text-[52px] font-bold leading-[1.1] text-white">
            {data.solutionTitle}
          </h2>
        </div>
        <div className="flex w-1/2 flex-col justify-center px-[56px]">
          <div className="space-y-6">
            {data.solutionPoints.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center bg-[#c9a84c]">
                  <Check size={14} className="text-[#0a0a0a]" />
                </div>
                <span className="text-[22px] leading-[1.4] text-white">{pt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideWrapper>
  );

  // Slide 3: Result
  slides.push(
    <SlideWrapper key="ps-3">
      <div className="h-2 w-full bg-[#c9a84c]" />
      <div className="flex flex-1 flex-col items-center justify-center px-[72px] text-center">
        <span className="mb-6 text-sm font-medium uppercase tracking-[0.12em] text-[#c9a84c]">
          The Result
        </span>
        <h2 className="mb-4 text-[48px] font-bold leading-tight text-white">
          {data.resultTitle}
        </h2>
        <p className="mb-12 max-w-[640px] text-[24px] leading-[1.5] text-[#a0a0a0]">
          {data.resultDescription}
        </p>
        <div className="flex items-center gap-8">
          {[
            { label: 'Engagement', value: '+147%' },
            { label: 'Reach', value: '+89%' },
            { label: 'Saves', value: '+203%' },
          ].map((stat) => (
            <div key={stat.label} className="border-l-2 border-[#c9a84c] pl-6 text-left">
              <div className="text-[40px] font-bold text-[#c9a84c]">{stat.value}</div>
              <div className="text-lg text-[#666666]">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </SlideWrapper>
  );

  // Slide 4: CTA
  slides.push(
    <SlideWrapper key="ps-4">
      <div className="h-2 w-full bg-[#c9a84c]" />
      <div className="flex flex-1 flex-col items-center justify-center px-[72px] text-center">
        <h2 className="mb-8 text-[56px] font-bold leading-tight text-white">
          Stop guessing. Start growing.
        </h2>
        <div className="inline-flex items-center gap-3 bg-[#c9a84c] px-10 py-5 text-[#0a0a0a]">
          <span className="text-xl font-semibold">{data.cta}</span>
          <ArrowRight size={24} />
        </div>
      </div>
    </SlideWrapper>
  );

  return slides;
}

/* ─────────────── Template 5: The Tutorial ─────────────── */

function TutorialSlides({ data }: { data: TutorialData }) {
  const slides: React.ReactNode[] = [];

  // Slide 1: Hook
  slides.push(
    <SlideWrapper key="tut-1">
      <div className="h-2 w-full bg-[#c9a84c]" />
      <div className="flex flex-1 flex-col px-[72px] pt-[96px] pb-[72px]">
        <span className="mb-6 text-sm font-medium uppercase tracking-[0.12em] text-[#c9a84c]">
          Step-by-Step Tutorial
        </span>
        <h1 className="mb-auto max-w-[800px] text-[76px] font-bold leading-[1.05] tracking-tight text-white">
          {data.title}
        </h1>
        <div className="mt-auto flex items-center gap-3 text-[#666666]">
          <GraduationCap size={20} />
          <span className="text-lg">
            {data.steps.length + 1} slides · Follow along
          </span>
        </div>
      </div>
    </SlideWrapper>
  );

  // Step slides
  data.steps.forEach((step) => {
    slides.push(
      <SlideWrapper key={`tut-${step.number + 1}`}>
        <div className="h-2 w-full bg-[#c9a84c]" />
        <div className="flex flex-1 flex-col px-[72px] pt-[80px] pb-[72px]">
          <div className="mb-8 flex items-center gap-6">
            <div className="flex h-[72px] w-[72px] items-center justify-center bg-[#c9a84c]">
              <span className="text-[32px] font-bold text-[#0a0a0a]">
                {String(step.number).padStart(2, '0')}
              </span>
            </div>
            <span className="text-sm font-medium uppercase tracking-[0.12em] text-[#666666]">
              Step {step.number} of {data.steps.length}
            </span>
          </div>
          <h2 className="mb-6 text-[48px] font-bold leading-tight text-white">
            {step.title}
          </h2>
          <p className="max-w-[720px] text-[28px] leading-[1.4] text-[#a0a0a0]">
            {step.description}
          </p>
          <div className="mt-auto flex gap-2">
            {data.steps.map((s) => (
              <div
                key={s.number}
                className={`h-[4px] w-12 ${
                  s.number === step.number ? 'bg-[#c9a84c]' : 'bg-[#222222]'
                }`}
              />
            ))}
          </div>
        </div>
      </SlideWrapper>
    );
  });

  // Result slide
  slides.push(
    <SlideWrapper key="tut-result">
      <div className="h-2 w-full bg-[#c9a84c]" />
      <div className="flex flex-1 flex-col items-center justify-center px-[72px] text-center">
        <div className="mb-8 flex h-[80px] w-[80px] items-center justify-center border border-[#c9a84c]/30 bg-[#111111]">
          <Rocket size={36} className="text-[#c9a84c]" />
        </div>
        <h2 className="mb-6 text-[56px] font-bold leading-tight text-white">
          {data.resultTitle}
        </h2>
        <p className="mb-12 max-w-[640px] text-[24px] leading-[1.5] text-[#a0a0a0]">
          {data.resultDescription}
        </p>
        <div className="inline-flex items-center gap-3 bg-[#c9a84c] px-10 py-5 text-[#0a0a0a]">
          <span className="text-xl font-semibold">{data.cta}</span>
          <ArrowRight size={24} />
        </div>
      </div>
    </SlideWrapper>
  );

  return slides;
}

/* ─────────────── Input helpers ─────────────── */

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const inputClasses =
    'w-full bg-[#111111] border border-[#222222] px-3 py-2 text-sm text-white placeholder-[#666666] focus:border-[#c9a84c] focus:outline-none transition-colors';

  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wider text-[#a0a0a0]">
        {label}
      </span>
      {multiline ? (
        <textarea
          className={`${inputClasses} min-h-[72px] resize-y`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          className={inputClasses}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

/* ─────────────── Input panels ─────────────── */

function HookInputs({ data, onChange }: { data: HookData; onChange: (d: HookData) => void }) {
  const set = (k: keyof HookData, v: string) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-4">
      <TextInput label="Headline" value={data.headline} onChange={(v) => set('headline', v)} />
      <TextInput label="Subheadline" value={data.subheadline} onChange={(v) => set('subheadline', v)} multiline />
      <TextInput label="Tagline" value={data.tagline} onChange={(v) => set('tagline', v)} />
      <TextInput label="CTA" value={data.cta} onChange={(v) => set('cta', v)} />
    </div>
  );
}

function ToolInputs({ data, onChange }: { data: ToolComparisonData; onChange: (d: ToolComparisonData) => void }) {
  const setTool = (idx: number, k: keyof ToolItem, v: string | string[]) => {
    const tools = data.tools.map((t, i) => (i === idx ? { ...t, [k]: v } : t));
    onChange({ ...data, tools });
  };
  const setFeature = (toolIdx: number, featIdx: number, v: string) => {
    const tools = data.tools.map((t, i) => {
      if (i !== toolIdx) return t;
      const features = t.features.map((f, fi) => (fi === featIdx ? v : f));
      return { ...t, features };
    });
    onChange({ ...data, tools });
  };
  return (
    <div className="space-y-6">
      <TextInput label="Comparison Title" value={data.title} onChange={(v) => onChange({ ...data, title: v })} />
      {data.tools.map((tool, idx) => (
        <div key={idx} className="space-y-3 border-l-2 border-[#c9a84c] pl-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#c9a84c]">Tool {idx + 1}</span>
          <TextInput label="Name" value={tool.name} onChange={(v) => setTool(idx, 'name', v)} />
          <TextInput label="Tagline" value={tool.tagline} onChange={(v) => setTool(idx, 'tagline', v)} />
          <div className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-[#a0a0a0]">Features</span>
            {tool.features.map((feat, fIdx) => (
              <input
                key={fIdx}
                type="text"
                className="w-full bg-[#111111] border border-[#222222] px-3 py-2 text-sm text-white placeholder-[#666666] focus:border-[#c9a84c] focus:outline-none"
                value={feat}
                onChange={(e) => setFeature(idx, fIdx, e.target.value)}
              />
            ))}
          </div>
        </div>
      ))}
      <TextInput label="Winner" value={data.winner} onChange={(v) => onChange({ ...data, winner: v })} />
      <TextInput label="Winner Reason" value={data.winnerReason} onChange={(v) => onChange({ ...data, winnerReason: v })} multiline />
      <TextInput label="CTA" value={data.cta} onChange={(v) => onChange({ ...data, cta: v })} />
    </div>
  );
}

function ListicleInputs({ data, onChange }: { data: ListicleData; onChange: (d: ListicleData) => void }) {
  const setItem = (idx: number, k: keyof ListItem, v: string | number) => {
    const items = data.items.map((item, i) => (i === idx ? { ...item, [k]: v } : item));
    onChange({ ...data, items });
  };
  return (
    <div className="space-y-6">
      <TextInput label="Title" value={data.title} onChange={(v) => onChange({ ...data, title: v })} />
      {data.items.map((item, idx) => (
        <div key={idx} className="space-y-3 border-l-2 border-[#c9a84c] pl-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#c9a84c]">Item {idx + 1}</span>
          <TextInput label="Title" value={item.title} onChange={(v) => setItem(idx, 'title', v)} />
          <TextInput label="Description" value={item.description} onChange={(v) => setItem(idx, 'description', v)} multiline />
          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-[#a0a0a0]">Icon</span>
            <select
              className="w-full bg-[#111111] border border-[#222222] px-3 py-2 text-sm text-white focus:border-[#c9a84c] focus:outline-none"
              value={item.icon}
              onChange={(e) => setItem(idx, 'icon', e.target.value)}
            >
              {Object.keys(iconMap).map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
        </div>
      ))}
      <TextInput label="Summary" value={data.summary} onChange={(v) => onChange({ ...data, summary: v })} multiline />
      <TextInput label="CTA" value={data.cta} onChange={(v) => onChange({ ...data, cta: v })} />
    </div>
  );
}

function ProblemInputs({ data, onChange }: { data: ProblemSolutionData; onChange: (d: ProblemSolutionData) => void }) {
  const setPoint = (section: 'problemPoints' | 'solutionPoints', idx: number, v: string) => {
    const arr = data[section].map((p, i) => (i === idx ? v : p));
    onChange({ ...data, [section]: arr });
  };
  return (
    <div className="space-y-6">
      <div className="space-y-3 border-l-2 border-[#666666] pl-4">
        <span className="text-xs font-medium uppercase tracking-wider text-[#666666]">Problem</span>
        <TextInput label="Problem Title" value={data.problemTitle} onChange={(v) => onChange({ ...data, problemTitle: v })} />
        {data.problemPoints.map((pt, idx) => (
          <TextInput key={idx} label={`Point ${idx + 1}`} value={pt} onChange={(v) => setPoint('problemPoints', idx, v)} />
        ))}
      </div>
      <div className="space-y-3 border-l-2 border-[#c9a84c] pl-4">
        <span className="text-xs font-medium uppercase tracking-wider text-[#c9a84c]">Solution</span>
        <TextInput label="Solution Title" value={data.solutionTitle} onChange={(v) => onChange({ ...data, solutionTitle: v })} />
        {data.solutionPoints.map((pt, idx) => (
          <TextInput key={idx} label={`Point ${idx + 1}`} value={pt} onChange={(v) => setPoint('solutionPoints', idx, v)} />
        ))}
      </div>
      <TextInput label="Result Title" value={data.resultTitle} onChange={(v) => onChange({ ...data, resultTitle: v })} />
      <TextInput label="Result Description" value={data.resultDescription} onChange={(v) => onChange({ ...data, resultDescription: v })} multiline />
      <TextInput label="CTA" value={data.cta} onChange={(v) => onChange({ ...data, cta: v })} />
    </div>
  );
}

function TutorialInputs({ data, onChange }: { data: TutorialData; onChange: (d: TutorialData) => void }) {
  const setStep = (idx: number, k: keyof StepItem, v: string | number) => {
    const steps = data.steps.map((s, i) => (i === idx ? { ...s, [k]: v } : s));
    onChange({ ...data, steps });
  };
  return (
    <div className="space-y-6">
      <TextInput label="Tutorial Title" value={data.title} onChange={(v) => onChange({ ...data, title: v })} />
      {data.steps.map((step, idx) => (
        <div key={idx} className="space-y-3 border-l-2 border-[#c9a84c] pl-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#c9a84c]">Step {idx + 1}</span>
          <TextInput label="Step Title" value={step.title} onChange={(v) => setStep(idx, 'title', v)} />
          <TextInput label="Description" value={step.description} onChange={(v) => setStep(idx, 'description', v)} multiline />
        </div>
      ))}
      <TextInput label="Result Title" value={data.resultTitle} onChange={(v) => onChange({ ...data, resultTitle: v })} />
      <TextInput label="Result Description" value={data.resultDescription} onChange={(v) => onChange({ ...data, resultDescription: v })} multiline />
      <TextInput label="CTA" value={data.cta} onChange={(v) => onChange({ ...data, cta: v })} />
    </div>
  );
}

/* ─────────────── Main component ─────────────── */

export default function CarouselGenerator() {
  const [activeTab, setActiveTab] = useState<TemplateKey>('hook');

  const [hookData, setHookData] = useState<HookData>(defaultHook);
  const [toolData, setToolData] = useState<ToolComparisonData>(defaultTools);
  const [listicleData, setListicleData] = useState<ListicleData>(defaultListicle);
  const [problemData, setProblemData] = useState<ProblemSolutionData>(defaultProblem);
  const [tutorialData, setTutorialData] = useState<TutorialData>(defaultTutorial);

  const [downloading, setDownloading] = useState<Record<string, boolean>>({});

  const tabs: { key: TemplateKey; label: string; icon: React.ElementType }[] = [
    { key: 'hook', label: 'The Hook', icon: Layers },
    { key: 'tools', label: 'Tool Comparison', icon: LayoutTemplate },
    { key: 'listicle', label: 'The Listicle', icon: ListOrdered },
    { key: 'problem', label: 'Problem/Solution', icon: Split },
    { key: 'tutorial', label: 'The Tutorial', icon: GraduationCap },
  ] as const;

  const getSlides = useCallback((key: TemplateKey): React.ReactNode[] => {
    switch (key) {
      case 'hook':
        return HookSlides({ data: hookData });
      case 'tools':
        return ToolSlides({ data: toolData });
      case 'listicle':
        return ListicleSlides({ data: listicleData });
      case 'problem':
        return ProblemSolutionSlides({ data: problemData });
      case 'tutorial':
        return TutorialSlides({ data: tutorialData });
    }
  }, [hookData, toolData, listicleData, problemData, tutorialData]);

  const handleDownload = async (slideIndex: number) => {
    const slides = getSlides(activeTab);
    const slideKey = `${activeTab}-${slideIndex}`;
    setDownloading((prev) => ({ ...prev, [slideKey]: true }));

    try {
      // Render hidden slide for capture
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);

      const slideEl = slides[slideIndex] as React.ReactElement;
      // We clone the slide into the hidden container using ReactDOM
      // But since we have the React element, we can create a root and render it
      const { createRoot } = await import('react-dom/client');
      const root = createRoot(container);
      root.render(slideEl);

      // Wait for fonts/layout
      await new Promise((r) => setTimeout(r, 500));

      const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
        scale: 1,
        useCORS: true,
        backgroundColor: '#0a0a0a',
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `${activeTab}-slide-${slideIndex + 1}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      root.unmount();
      document.body.removeChild(container);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading((prev) => ({ ...prev, [slideKey]: false }));
    }
  };

  const handleDownloadAll = async () => {
    const slides = getSlides(activeTab);
    for (let i = 0; i < slides.length; i++) {
      await handleDownload(i);
      await new Promise((r) => setTimeout(r, 300));
    }
  };

  const renderInputs = () => {
    switch (activeTab) {
      case 'hook':
        return <HookInputs data={hookData} onChange={setHookData} />;
      case 'tools':
        return <ToolInputs data={toolData} onChange={setToolData} />;
      case 'listicle':
        return <ListicleInputs data={listicleData} onChange={setListicleData} />;
      case 'problem':
        return <ProblemInputs data={problemData} onChange={setProblemData} />;
      case 'tutorial':
        return <TutorialInputs data={tutorialData} onChange={setTutorialData} />;
    }
  };

  const previewSlides = getSlides(activeTab);

  return (
    <div className="min-h-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Carousel Generator</h1>
          <p className="mt-1 text-sm text-[#a0a0a0]">
            Design, preview, and export social media carousels.
          </p>
        </div>
        <button
          onClick={handleDownloadAll}
          className="inline-flex items-center gap-2 bg-[#c9a84c] px-4 py-2 text-sm font-semibold text-[#0a0a0a] hover:bg-[#b89a42] transition-colors"
        >
          <Download size={16} />
          Download All
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#222222] pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-b-2 border-[#c9a84c] text-[#c9a84c]'
                  : 'text-[#a0a0a0] hover:text-white'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        {/* Inputs panel */}
        <div className="space-y-4">
          <div className="sticky top-4 max-h-[calc(100dvh-140px)] overflow-y-auto rounded-none border border-[#222222] bg-[#0a0a0a] p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#a0a0a0]">
              Customize Content
            </h3>
            {renderInputs()}
          </div>
        </div>

        {/* Preview panel */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#a0a0a0]">
              Preview ({previewSlides.length} slides)
            </h3>
            <span className="text-xs text-[#666666]">1080 × 1350 px</span>
          </div>

          <div className="space-y-6">
            {previewSlides.map((slide, idx) => {
              const slideKey = `${activeTab}-${idx}`;
              const isDownloading = downloading[slideKey];
              return (
                <div key={slideKey} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-[#666666]">
                      Slide {idx + 1}
                    </span>
                    <button
                      onClick={() => handleDownload(idx)}
                      disabled={isDownloading}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#c9a84c] hover:text-white disabled:opacity-50 transition-colors"
                    >
                      <Download size={14} />
                      {isDownloading ? 'Exporting...' : 'Download PNG'}
                    </button>
                  </div>
                  {/* Scaled preview */}
                  <div
                    className="overflow-hidden border border-[#222222] bg-[#0a0a0a]"
                    style={{ width: 324, height: 405 }}
                  >
                    <div style={{ transform: 'scale(0.3)', transformOrigin: 'top left' }}>
                      {slide}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
