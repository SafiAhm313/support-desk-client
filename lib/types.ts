export type Role = "customer" | "agent" | "admin";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  createdAt: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Ticket {
  id: number;
  subject: string;
  body: string;
  status: TicketStatus;
  priority: TicketPriority;
  requester: User;
  assignee: User | null;
  dueAt: string;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
}

export interface TicketListResponse {
  data: Ticket[];
  page: number;
  pageSize: number;
  total: number;
}

export interface Comment {
  id: number;
  author: User;
  body: string;
  isInternal: boolean;
  createdAt: string;
}

// Confirmed real shape via direct API testing on Day 4.
export interface TicketEvent {
  id: number;
  actor: User;
  fromStatus: TicketStatus;
  toStatus: TicketStatus;
  note: string | null;
  createdAt: string;
}
