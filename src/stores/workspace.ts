import { create } from "zustand";
import {
  Viewport,
  ContentGroup,
  AtomicBlock,
  Connection,
  Position,
  ChannelVariant,
} from "@/types/workspace";

export interface FocusedChannelRef {
  groupId: string;
  channelId: string;
}

interface AgentOverlayState {
  label: string;
  scopeIds: string[];
}

export interface DrillInChannel {
  groupId: string;
  channelId: string;
  savedViewport: Viewport;
}

/** Row the user clicked in the blocks/layers sidebar (same block id can appear in multiple channels). */
export interface LayersPanelAnchor {
  groupId: string;
  channelId: string;
  blockId: string;
}

export type GenerationPhase = "idle" | "groups" | "blocks" | "connections" | "done";

interface WorkspaceState {
  viewport: Viewport;
  groups: ContentGroup[];
  atomicBlocks: AtomicBlock[];
  connections: Connection[];
  selectedIds: string[];
  /** When set, user focused a specific channel inside a group (still selects the group). */
  focusedChannel: FocusedChannelRef | null;
  /** When set, user has drilled into a specific channel to edit its fragments. */
  drillInChannel: DrillInChannel | null;
  /** Lightweight agent activity on canvas (shimmer targets). */
  agentOverlay: AgentOverlayState | null;
  /** Brief highlight on linked nodes after sync. */
  syncPulseIds: string[];
  /** Primary row for linked block selection in the left layers panel (cleared on canvas/generic select). */
  layersPanelAnchor: LayersPanelAnchor | null;
  hoveredId: string | null;
  isDragging: boolean;
  isPanning: boolean;
  /** Tracks the staggered generation animation when arriving from campaign creation. */
  generationPhase: GenerationPhase;
  /** Set by the overlay before navigation; consumed by WorkspaceCanvas on mount. */
  _pendingAnimate: boolean;
  
  // Viewport actions
  setViewport: (viewport: Partial<Viewport>) => void;
  pan: (deltaX: number, deltaY: number) => void;
  zoom: (delta: number, centerX?: number, centerY?: number) => void;
  resetViewport: () => void;
  
  // Selection actions
  select: (ids: string[]) => void;
  /** Select one atomic block and record which layers-panel row was clicked (for linked-instance styling). */
  selectAtomicFromLayersPanel: (groupId: string, channelId: string, blockId: string) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  setFocusedChannel: (ref: FocusedChannelRef | null) => void;
  enterChannel: (groupId: string, channelId: string) => void;
  exitChannel: () => void;
  setAgentOverlay: (overlay: AgentOverlayState | null) => void;
  pulseSyncTargets: (ids: string[]) => void;
  
  // Hover actions
  setHovered: (id: string | null) => void;
  
  // Drag actions
  setDragging: (isDragging: boolean) => void;
  setPanning: (isPanning: boolean) => void;
  
  // Group actions
  moveGroup: (groupId: string, position: Position) => void;
  toggleGroupCollapse: (groupId: string) => void;
  updateGroup: (groupId: string, updates: Partial<Pick<ContentGroup, "name" | "description" | "color">>) => void;
  
  // Content actions
  moveAtomicBlock: (blockId: string, position: Position) => void;
  updateAtomicBlock: (blockId: string, updates: Partial<AtomicBlock>) => void;
  removeAtomicBlock: (blockId: string) => void;
  addAtomicBlockToChannel: (groupId: string, channelId: string, type: AtomicBlock["type"], content: string) => string;
  insertAtomicBlockAtIndex: (groupId: string, channelId: string, type: AtomicBlock["type"], content: string, atIndex: number) => string;
  reorderChannelBlocks: (groupId: string, channelId: string, fromIndex: number, toIndex: number) => void;
  updateChannel: (
    groupId: string,
    channelId: string,
    updates: Partial<Pick<ChannelVariant, "displayName" | "status" | "position">>,
  ) => void;
  removeChannel: (groupId: string, channelId: string) => void;
  removeGroup: (groupId: string) => void;
  /** Clone a fragment into the same channel immediately after the original. */
  duplicateAtomicBlockInChannel: (groupId: string, channelId: string, blockId: string) => string | null;
  /**
   * Clone channel with fresh ids. Each fragment in the channel is cloned with a new id
   * and linked only to the new channel (does not mutate other channels' atom refs).
   */
  duplicateChannel: (groupId: string, channelId: string) => string | null;
  /** Clone group, channels, and all fragments used by those channels (new ids throughout). */
  duplicateGroup: (groupId: string) => string | null;

