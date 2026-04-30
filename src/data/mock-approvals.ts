import { User, ApprovalRequest } from "@/types/approval";
import { generateAvatarColor } from "@/lib/avatar-color";

export const mockUsers: User[] = [
  {
    id: "user-1",
    name: "You",
    email: "you@company.com",
    initials: "YO",
    avatarColor: "#171717",
  },
  {
    id: "user-2",
    name: "Sarah Chen",
    email: "sarah.chen@company.com",
    initials: "SC",
    avatarColor: generateAvatarColor("Sarah Chen"),
  },
  {
    id: "user-3",
    name: "Marcus Johnson",
    email: "marcus.j@company.com",
    initials: "MJ",
    avatarColor: generateAvatarColor("Marcus Johnson"),
  },
];

export const mockApprovalThread: ApprovalRequest = {
  id: "approval-1",
  contentBlockId: "email-1",
  status: "pending",
  requestedBy: mockUsers[0],
  requestedAt: new Date(Date.now() - 30 * 60 * 1000),
  thread: [
    {
      id: "msg-1",
      author: mockUsers[0],
      content: "Ready for final review. Please check the CTA copy.",
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      type: "comment",
    },
    {
      id: "msg-2",
      author: mockUsers[1],
      content:
        'CTA looks good! Can we make the subject line shorter? "Adventure awaits, Sarah" maybe?',
      createdAt: new Date(Date.now() - 27 * 60 * 1000),
      type: "comment",
    },
    {
      id: "msg-3",
      author: mockUsers[0],
      content: "Updated! How's this?",
      createdAt: new Date(Date.now() - 25 * 60 * 1000),
      type: "comment",
    },
  ],
};

export function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
