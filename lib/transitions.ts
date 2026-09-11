import { TicketStatus } from "./types";

// The legal transition machine, as specified:
// open -> in_progress
// in_progress -> resolved
// resolved -> closed | in_progress
// closed -> in_progress (requires a note)
export const TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: ["in_progress"],
  in_progress: ["resolved"],
  resolved: ["closed", "in_progress"],
  closed: ["in_progress"],
};

// Reopening a closed ticket (closed -> in_progress) is the only transition
// that requires a non-empty note, per the API's validation.
export function transitionRequiresNote(from: TicketStatus, to: TicketStatus): boolean {
  return from === "closed" && to === "in_progress";
}

export function legalTransitions(from: TicketStatus): TicketStatus[] {
  return TRANSITIONS[from] ?? [];
}
