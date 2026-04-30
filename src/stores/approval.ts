import { create } from "zustand";
import { ApprovalRequest, ApprovalMessage, User } from "@/types/approval";
import { mockUsers, mockApprovalThread } from "@/data/mock-approvals";

interface ApprovalStore {
  approvals: Record<string, ApprovalRequest>;
  activeApprovalId: string | null;
  isModalOpen: boolean;
  isThreadOpen: boolean;
  currentUser: User;

  requestApproval: (blockId: string, note?: string) => void;
  addComment: (approvalId: string, content: string) => void;
  approve: (approvalId: string, comment?: string) => void;
  requestChanges: (approvalId: string, comment: string) => void;
  openRequestModal: (blockId: string) => void;
  closeRequestModal: () => void;
  openThread: (approvalId: string) => void;
  closeThread: () => void;
  getApprovalForBlock: (blockId: string) => ApprovalRequest | null;
}

export const useApprovalStore = create<ApprovalStore>((set, get) => ({
  approvals: {
    [mockApprovalThread.id]: mockApprovalThread,
  },
  activeApprovalId: null,
  isModalOpen: false,
  isThreadOpen: false,
  currentUser: mockUsers[0],

  requestApproval: (blockId, note) => {
    const { currentUser } = get();
    const newApproval: ApprovalRequest = {
      id: `approval-${Date.now()}`,
      contentBlockId: blockId,
      status: "pending",
      requestedBy: currentUser,
      requestedAt: new Date(),
      thread: note
        ? [
            {
              id: `msg-${Date.now()}`,
              author: currentUser,
              content: note,
              createdAt: new Date(),
              type: "comment",
            },
          ]
        : [],
    };

    set((state) => ({
      approvals: {
        ...state.approvals,
        [newApproval.id]: newApproval,
      },
      isModalOpen: false,
    }));
  },

  addComment: (approvalId, content) => {
    const { currentUser } = get();
    const newMessage: ApprovalMessage = {
      id: `msg-${Date.now()}`,
      author: currentUser,
      content,
      createdAt: new Date(),
      type: "comment",
    };

    set((state) => ({
      approvals: {
        ...state.approvals,
        [approvalId]: {
          ...state.approvals[approvalId],
          thread: [...state.approvals[approvalId].thread, newMessage],
        },
      },
    }));
  },

  approve: (approvalId, comment) => {
    const { currentUser, addComment } = get();
    
    if (comment) {
      addComment(approvalId, comment);
    }

    const approvalMessage: ApprovalMessage = {
      id: `msg-${Date.now()}-approval`,
      author: mockUsers[1], // Simulate reviewer
      content: "Approved!",
      createdAt: new Date(),
      type: "approval",
    };

    set((state) => ({
      approvals: {
        ...state.approvals,
        [approvalId]: {
          ...state.approvals[approvalId],
          status: "approved",
          reviewedBy: mockUsers[1],
          reviewedAt: new Date(),
          thread: [...state.approvals[approvalId].thread, approvalMessage],
        },
      },
    }));
  },

  requestChanges: (approvalId, comment) => {
    const rejectionMessage: ApprovalMessage = {
      id: `msg-${Date.now()}-rejection`,
      author: mockUsers[1],
      content: comment,
      createdAt: new Date(),
      type: "rejection",
    };

    set((state) => ({
      approvals: {
        ...state.approvals,
        [approvalId]: {
          ...state.approvals[approvalId],
          status: "changes_requested",
          reviewedBy: mockUsers[1],
          reviewedAt: new Date(),
          thread: [...state.approvals[approvalId].thread, rejectionMessage],
        },
      },
    }));
  },

  openRequestModal: (blockId) => set({ isModalOpen: true, activeApprovalId: blockId }),

  closeRequestModal: () => set({ isModalOpen: false }),

  openThread: (approvalId) => set({ isThreadOpen: true, activeApprovalId: approvalId }),

  closeThread: () => set({ isThreadOpen: false, activeApprovalId: null }),

  getApprovalForBlock: (blockId) => {
    const { approvals } = get();
    return Object.values(approvals).find((a) => a.contentBlockId === blockId) || null;
  },
}));
