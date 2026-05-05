import { useState } from 'react';
import { AssetCard } from '@/components/AssetCard';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import assetsData from '@/data/laid_assets.json';

export function AssetsView() {
  const [, setCopiedAssets] = useLocalStorage<string[]>('laid-assets-copied', []);
  const [toast, setToast] = useState({ visible: false, message: '' });

  const handleCopy = (text: string, keyword: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAssets((prev) => {
      if (prev.includes(keyword)) return prev;
      return [...prev, keyword];
    });
    setToast({ visible: true, message: 'Copied. Now go get clients.' });
    setTimeout(() => setToast({ visible: false, message: '' }), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-[#666666]">
        {assetsData.length} deliverables ready
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assetsData.map((asset, index) => (
          <div
            key={asset.id}
            className="animate-in fade-in slide-in-from-bottom-2 duration-200"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <AssetCard
              asset={asset}
              onCopy={(text) => handleCopy(text, asset.keyword)}
            />
          </div>
        ))}
      </div>

      {toast.visible && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 transform lg:bottom-8">
          <div className="flex items-center gap-2 rounded-lg border border-[#c9a84c] bg-[#111111] px-4 py-3 shadow-lg">
            <span className="text-sm font-medium text-white">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