  // Viewport helpers
  fitToContent: (padding?: number) => void;
  focusViewportOnWorldRect: (minX: number, minY: number, maxX: number, maxY: number, padding?: number) => void;
  focusViewportOnGroup: (groupId: string, padding?: number) => void;
  focusViewportOnBlock: (blockId: string, padding?: number) => void;

  // Data loading
  loadWorkspaceData: (opts?: { animate?: boolean }) => void;
}

const initialViewport: Viewport = {
  x: 0,
  y: 0,
  zoom: 1,
};

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;

/** Track all animation timer IDs so they can be cancelled on re-entry. */
let _animationTimers: ReturnType<typeof setTimeout>[] = [];
function _clearAnimationTimers() {
  for (const id of _animationTimers) clearTimeout(id);
  _animationTimers = [];
}
function _scheduleTimer(fn: () => void, delay: number) {
  _animationTimers.push(setTimeout(fn, delay));
}

function cloneAtomicForChannel(b: AtomicBlock, newId: string, channelId: string): AtomicBlock {
  return {
    ...b,
    id: newId,
    linkedTo: [channelId],
    children: b.children ? [...b.children] : undefined,
    metadata: b.metadata ? { ...b.metadata } : undefined,
  };
}

function newUniqueId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Default canvas dimensions for an atomic block (matches AtomicBlockNode). */
export function getAtomicBlockBounds(b: AtomicBlock): { minX: number; minY: number; maxX: number; maxY: number } {
  const width = b.size?.width || (b.type === "image" ? 180 : 160);
  const height = b.size?.height || (b.type === "image" ? 100 : 60);
  return {
    minX: b.position.x,
    minY: b.position.y,
    maxX: b.position.x + width,
    maxY: b.position.y + height,
  };
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  viewport: initialViewport,
  groups: [],
  atomicBlocks: [],
  connections: [],
  selectedIds: [],
  focusedChannel: null,
  drillInChannel: null,
  agentOverlay: null,
  syncPulseIds: [],
  layersPanelAnchor: null,
  hoveredId: null,
  isDragging: false,
  isPanning: false,
  generationPhase: "idle",
  _pendingAnimate: false,

  setViewport: (viewport) => {
    set((state) => ({
      viewport: { ...state.viewport, ...viewport },
    }));
  },

  pan: (deltaX, deltaY) => {
    set((state) => ({
      viewport: {
        ...state.viewport,
        x: state.viewport.x + deltaX,
        y: state.viewport.y + deltaY,
      },
    }));
  },

  zoom: (delta, centerX = window.innerWidth / 2, centerY = window.innerHeight / 2) => {
    set((state) => {
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, state.viewport.zoom + delta));
      const zoomRatio = newZoom / state.viewport.zoom;
      
      // Zoom towards cursor position
      const newX = centerX - (centerX - state.viewport.x) * zoomRatio;
      const newY = centerY - (centerY - state.viewport.y) * zoomRatio;
      
      return {
        viewport: {
          x: newX,
          y: newY,
          zoom: newZoom,
        },
      };
    });
  },

  resetViewport: () => {
    set({ viewport: initialViewport });
  },

  select: (ids) => {
    set({ selectedIds: ids, focusedChannel: null, layersPanelAnchor: null });
  },

  selectAtomicFromLayersPanel: (groupId, channelId, blockId) => {
    set({
      selectedIds: [blockId],
      focusedChannel: null,
      layersPanelAnchor: { groupId, channelId, blockId },
    });
  },

  addToSelection: (id) => {
    set((state) => ({
      focusedChannel: null,
      layersPanelAnchor: null,
      selectedIds: state.selectedIds.includes(id) 
        ? state.selectedIds 
        : [...state.selectedIds, id],
    }));
  },

  removeFromSelection: (id) => {
    set((state) => ({
      layersPanelAnchor: null,
      selectedIds: state.selectedIds.filter((i) => i !== id),
    }));
  },

  clearSelection: () => {
    set({ selectedIds: [], focusedChannel: null, layersPanelAnchor: null });
  },

  setFocusedChannel: (ref) => {
    if (!ref) {
      set({ focusedChannel: null, layersPanelAnchor: null });
      return;
    }
    set({ focusedChannel: ref, selectedIds: [ref.groupId], layersPanelAnchor: null });
  },

  enterChannel: (groupId, channelId) => {
    const { viewport, groups } = get();

    const group = groups.find((g) => g.id === groupId);
    const channel = group?.channels.find((ch) => ch.id === channelId);
    if (!group || !channel) return;

    set({
      drillInChannel: { groupId, channelId, savedViewport: { ...viewport } },
      focusedChannel: { groupId, channelId },
      selectedIds: [groupId],
      layersPanelAnchor: null,
    });
  },

  exitChannel: () => {
    const { drillInChannel } = get();
    if (!drillInChannel) return;
    set({
      drillInChannel: null,
      focusedChannel: null,
      layersPanelAnchor: null,
      viewport: { ...drillInChannel.savedViewport },
    });
  },

  setAgentOverlay: (overlay) => {
    set({ agentOverlay: overlay });
  },

  pulseSyncTargets: (ids) => {
    set({ syncPulseIds: ids });
    window.setTimeout(() => {
      set({ syncPulseIds: [] });
    }, 2200);
  },

  selectAll: () => {
    const { groups, atomicBlocks } = get();
    const allIds = [
      ...groups.map((g) => g.id),
      ...atomicBlocks.map((b) => b.id),
    ];
    set({ selectedIds: allIds, focusedChannel: null, layersPanelAnchor: null });
  },

  setHovered: (id) => {
    set({ hoveredId: id });
  },

  setDragging: (isDragging) => {
    set({ isDragging });
  },

  setPanning: (isPanning) => {
    set({ isPanning });
  },

  moveGroup: (groupId, position) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, position } : g
      ),
    }));
  },

  toggleGroupCollapse: (groupId) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, collapsed: !g.collapsed } : g
      ),
    }));
  },

  updateGroup: (groupId, updates) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, ...updates } : g
      ),
    }));
  },

  moveAtomicBlock: (blockId, position) => {
    set((state) => ({
      atomicBlocks: state.atomicBlocks.map((b) =>
        b.id === blockId ? { ...b, position } : b
      ),
    }));
  },

  updateAtomicBlock: (blockId, updates) => {
    set((state) => ({
      atomicBlocks: state.atomicBlocks.map((b) =>
        b.id === blockId ? { ...b, ...updates } : b
      ),
    }));
  },

  removeAtomicBlock: (blockId) => {
    set((state) => {
      const atomicBlocks = state.atomicBlocks.filter((b) => b.id !== blockId);
      const connections = state.connections.filter(
        (c) => c.sourceId !== blockId && c.targetId !== blockId,
      );
      const groups = state.groups.map((g) => ({
        ...g,
        channels: g.channels.map((ch) => ({
          ...ch,
          atomicBlocks: ch.atomicBlocks.filter((id) => id !== blockId),
        })),
      }));
      const selectedIds = state.selectedIds.filter((id) => id !== blockId);
      return {
        atomicBlocks,
        connections,
        groups,
        selectedIds,
        layersPanelAnchor:
          state.layersPanelAnchor?.blockId === blockId ? null : state.layersPanelAnchor,
      };
    });
  },

  addAtomicBlockToChannel: (groupId, channelId, type, content) => {
    const { atomicBlocks } = get();

    const lastBlock = atomicBlocks[atomicBlocks.length - 1];
    const baseY = lastBlock ? lastBlock.position.y + (lastBlock.size?.height ?? 60) + 20 : 100;
    const baseX = lastBlock ? lastBlock.position.x : 1200;

    const id = `atom-${type}-${Date.now()}`;
    const isImage = type === "image";
    const newBlock: AtomicBlock = {
      id,
      type,
      content,
      position: { x: baseX, y: baseY },
      size: isImage ? { width: 200, height: 120 } : undefined,
      linkedTo: [channelId],
    };

    set((state) => ({
      atomicBlocks: [...state.atomicBlocks, newBlock],
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              channels: g.channels.map((ch) =>
                ch.id === channelId
                  ? { ...ch, atomicBlocks: [...ch.atomicBlocks, id] }
                  : ch
              ),
            }
          : g
      ),
      selectedIds: [id],
      layersPanelAnchor: null,
    }));

    return id;
  },

  insertAtomicBlockAtIndex: (groupId, channelId, type, content, atIndex) => {
    const { atomicBlocks } = get();

    const lastBlock = atomicBlocks[atomicBlocks.length - 1];
    const baseY = lastBlock ? lastBlock.position.y + (lastBlock.size?.height ?? 60) + 20 : 100;
    const baseX = lastBlock ? lastBlock.position.x : 1200;

    const id = `atom-${type}-${Date.now()}`;
    const isImage = type === "image";
    const newBlock: AtomicBlock = {
      id,
      type,
      content,
      position: { x: baseX, y: baseY },
      size: isImage ? { width: 200, height: 120 } : undefined,
      linkedTo: [channelId],
    };

    set((state) => ({
      atomicBlocks: [...state.atomicBlocks, newBlock],
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              channels: g.channels.map((ch) => {
                if (ch.id !== channelId) return ch;
                const ids = [...ch.atomicBlocks];
                ids.splice(atIndex, 0, id);
                return { ...ch, atomicBlocks: ids };
              }),
            }
          : g
      ),
      selectedIds: [id],
      layersPanelAnchor: null,
    }));

    return id;
  },

  reorderChannelBlocks: (groupId, channelId, fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              channels: g.channels.map((ch) => {
                if (ch.id !== channelId) return ch;
                const ids = [...ch.atomicBlocks];
                const [moved] = ids.splice(fromIndex, 1);
                ids.splice(toIndex, 0, moved);
                return { ...ch, atomicBlocks: ids };
              }),
            }
          : g
      ),
    }));
  },

  updateChannel: (groupId, channelId, updates) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              channels: g.channels.map((ch) =>
                ch.id === channelId ? { ...ch, ...updates } : ch,
              ),
            }
          : g,
      ),
    }));
  },

  removeChannel: (groupId, channelId) => {
    set((state) => {
      const group = state.groups.find((g) => g.id === groupId);
      if (!group) return state;
      const channel = group.channels.find((c) => c.id === channelId);
      if (!channel) return state;

      const toRemoveAtoms = new Set<string>();
      const atomicBlocks = state.atomicBlocks
        .map((b) => {
          if (!channel.atomicBlocks.includes(b.id)) return b;
          const lt = (b.linkedTo || []).filter((id) => id !== channelId);
          if (lt.length === 0) {
            toRemoveAtoms.add(b.id);
            return b;
          }
          return { ...b, linkedTo: lt };
        })
        .filter((b) => !toRemoveAtoms.has(b.id));

      const groups = state.groups.map((g) =>
        g.id === groupId
          ? { ...g, channels: g.channels.filter((ch) => ch.id !== channelId) }
          : g,
      );

      const connections = state.connections.filter((c) => {
        if (c.targetType === "channel" && c.targetId === channelId) return false;
        if (c.sourceType === "channel" && c.sourceId === channelId) return false;
        if (toRemoveAtoms.has(c.sourceId) || toRemoveAtoms.has(c.targetId)) return false;
        return true;
      });

      let viewport = state.viewport;
      let drillInChannel = state.drillInChannel;
      let focusedChannel = state.focusedChannel;
      if (drillInChannel?.groupId === groupId && drillInChannel.channelId === channelId) {
        viewport = { ...drillInChannel.savedViewport };
        drillInChannel = null;
        focusedChannel = null;
      } else if (focusedChannel?.groupId === groupId && focusedChannel.channelId === channelId) {
        focusedChannel = null;
      }

      const selectedIds = state.selectedIds.filter(
        (id) => id !== channelId && !toRemoveAtoms.has(id),
      );

      return {
        atomicBlocks,
        groups,
        connections,
        selectedIds,
        viewport,
        drillInChannel,
        focusedChannel,
        layersPanelAnchor: null,
      };
    });
  },

  removeGroup: (groupId) => {
    set((state) => {
      const group = state.groups.find((g) => g.id === groupId);
      if (!group) return state;

      const channelIds = new Set(group.channels.map((c) => c.id));
      const blockIdsInGroup = new Set<string>();
      for (const ch of group.channels) {
        for (const id of ch.atomicBlocks) blockIdsInGroup.add(id);
      }

      const toRemoveAtoms = new Set<string>();
      const atomicBlocks = state.atomicBlocks
        .map((b) => {
          if (!blockIdsInGroup.has(b.id)) return b;
          const lt = (b.linkedTo || []).filter((cid) => !channelIds.has(cid));
          if (lt.length === 0) {
            toRemoveAtoms.add(b.id);
            return b;
          }
          return { ...b, linkedTo: lt };
        })
        .filter((b) => !toRemoveAtoms.has(b.id));

      const groups = state.groups.filter((g) => g.id !== groupId);

      const connections = state.connections.filter((c) => {
        if (c.targetType === "channel" && channelIds.has(c.targetId)) return false;
        if (c.sourceType === "channel" && channelIds.has(c.sourceId)) return false;
        if (toRemoveAtoms.has(c.sourceId) || toRemoveAtoms.has(c.targetId)) return false;
        return true;
      });

      let viewport = state.viewport;
      let drillInChannel = state.drillInChannel;
      let focusedChannel = state.focusedChannel;
      if (drillInChannel?.groupId === groupId) {
        viewport = { ...drillInChannel.savedViewport };
        drillInChannel = null;
        focusedChannel = null;
      }

      const selectedIds = state.selectedIds.filter(
        (id) => id !== groupId && !channelIds.has(id) && !toRemoveAtoms.has(id),
      );

      return {
        atomicBlocks,
        groups,
        connections,
        selectedIds,
        viewport,
        drillInChannel,
        focusedChannel,
        layersPanelAnchor: null,
      };
    });
  },

  duplicateAtomicBlockInChannel: (groupId, channelId, blockId) => {
    const state = get();
    const group = state.groups.find((g) => g.id === groupId);
    const channel = group?.channels.find((c) => c.id === channelId);
    const orig = state.atomicBlocks.find((b) => b.id === blockId);
    if (!group || !channel || !orig || !channel.atomicBlocks.includes(blockId)) return null;

    const newId = newUniqueId(`atom-${orig.type}`);
    const clone = cloneAtomicForChannel(orig, newId, channelId);
    const idx = channel.atomicBlocks.indexOf(blockId);
    const newOrder = [...channel.atomicBlocks];
    newOrder.splice(idx + 1, 0, newId);

    set((s) => ({
      atomicBlocks: [...s.atomicBlocks, clone],
      groups: s.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              channels: g.channels.map((ch) =>
                ch.id === channelId ? { ...ch, atomicBlocks: newOrder } : ch,
              ),
            }
          : g,
      ),
      selectedIds: [newId],
      layersPanelAnchor: null,
    }));
    return newId;
  },

  duplicateChannel: (groupId, channelId) => {
    const state = get();
    const group = state.groups.find((g) => g.id === groupId);
    const channel = group?.channels.find((c) => c.id === channelId);
    if (!group || !channel) return null;

    const newChannelId = newUniqueId("ch");
    const newAtoms: AtomicBlock[] = [];
    const newBlockIds: string[] = [];

    for (const bid of channel.atomicBlocks) {
      const b = state.atomicBlocks.find((x) => x.id === bid);
      if (!b) continue;
      const newId = newUniqueId(`atom-${b.type}`);
      newAtoms.push(cloneAtomicForChannel(b, newId, newChannelId));
      newBlockIds.push(newId);
    }

    const newChannel: ChannelVariant = {
      ...channel,
      id: newChannelId,
      atomicBlocks: newBlockIds,
      displayName: channel.displayName
        ? `${channel.displayName} copy`
        : undefined,
      position: {
        x: channel.position.x + 24,
        y: channel.position.y + 24,
      },
    };

    set((s) => ({
      atomicBlocks: [...s.atomicBlocks, ...newAtoms],
      groups: s.groups.map((g) =>
        g.id === groupId ? { ...g, channels: [...g.channels, newChannel] } : g,
      ),
    }));
    return newChannelId;
  },

  duplicateGroup: (groupId) => {
    const state = get();
    const group = state.groups.find((g) => g.id === groupId);
    if (!group) return null;

    const newGroupId = newUniqueId("group");
    const newChannels: ChannelVariant[] = [];
    const newAtoms: AtomicBlock[] = [];

    for (const ch of group.channels) {
      const newChId = newUniqueId("ch");
      const blockIds: string[] = [];
      for (const bid of ch.atomicBlocks) {
        const b = state.atomicBlocks.find((x) => x.id === bid);
        if (!b) continue;
        const newBid = newUniqueId(`atom-${b.type}`);
        newAtoms.push(cloneAtomicForChannel(b, newBid, newChId));
        blockIds.push(newBid);
      }
      newChannels.push({
        ...ch,
        id: newChId,
        atomicBlocks: blockIds,
        displayName: ch.displayName,
        position: { ...ch.position },
      });
    }

    const newGroup: ContentGroup = {
      ...group,
      id: newGroupId,
      name: `${group.name} copy`,
      position: { x: group.position.x + 48, y: group.position.y + 48 },
      channels: newChannels,
    };

    set((s) => ({
      atomicBlocks: [...s.atomicBlocks, ...newAtoms],
      groups: [...s.groups, newGroup],
      selectedIds: [newGroupId],
      layersPanelAnchor: null,
    }));
    return newGroupId;
  },

  focusViewportOnWorldRect: (minX, minY, maxX, maxY, padding = 64) => {
    if (typeof window === "undefined") return;
    const contentW = Math.max(maxX - minX, 1);
    const contentH = Math.max(maxY - minY, 1);
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    let zoom = Math.min(
      (screenW - padding * 2) / contentW,
      (screenH - padding * 2) / contentH,
      1,
    );
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    const scaledW = contentW * zoom;
    const scaledH = contentH * zoom;
    const x = (screenW - scaledW) / 2 - minX * zoom;
    const y = (screenH - scaledH) / 2 - minY * zoom;
    set({ viewport: { x, y, zoom } });
  },

  focusViewportOnGroup: (groupId, padding = 64) => {
    const { groups } = get();
    const g = groups.find((x) => x.id === groupId);
    if (!g) return;
    const minX = g.position.x;
    const minY = g.position.y;
    const maxX = g.position.x + (g.size?.width ?? 400);
    const maxY = g.position.y + (g.size?.height ?? 300);
    get().focusViewportOnWorldRect(minX, minY, maxX, maxY, padding);
  },

  focusViewportOnBlock: (blockId, padding = 64) => {
    const { atomicBlocks } = get();
    const b = atomicBlocks.find((x) => x.id === blockId);
    if (!b) return;
    const { minX, minY, maxX, maxY } = getAtomicBlockBounds(b);
    get().focusViewportOnWorldRect(minX, minY, maxX, maxY, padding);
  },

  fitToContent: (padding = 80) => {
    const { groups, atomicBlocks } = get();
    if (groups.length === 0 && atomicBlocks.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const g of groups) {
      minX = Math.min(minX, g.position.x);
      minY = Math.min(minY, g.position.y);
      maxX = Math.max(maxX, g.position.x + (g.size?.width ?? 400));
      maxY = Math.max(maxY, g.position.y + (g.size?.height ?? 300));
    }
    for (const b of atomicBlocks) {
      minX = Math.min(minX, b.position.x);
      minY = Math.min(minY, b.position.y);
      maxX = Math.max(maxX, b.position.x + (b.size?.width ?? 180));
      maxY = Math.max(maxY, b.position.y + (b.size?.height ?? 60));
    }

    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const zoom = Math.min(
      (screenW - padding * 2) / contentW,
      (screenH - padding * 2) / contentH,
      1, // don't zoom in past 100%
    );
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));

    const scaledW = contentW * clampedZoom;
    const scaledH = contentH * clampedZoom;
    const x = (screenW - scaledW) / 2 - minX * clampedZoom;
    const y = (screenH - scaledH) / 2 - minY * clampedZoom;

    set({ viewport: { x, y, zoom: clampedZoom } });
  },

  loadWorkspaceData: (opts) => {
    _clearAnimationTimers();
    const shouldAnimate = opts?.animate ?? get()._pendingAnimate;
    
    // If progressive generation is active, don't load mock data
    // The progressive generation store will populate the workspace directly
    const currentGroups = get().groups;
    const currentPhase = get().generationPhase;
    if (currentPhase !== "idle" && currentPhase !== "done" && currentGroups.length > 0) {
      // Progressive generation is in progress, skip mock data load
      return;
    }
    
    const groups: ContentGroup[] = [
      {
        id: "group-launch",
        name: "Launch Sequence",
        description: "Multi-channel launch sequence",
        position: { x: 60, y: 60 },
        size: { width: 800, height: 500 },
        color: "#3B82F6",
        channels: [
          { id: "ch-email", channel: "email", position: { x: 20, y: 60 }, atomicBlocks: ["atom-hero", "atom-headline-1", "atom-body-1", "atom-cta-1"], status: "ready" },
          { id: "ch-sms", channel: "sms", position: { x: 220, y: 60 }, atomicBlocks: ["atom-headline-2", "atom-cta-2"], status: "ready" },
          { id: "ch-whatsapp", channel: "whatsapp", position: { x: 420, y: 60 }, atomicBlocks: ["atom-hero", "atom-headline-3", "atom-cta-3"], status: "draft" },
          { id: "ch-web", channel: "web", position: { x: 620, y: 60 }, atomicBlocks: ["atom-hero", "atom-headline-1", "atom-body-2", "atom-cta-1"], status: "draft" },
        ],
      },
      {
        id: "group-followup",
        name: "Follow-up Sequence",
        description: "Engagement nurture flow",
        position: { x: 60, y: 600 },
        size: { width: 600, height: 400 },
        color: "#8B5CF6",
        channels: [
          { id: "ch-email-2", channel: "email", position: { x: 20, y: 60 }, atomicBlocks: ["atom-headline-4", "atom-body-3"], status: "draft" },
          { id: "ch-sms-2", channel: "sms", position: { x: 220, y: 60 }, atomicBlocks: ["atom-headline-5"], status: "draft" },
          { id: "ch-rcs", channel: "rcs", position: { x: 420, y: 60 }, atomicBlocks: ["atom-hero-2", "atom-cta-4"], status: "draft" },
        ],
      },
    ];

    const atomicBlocks: AtomicBlock[] = [
      { id: "atom-hero", type: "image", content: "Hero Banner", position: { x: 960, y: 80 }, linkedTo: ["ch-email", "ch-whatsapp", "ch-web"], size: { width: 200, height: 120 } },
      { id: "atom-hero-2", type: "image", content: "Product Shot", position: { x: 960, y: 220 }, linkedTo: ["ch-rcs"], size: { width: 200, height: 120 } },
      { id: "atom-headline-1", type: "headline", content: "Introducing the Future", position: { x: 1190, y: 80 }, linkedTo: ["ch-email", "ch-web"] },
      { id: "atom-headline-2", type: "headline", content: "Don't miss out", position: { x: 1190, y: 150 }, linkedTo: ["ch-sms"] },
      { id: "atom-headline-3", type: "headline", content: "It's here", position: { x: 1190, y: 220 }, linkedTo: ["ch-whatsapp"] },
      { id: "atom-headline-4", type: "headline", content: "Still thinking?", position: { x: 1190, y: 290 }, linkedTo: ["ch-email-2"] },
      { id: "atom-headline-5", type: "headline", content: "Last chance", position: { x: 1190, y: 360 }, linkedTo: ["ch-sms-2"] },
      { id: "atom-body-1", type: "body", content: "Experience premium innovation...", position: { x: 1400, y: 80 }, linkedTo: ["ch-email"] },
      { id: "atom-body-2", type: "body", content: "Discover what's possible...", position: { x: 1400, y: 170 }, linkedTo: ["ch-web"] },
      { id: "atom-body-3", type: "body", content: "We noticed you were interested...", position: { x: 1400, y: 260 }, linkedTo: ["ch-email-2"] },
      { id: "atom-cta-1", type: "cta", content: "Shop Now", position: { x: 1630, y: 80 }, linkedTo: ["ch-email", "ch-web"] },
      { id: "atom-cta-2", type: "cta", content: "Get 20% off", position: { x: 1630, y: 150 }, linkedTo: ["ch-sms"] },
      { id: "atom-cta-3", type: "cta", content: "View Collection", position: { x: 1630, y: 220 }, linkedTo: ["ch-whatsapp"] },
      { id: "atom-cta-4", type: "cta", content: "Learn More", position: { x: 1630, y: 290 }, linkedTo: ["ch-rcs"] },
      { id: "atom-token-name", type: "token", content: "{{first_name}}", position: { x: 1840, y: 80 }, linkedTo: ["ch-email", "ch-email-2"] },
      { id: "atom-token-company", type: "token", content: "{{company}}", position: { x: 1840, y: 150 }, linkedTo: ["ch-email"] },
      { id: "atom-lang-en", type: "language", content: "English (US)", position: { x: 1840, y: 250 }, linkedTo: ["group-launch", "group-followup"] },
      { id: "atom-disclaimer", type: "disclaimer", content: "Terms apply. Offer valid until...", position: { x: 1840, y: 350 }, linkedTo: ["ch-email", "ch-web"] },
    ];

    const connections: Connection[] = [
      { id: "conn-1", sourceId: "atom-hero", sourceType: "atomic", targetId: "ch-email", targetType: "channel", connectionType: "cascade", label: "Hero image" },
      { id: "conn-2", sourceId: "atom-hero", sourceType: "atomic", targetId: "ch-whatsapp", targetType: "channel", connectionType: "cascade" },
      { id: "conn-3", sourceId: "atom-hero", sourceType: "atomic", targetId: "ch-web", targetType: "channel", connectionType: "cascade" },
      { id: "conn-4", sourceId: "atom-cta-1", sourceType: "atomic", targetId: "ch-email", targetType: "channel", connectionType: "sync", label: "Primary CTA" },
      { id: "conn-5", sourceId: "atom-cta-1", sourceType: "atomic", targetId: "ch-web", targetType: "channel", connectionType: "sync" },
    ];

    if (!shouldAnimate) {
      set({ groups, atomicBlocks, connections, generationPhase: "done" });
      return;
    }

    // --- Staggered generation animation ---
    // Start with a completely empty canvas
    set({ groups: [], atomicBlocks: [], connections: [], generationPhase: "groups" });

    let t = 0;
    const GROUP_GAP = 1500;
    const BLOCK_GAP = 700;

    // Phase 1: Groups appear one at a time (with empty channels → spinners)
    groups.forEach((g, gIdx) => {
      const emptyGroup = {
        ...g,
        channels: g.channels.map((ch) => ({ ...ch, atomicBlocks: [] as string[] })),
      };
      const delay = gIdx * GROUP_GAP;
      _scheduleTimer(() => {
        set((state) => ({ groups: [...state.groups, emptyGroup] }));
      }, delay);
      t = delay;
    });

    // Phase 2: Blocks appear one at a time, ordered by type priority
    const blockOrder: AtomicBlock["type"][] = [
      "image", "headline", "body", "cta",
      "section", "divider", "token", "language", "disclaimer",
    ];
    const orderedBlocks = [...atomicBlocks].sort(
      (a, b) => blockOrder.indexOf(a.type) - blockOrder.indexOf(b.type),
    );

    const blocksStartTime = t + GROUP_GAP + 600;
    _scheduleTimer(() => {
      set({ generationPhase: "blocks" });
    }, blocksStartTime);

    orderedBlocks.forEach((block, bIdx) => {
      const delay = blocksStartTime + bIdx * BLOCK_GAP;
      _scheduleTimer(() => {
        set((state) => {
          const newAtomicBlocks = [...state.atomicBlocks, block];
          const updatedGroups = state.groups.map((g) => {
            const fullGroup = groups.find((fg) => fg.id === g.id);
            if (!fullGroup) return g;
            return {
              ...g,
              channels: g.channels.map((ch) => {
                const fullCh = fullGroup.channels.find((fc) => fc.id === ch.id);
                if (!fullCh || !fullCh.atomicBlocks.includes(block.id)) return ch;
                if (ch.atomicBlocks.includes(block.id)) return ch;
                return { ...ch, atomicBlocks: [...ch.atomicBlocks, block.id] };
              }),
            };
          });
          return { atomicBlocks: newAtomicBlocks, groups: updatedGroups };
        });
      }, delay);
      t = delay;
    });

    // Phase 3: Connections draw in
    const connectionsTime = t + BLOCK_GAP + 1000;
    _scheduleTimer(() => {
      set({ connections, generationPhase: "connections" });
    }, connectionsTime);

    // Phase 4: Done — also clear the pending flag
    _scheduleTimer(() => {
      set({ generationPhase: "done", _pendingAnimate: false });
    }, connectionsTime + 1800);
  },
}));
