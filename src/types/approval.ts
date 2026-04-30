export type ApprovalStatus = "pending" | "approved" | "changes_requested";

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatarColor: string;
}

export interface ApprovalMessage {
  id: string;
  author: User;
  content: string;
  createdAt: Date;
  type: "comment" | "approval" | "rejection";
}

export interface ApprovalRequest {
  id: string;
  contentBlockId: string;
  status: ApprovalStatus;
  requestedBy: User;
  requestedAt: Date;
  reviewedBy?: User;
  reviewedAt?: Date;
  thread: ApprovalMessage[];
}
