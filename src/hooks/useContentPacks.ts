import { useState, useEffect, useCallback } from 'react';
import type { ContentPack } from '@/data/types';
import samplePacks from '@/data/content_packs.json';

const STORAGE_KEY = 'ai-content-packs';

function loadPacks(): ContentPack[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ContentPack[];
      if (parsed.length > 0) return parsed;
    }
  } catch {
    // ignore parse errors
  }
  // Seed with sample packs on first load
  const samples = samplePacks as unknown as ContentPack[];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
  return samples;
}

function savePacks(packs: ContentPack[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(packs));
}

export function useContentPacks() {
  const [packs, setPacks] = useState<ContentPack[]>(loadPacks);

  useEffect(() => {
    savePacks(packs);
  }, [packs]);

  const addPack = useCallback((pack: ContentPack) => {
    setPacks((prev) => [pack, ...prev]);
  }, []);

  const updatePack = useCallback((id: string, updates: Partial<ContentPack>) => {
    setPacks((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const deletePack = useCallback((id: string) => {
    setPacks((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const togglePosted = useCallback((id: string) => {
    setPacks((prev) =>
      prev.map((p) => (p.id === id ? { ...p, posted: !p.posted } : p))
    );
  }, []);

  const resetToSamples = useCallback(() => {
    const samples = samplePacks as unknown as ContentPack[];
    setPacks(samples);
  }, []);

  return { packs, addPack, updatePack, deletePack, togglePosted, resetToSamples };
}
