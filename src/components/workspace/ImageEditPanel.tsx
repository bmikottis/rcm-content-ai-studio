"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSimpleCanvasStore } from "@/stores/simple-canvas";
import { cn } from "@/lib/cn";

export function ImageEditPanel() {
  const {
    selectedElement,
    getSelectedElementData,
    removeElement,
    setShowAssetPicker,
    clearElementSelection,
    viewport,
  } = useSimpleCanvasStore();

  const data = getSelectedElementData();
  const isImageSelected = data?.element.type === "image";

  // Compute screen position anchored to the selected image element
  const popupStyle = useMemo(() => {
    if (!data) return {};
    const c = data.card;
    const screenX = c.position.x * viewport.zoom + viewport.x + c.size.width * viewport.zoom + 8;
    const screenY = c.position.y * viewport.zoom + viewport.y;
    return { left: screenX, top: screenY };
  }, [data, viewport]);

  if (!isImageSelected || !selectedElement) return null;

  const { card, element } = data;

  const menuItems = [
    {
      icon: <UploadIcon className="w-4 h-4" />,
      label: "Upload File",
      onClick: () => { setShowAssetPicker(true); },
      highlight: true,
    },
    {
      icon: <GridIcon className="w-4 h-4" />,
      label: "Select from Library",
      onClick: () => { setShowAssetPicker(true); },
    },
    {
      icon: <SearchIcon className="w-4 h-4" />,
      label: "Browse Stock Images",
      onClick: () => { setShowAssetPicker(true); },
    },
    {
      icon: <TrashIcon className="w-4 h-4" />,
      label: "Remove Image",
      onClick: () => { removeElement(card.id, element.id); },
      danger: true,
      separator: true,
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="fixed z-50 w-56"
        style={popupStyle}
      >
        <div className="bg-white rounded-lg border border-[#DDD] shadow-[0_4px_16px_rgba(0,0,0,0.12)] overflow-hidden">
          {menuItems.map((item, i) => (
            <div key={i}>
              {item.separator && <div className="h-px bg-neutral-100" />}
              <button
                type="button"
                onClick={item.onClick}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                  item.highlight
                    ? "bg-neutral-50 hover:bg-neutral-100"
                    : "hover:bg-neutral-50",
                  item.danger
                    ? "text-red-600 hover:bg-red-50"
                    : "text-neutral-800",
                )}
              >
                <span className={cn("flex-shrink-0", item.danger ? "text-red-500" : "text-neutral-500")}>
                  {item.icon}
                </span>
                <span className="text-[13px] font-medium">{item.label}</span>
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Icons
function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
