import { Role } from "./types";

export function canAssign(role: Role): boolean {
  return role === "agent" || role === "admin";
}

export function canChangeStatus(role: Role): boolean {
  return role === "agent" || role === "admin";
}

export function canManageTags(role: Role): boolean {
  return role === "agent" || role === "admin";
}

export function canWriteInternalComment(role: Role): boolean {
  return role === "agent" || role === "admin";
}

export function canCreateTag(role: Role): boolean {
  return role === "admin";
}

export function canDeleteTicket(role: Role): boolean {
  return role === "admin";
}
