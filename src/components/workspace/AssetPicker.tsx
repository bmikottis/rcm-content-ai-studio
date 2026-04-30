"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSimpleCanvasStore } from "@/stores/simple-canvas";
import { cn } from "@/lib/cn";

// Mock asset library
const mockAssets = [
  { id: "1", src: "/images/hero-spring.jpg", name: "Spring Collection", category: "hero" },
  { id: "2", src: "/images/hero-sale.jpg", name: "Sale Banner", category: "hero" },
  { id: "3", src: "/images/product-1.jpg", name: "Product Showcase", category: "product" },
  { id: "4", src: "/images/product-2.jpg", name: "Featured Item", category: "product" },
  { id: "5", src: "/images/lifestyle-1.jpg", name: "Lifestyle Shot", category: "lifestyle" },
  { id: "6", src: "/images/lifestyle-2.jpg", name: "Brand Story", category: "lifestyle" },
  { id: "7", src: "/images/pattern-1.jpg", name: "Pattern Background", category: "background" },
  { id: "8", src: "/images/abstract-1.jpg", name: "Abstract Design", category: "background" },
];

const categories = [
  { id: "all", label: "All" },
  { id: "hero", label: "Hero" },
  { id: "product", label: "Product" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "background", label: "Background" },
];

export function AssetPicker() {
  const {
    showAssetPicker,
    setShowAssetPicker,
    selectedElement,
    replaceImage,
  } = useSimpleCanvasStore();

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  if (!showAssetPicker || !selectedElement) return null;

  const filteredAssets = mockAssets.filter((asset) => {
    const matchesCategory = activeCategory === "all" || asset.category === activeCategory;
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectAsset = (asset: typeof mockAssets[0]) => {
    replaceImage(selectedElement.cardId, selectedElement.elementId, asset.src, asset.name);
    setShowAssetPicker(false);
  };

  const handleClose = () => {
    setShowAssetPicker(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl max-h-[80vh] bg-[var(--surface)] rounded-lg shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E5]">
            <div>
              <h2 className="text-[16px] font-bold text-[var(--text-primary)]">Select Image</h2>
              <p className="text-[13px] text-[var(--text-muted)]">Choose from your asset library</p>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--background)] transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Search and filters */}
          <div className="px-5 py-3 border-b border-[#E5E5E5] space-y-3">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets..."
                className="w-full pl-10 pr-4 py-2 rounded border border-[var(--border)] text-[13px] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#0F8EFF] focus:ring-1 focus:ring-[#0F8EFF]"
              />
            </div>

            {/* Category tabs */}
            <div className="flex gap-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "px-3 py-1.5 rounded text-[13px] font-bold transition-colors",
                    activeCategory === cat.id
                      ? "bg-[#0F8EFF] text-white"
                      : "bg-[var(--background)] text-[var(--text-muted)] hover:bg-[#E5E5E5]"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Asset grid */}
          <div className="p-5 overflow-y-auto max-h-[400px]">
            {filteredAssets.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {filteredAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    onSelect={() => handleSelectAsset(asset)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <ImageIcon className="w-12 h-12 text-[#DDDBDA] mx-auto mb-3" />
                <p className="text-[13px] text-[var(--text-muted)]">No assets found</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded border border-[var(--border)] text-[13px] font-bold text-[var(--text-primary)] hover:bg-[var(--background)] transition-colors"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded border border-[var(--border)] text-[13px] font-bold text-[var(--text-primary)] hover:bg-[var(--background)] transition-colors"
              >
                <UploadIcon className="w-4 h-4" />
                Upload New
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Asset Card Component
interface AssetCardProps {
  asset: typeof mockAssets[0];
  onSelect: () => void;
}

function AssetCard({ asset, onSelect }: AssetCardProps) {
  return (
    <button
      onClick={onSelect}
      className="group relative aspect-[4/3] rounded-lg overflow-hidden border-2 border-[var(--border)] hover:border-[#0F8EFF] transition-all focus:outline-none focus:border-[#0F8EFF] focus:ring-2 focus:ring-[#0F8EFF]/20"
    >
      {/* Placeholder background - in real app this would be an actual image */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#E5E5E5] to-[#D0D0D0]">
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-[var(--text-muted)]" />
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-[#0F8EFF]/0 group-hover:bg-[#0F8EFF]/10 transition-colors" />

      {/* Name label */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/60 to-transparent">
        <span className="text-[11px] font-bold text-white truncate block">
          {asset.name}
        </span>
      </div>

      {/* Selection checkmark on hover */}
      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#0F8EFF] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <CheckIcon className="w-3.5 h-3.5" />
      </div>
    </button>
  );
}

// Icons
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
