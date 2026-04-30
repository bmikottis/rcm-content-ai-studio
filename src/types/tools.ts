export type ToolType = 
  | "select"
  | "group-edit"
  | "image-edit"
  | "layout-edit"
  | "language"
  | "link";

export interface ToolAction {
  id: string;
  label: string;
  description?: string;
  icon: string;
  shortcut?: string;
  danger?: boolean;
}

export interface ToolConfig {
  id: ToolType;
  label: string;
  description: string;
  icon: string;
  shortcut: string;
  actions: ToolAction[];
}

export interface SelectionContext {
  type: "none" | "atomic" | "channel" | "group" | "multiple";
  ids: string[];
  linkedCount?: number;
  channels?: string[];
  hasImage?: boolean;
  hasText?: boolean;
  languages?: string[];
}

export interface ImageEditState {
  blockId: string;
  mode: "replace" | "crop" | "regenerate" | "propagate";
  cropRegion?: { x: number; y: number; width: number; height: number };
  focalPoint?: { x: number; y: number };
  prompt?: string;
}

export interface ToneChange {
  type: "more" | "less";
  attribute: "premium" | "casual" | "urgent" | "friendly" | "professional";
}

export interface GroupEditAction {
  groupId: string;
  action: "tone" | "personalization" | "regenerate";
  toneChange?: ToneChange;
  tokenAction?: { token: string; action: "add" | "remove" | "replace"; replaceWith?: string };
}
