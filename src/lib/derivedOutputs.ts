import type { BlogOutput, EmailOutput, LeadMagnetOutput, LinkedInPost } from '@/data/types';

export interface DerivedOutputSeed {
  title: string;
  hook: string;
  body: string;
  summary: string;
  cta?: string;
}

export function buildDerivedOutputs(seed: DerivedOutputSeed): {
  linkedin_post: LinkedInPost;
  email: EmailOutput;
  blog: BlogOutput;
  lead_magnet: LeadMagnetOutput;
} {
  const cta = seed.cta || 'Reply if you want the workflow map.';
  const body = seed.body.trim();
  const shortBody = body.length > 1800 ? `${body.slice(0, 1800).trim()}\n\n[Trimmed for channel fit.]` : body;

  return {
    linkedin_post: {
      hook: seed.hook || seed.title,
      body: shortBody,
      cta,
    },
    email: {
      subject: seed.title.slice(0, 78),
      preview: seed.summary.slice(0, 120),
      body: `${seed.hook || seed.title}\n\n${shortBody}\n\n${cta}`,
      cta,
    },
    blog: {
      title: seed.title,
      body_markdown: `${body}\n\n## Tactical takeaway\n\n${seed.summary}\n\n## Next step\n\n${cta}`,
    },
    lead_magnet: {
      title: `${seed.title}: implementation checklist`,
      outline: [
        'The problem this solves',
        'Source-backed proof and context',
        'The step-by-step workflow',
        'Tools, prompts, and checkpoints',
        'Common mistakes to avoid',
        'CTA and follow-up path',
      ],
      cta,
    },
  };
}
