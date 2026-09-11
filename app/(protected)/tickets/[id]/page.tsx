"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Ticket, Comment, TicketEvent, Tag, TicketStatus } from "@/lib/types";
import { legalTransitions, transitionRequiresNote } from "@/lib/transitions";
import {
  canAssign,
  canChangeStatus,
  canManageTags,
  canWriteInternalComment,
  canDeleteTicket,
} from "@/lib/permissions";

const priorityColor: Record<string, string> = {
  low: "text-gray-400",
  normal: "text-blue-400",
  high: "text-orange-400",
  urgent: "text-red-400",
};

const statusColor: Record<string, string> = {
  open: "text-blue-400",
  in_progress: "text-yellow-400",
  resolved: "text-green-400",
  closed: "text-gray-500",
};

// The Week 10 API has no endpoint to list agents/users, so assignee
// options are hardcoded from known seed data. Documented in the README
// as a known limitation - a real system would need a GET /users (or
// similar) endpoint to populate this dynamically.
const KNOWN_ASSIGNEES = [
  { id: 1, label: "Ada Admin (admin)" },
  { id: 2, label: "Alex Agent (agent)" },
  { id: 3, label: "Amy Agent (agent)" },
];

function describeEvent(event: TicketEvent): string {
  const actorName = event.actor?.fullName ?? "Someone";
  if (event.fromStatus === event.toStatus) {
    // assignment or tag events currently reuse the status event shape
    // with fromStatus === toStatus, per what the API actually returns
    return event.note ? `${actorName}: ${event.note}` : `${actorName} updated the ticket`;
  }
  return `${actorName} moved status from ${event.fromStatus} to ${event.toStatus}${
    event.note ? ` — "${event.note}"` : ""
  }`;
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [newComment, setNewComment] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [commentError, setCommentError] = useState("");

  const [assigneeSelect, setAssigneeSelect] = useState("");
  const [assignError, setAssignError] = useState("");
  const [assigning, setAssigning] = useState(false);

  const [statusSelect, setStatusSelect] = useState("");
  const [reopenNote, setReopenNote] = useState("");
  const [statusError, setStatusError] = useState("");
  const [changingStatus, setChangingStatus] = useState(false);

  const [tagSelect, setTagSelect] = useState("");
  const [tagError, setTagError] = useState("");

  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadTicket = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const [ticketRes, commentsRes, eventsRes] = await Promise.all([
        apiFetch<Ticket>(`/tickets/${id}`),
        apiFetch<Comment[]>(`/tickets/${id}/comments`),
        apiFetch<TicketEvent[]>(`/tickets/${id}/events`),
      ]);
      setTicket(ticketRes);
      setComments(commentsRes);
      setEvents(eventsRes);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) setNotFound(true);
        else setError(err.message);
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadTags = useCallback(async () => {
    try {
      const tags = await apiFetch<Tag[]>("/tags");
      setAllTags(tags);
    } catch {
      // non-critical if this fails; tag management just won't offer options
    }
  }, []);

  useEffect(() => {
    loadTicket();
    if (user && canManageTags(user.role)) {
      loadTags();
    }
  }, [loadTicket, loadTags, user]);

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    setCommentError("");
    if (!newComment.trim()) {
      setCommentError("Comment cannot be empty.");
      return;
    }
    setPostingComment(true);
    try {
      const created = await apiFetch<Comment>(`/tickets/${id}/comments`, {
        method: "POST",
        body: { body: newComment.trim(), isInternal: isInternalComment },
      });
      setComments((prev) => [...prev, created]);
      setNewComment("");
      setIsInternalComment(false);
    } catch (err) {
      if (err instanceof ApiError) setCommentError(err.message);
      else setCommentError("Something went wrong.");
    } finally {
      setPostingComment(false);
    }
  }

  async function handleAssign() {
    if (!assigneeSelect) return;
    setAssignError("");
    setAssigning(true);
    try {
      const updated = await apiFetch<Ticket>(`/tickets/${id}/assign`, {
        method: "POST",
        body: { assigneeId: Number(assigneeSelect) },
      });
      setTicket(updated);
      setAssigneeSelect("");
      const freshEvents = await apiFetch<TicketEvent[]>(`/tickets/${id}/events`);
      setEvents(freshEvents);
    } catch (err) {
      if (err instanceof ApiError) setAssignError(err.message);
      else setAssignError("Something went wrong.");
    } finally {
      setAssigning(false);
    }
  }

  async function handleStatusChange() {
    if (!ticket || !statusSelect) return;
    const to = statusSelect as TicketStatus;
    const needsNote = transitionRequiresNote(ticket.status, to);
    if (needsNote && !reopenNote.trim()) {
      setStatusError("A note is required to reopen a closed ticket.");
      return;
    }
    setStatusError("");
    setChangingStatus(true);
    try {
      const updated = await apiFetch<Ticket>(`/tickets/${id}/status`, {
        method: "POST",
        body: needsNote
          ? { status: to, note: reopenNote.trim() }
          : { status: to },
      });
      setTicket(updated);
      setStatusSelect("");
      setReopenNote("");
      const freshEvents = await apiFetch<TicketEvent[]>(`/tickets/${id}/events`);
      setEvents(freshEvents);
    } catch (err) {
      if (err instanceof ApiError) setStatusError(err.message);
      else setStatusError("Something went wrong.");
    } finally {
      setChangingStatus(false);
    }
  }

  async function handleAddTag() {
    if (!tagSelect) return;
    setTagError("");
    try {
      const updated = await apiFetch<Ticket>(`/tickets/${id}/tags`, {
        method: "POST",
        body: { tagId: Number(tagSelect) },
      });
      setTicket(updated);
      setTagSelect("");
    } catch (err) {
      if (err instanceof ApiError) setTagError(err.message);
      else setTagError("Something went wrong.");
    }
  }

  async function handleRemoveTag(tagId: number) {
    setTagError("");
    try {
      await apiFetch<void>(`/tickets/${id}/tags/${tagId}`, { method: "DELETE" });
      setTicket((prev) =>
        prev ? { ...prev, tags: prev.tags.filter((t) => t.id !== tagId) } : prev
      );
    } catch (err) {
      if (err instanceof ApiError) setTagError(err.message);
      else setTagError("Something went wrong.");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiFetch<void>(`/tickets/${id}`, { method: "DELETE" });
      router.push("/tickets");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Something went wrong.");
      setDeleting(false);
    }
  }

  if (loading) {
    return <p className="p-6 text-gray-500">Loading ticket...</p>;
  }

  if (notFound) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-gray-100">
        <h1 className="text-xl font-semibold mb-2">Ticket not found</h1>
        <p className="text-gray-500">This ticket doesn&apos;t exist or you don&apos;t have access to it.</p>
      </div>
    );
  }

  if (error || !ticket || !user) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <p className="text-red-400">Could not load ticket: {error}</p>
      </div>
    );
  }

  const isOverdue =
    new Date(ticket.dueAt) < new Date() && ticket.status !== "closed" && ticket.status !== "resolved";
  const options = legalTransitions(ticket.status);
  const inputClass =
    "border border-gray-700 bg-gray-900 text-gray-100 rounded-md px-3 py-2 text-sm";

  return (
    <div className="p-6 max-w-3xl mx-auto text-gray-100">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-semibold">{ticket.subject}</h1>
          {isOverdue && (
            <span className="text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded">Overdue</span>
          )}
        </div>
        <div className="flex gap-4 text-sm text-gray-400">
          <span className={statusColor[ticket.status]}>{ticket.status}</span>
          <span className={priorityColor[ticket.priority]}>{ticket.priority}</span>
          <span>Due {new Date(ticket.dueAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="whitespace-pre-wrap text-gray-200">{ticket.body}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <span className="text-gray-500">Requester: </span>
          <span>{ticket.requester.fullName}</span>
        </div>
        <div>
          <span className="text-gray-500">Assignee: </span>
          <span>{ticket.assignee ? ticket.assignee.fullName : "Unassigned"}</span>
        </div>
      </div>

      <div className="mb-6">
        <span className="text-gray-500 text-sm">Tags: </span>
        {ticket.tags.length === 0 && <span className="text-sm text-gray-400">None</span>}
        {ticket.tags.map((t) => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1 bg-gray-800 text-gray-200 text-xs px-2 py-1 rounded mr-2"
          >
            {t.name}
            {canManageTags(user.role) && (
              <button
                onClick={() => handleRemoveTag(t.id)}
                className="text-gray-400 hover:text-red-400 ml-1"
                aria-label={`Remove ${t.name}`}
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>

      {canManageTags(user.role) && (
        <div className="mb-6 flex gap-2 items-center text-sm">
          <select
            value={tagSelect}
            onChange={(e) => setTagSelect(e.target.value)}
            className={inputClass}
          >
            <option value="">Add a tag...</option>
            {allTags
              .filter((t) => !ticket.tags.some((tt) => tt.id === t.id))
              .map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
          </select>
          <button
            onClick={handleAddTag}
            disabled={!tagSelect}
            className="border border-gray-700 px-3 py-1.5 rounded-md disabled:opacity-40"
          >
            Add
          </button>
          {tagError && <span className="text-red-400 text-xs">{tagError}</span>}
        </div>
      )}

      {canAssign(user.role) && (
        <div className="mb-6 flex gap-2 items-center text-sm">
          <select
            value={assigneeSelect}
            onChange={(e) => setAssigneeSelect(e.target.value)}
            className={inputClass}
          >
            <option value="">Assign to...</option>
            {KNOWN_ASSIGNEES.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
          <button
            onClick={handleAssign}
            disabled={!assigneeSelect || assigning}
            className="border border-gray-700 px-3 py-1.5 rounded-md disabled:opacity-40"
          >
            {assigning ? "Assigning..." : "Assign"}
          </button>
          {assignError && <span className="text-red-400 text-xs">{assignError}</span>}
        </div>
      )}

      {canChangeStatus(user.role) && options.length > 0 && (
        <div className="mb-6 border border-gray-800 rounded-lg p-4">
          <div className="flex gap-2 items-center text-sm mb-2">
            <select
              value={statusSelect}
              onChange={(e) => setStatusSelect(e.target.value)}
              className={inputClass}
            >
              <option value="">Change status...</option>
              {options.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={handleStatusChange}
              disabled={!statusSelect || changingStatus}
              className="border border-gray-700 px-3 py-1.5 rounded-md disabled:opacity-40"
            >
              {changingStatus ? "Updating..." : "Update"}
            </button>
          </div>
          {statusSelect && transitionRequiresNote(ticket.status, statusSelect as TicketStatus) && (
            <textarea
              value={reopenNote}
              onChange={(e) => setReopenNote(e.target.value)}
              placeholder="A note is required to reopen this ticket..."
              rows={2}
              className={`${inputClass} w-full`}
            />
          )}
          {statusError && <p className="text-red-400 text-xs mt-1">{statusError}</p>}
        </div>
      )}

      {canDeleteTicket(user.role) && (
        <div className="mb-6">
          {!deleteConfirming ? (
            <button
              onClick={() => setDeleteConfirming(true)}
              className="text-red-400 text-sm border border-red-900 px-3 py-1.5 rounded-md hover:bg-red-950/30"
            >
              Delete ticket
            </button>
          ) : (
            <div className="flex gap-2 items-center text-sm">
              <span className="text-red-300">Delete this ticket permanently?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-700 text-white px-3 py-1.5 rounded-md disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Confirm delete"}
              </button>
              <button
                onClick={() => setDeleteConfirming(false)}
                className="border border-gray-700 px-3 py-1.5 rounded-md"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Comments</h2>
        <div className="space-y-3 mb-4">
          {comments.length === 0 && <p className="text-gray-500 text-sm">No comments yet.</p>}
          {comments.map((c) => (
            <div key={c.id} className="border border-gray-800 rounded-md p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">
                  {c.author.fullName}
                  {c.isInternal && (
                    <span className="ml-2 text-xs bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded">
                      Internal
                    </span>
                  )}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handlePostComment} className="flex flex-col gap-2">
          {commentError && <p className="text-red-400 text-sm">{commentError}</p>}
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className={`${inputClass} placeholder-gray-500`}
          />
          {canWriteInternalComment(user.role) && (
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={isInternalComment}
                onChange={(e) => setIsInternalComment(e.target.checked)}
                className="accent-white"
              />
              Internal comment (agents/admins only)
            </label>
          )}
          <button
            disabled={postingComment}
            className="self-start bg-white text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
          >
            {postingComment ? "Posting..." : "Post comment"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Activity</h2>
        {events.length === 0 && <p className="text-gray-500 text-sm">No activity yet.</p>}
        <ul className="space-y-2">
          {[...events]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((event) => (
              <li key={event.id} className="text-sm text-gray-400">
                <span>{describeEvent(event)}</span>
                <span className="text-gray-600 ml-2">
                  {new Date(event.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
