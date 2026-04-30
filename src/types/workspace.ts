export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export type AtomicBlockType = 
  | "image"
  | "headline"
  | "body"
  | "cta"
  | "section"
  | "disclaimer"
  | "token"
  | "divider"
  | "language";

export interface AtomicBlock {
  id: string;
  type: AtomicBlockType;
  content: string;
  position: Position;
  size?: Size;
  linkedTo?: string[];
  metadata?: Record<string, unknown>;
  /** For section blocks - IDs of child blocks contained within */
  children?: string[];
  /** Section-specific properties */
  alignment?: "left" | "center" | "right";
  padding?: number;
  backgroundColor?: string;
}

export type ChannelType = "email" | "sms" | "whatsapp" | "rcs" | "web";

export interface ChannelVariant {
  id: string;
  channel: ChannelType;
  /** Optional label in the layers tree (defaults to channel type name). */
  displayName?: string;
  position: Position;
  atomicBlocks: string[];
  status: "draft" | "ready" | "approved";
}

export interface ContentGroup {
  id: string;
  name: string;
  description?: string;
  position: Position;
  size: Size;
  channels: ChannelVariant[];
  color: string;
  collapsed?: boolean;
}

export interface LanguageVariant {
  id: string;
  language: string;
  locale: string;
  groupId: string;
  position: Position;
}

export interface Connection {
  id: string;
  sourceId: string;
  sourceType: "atomic" | "channel" | "group";
  targetId: string;
  targetType: "atomic" | "channel" | "group";
  connectionType: "cascade" | "sync" | "reference";
  label?: string;
}

export interface WorkspaceState {
  viewport: Viewport;
  groups: ContentGroup[];
  atomicBlocks: AtomicBlock[];
  connections: Connection[];
  selectedIds: string[];
  hoveredId: string | null;
  isDragging: boolean;
  isPanning: boolean;
}
