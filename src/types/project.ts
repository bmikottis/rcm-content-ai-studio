export type ProjectStatus = "draft" | "in_progress" | "review" | "approved" | "published" | "archived";

export type Channel = "email" | "sms" | "whatsapp" | "social";

export interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  updatedAt: Date;
  createdAt: Date;
  status: ProjectStatus;
  thumbnail?: string;
  channels: Channel[];
  collaborators?: Collaborator[];
  languages?: string[];
  approvalCount?: number;
  commentCount?: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
  promptSeed: string;
  channels: Channel[];
  estimatedTime?: string;
}
