import { create } from "zustand";
import { useSimpleCanvasStore } from "./simple-canvas";
import { toast } from "./toast";

interface PublishStore {
  isPublishing: boolean;
  publishLabel: string;
  publishCards: (cardIds: string[], label?: string) => void;
}

export const usePublishStore = create<PublishStore>((set) => ({
  isPublishing: false,
  publishLabel: "",
  publishCards: (cardIds, label) => {
    const { cards, updateCard } = useSimpleCanvasStore.getState();
    const count = cardIds.length;
    const defaultLabel =
      count === 1
        ? `"${cards.find((c) => c.id === cardIds[0])?.title ?? "Block"}" published successfully`
        : `${count} block${count > 1 ? "s" : ""} published successfully`;

    set({ isPublishing: true, publishLabel: label ?? defaultLabel });

    setTimeout(() => {
      for (const id of cardIds) updateCard(id, { status: "published" });
      set({ isPublishing: false, publishLabel: "" });
      toast.success(label ?? defaultLabel);
    }, 2000);
  },
}));
