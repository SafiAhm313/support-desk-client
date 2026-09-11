"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { TicketListResponse, TicketStatus, TicketPriority } from "@/lib/types";
import Link from "next/link";

const STATUSES: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];
const PRIORITIES: TicketPriority[] = ["low", "normal", "high", "urgent"];

const inputClass =
  "border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400";

const priorityColor: Record<TicketPriority, string> = {
  low: "text-gray-400",
  normal: "text-blue-400",
  high: "text-orange-400",
  urgent: "text-red-400",
};

const statusColor: Record<TicketStatus, string> = {
  open: "text-blue-400",
  in_progress: "text-yellow-400",
  resolved: "text-green-400",
  closed: "text-gray-500",
};

export default function TicketsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [result, setResult] = useState<TicketListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");

  const status = searchParams.get("status") ?? "";
  const priority = searchParams.get("priority") ?? "";
  const overdue = searchParams.get("overdue") ?? "";
  const q = searchParams.get("q") ?? "";
  const sort = searchParams.get("sort") ?? "createdAt";
  const order = searchParams.get("order") ?? "desc";
  const page = Number(searchParams.get("page") ?? "1");

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    if (!("page" in updates)) {
      params.set("page", "1");
    }
    router.push(`/tickets?${params.toString()}`);
  }

  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput !== q) {
        updateParams({ q: searchInput || null });
      }
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      if (overdue) params.set("overdue", overdue);
      if (q) params.set("q", q);
      params.set("sort", sort);
      params.set("order", order);
      params.set("page", String(page));
      params.set("pageSize", "20");

      const res = await apiFetch<TicketListResponse>(`/tickets?${params.toString()}`);
      setResult(res);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [status, priority, overdue, q, sort, order, page]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;

  return (
    <div className="p-6 max-w-5xl mx-auto text-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Tickets</h1>
        <Link
          href="/tickets/new"
          className="bg-white text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition"
        >
          New ticket
        </Link>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mb-6 flex flex-wrap gap-3 items-center">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search subject or body..."
          className={`${inputClass} flex-1 min-w-[220px]`}
        />

        <select
          value={status}
          onChange={(e) => updateParams({ status: e.target.value || null })}
          className={inputClass}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={priority}
          onChange={(e) => updateParams({ priority: e.target.value || null })}
          className={inputClass}
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={overdue === "true"}
            onChange={(e) => updateParams({ overdue: e.target.checked ? "true" : null })}
            className="accent-white"
          />
          Overdue only
        </label>

        <select
          value={`${sort}:${order}`}
          onChange={(e) => {
            const [newSort, newOrder] = e.target.value.split(":");
            updateParams({ sort: newSort, order: newOrder });
          }}
          className={inputClass}
        >
          <option value="createdAt:desc">Newest first</option>
          <option value="createdAt:asc">Oldest first</option>
          <option value="dueAt:asc">Due date ↑</option>
          <option value="dueAt:desc">Due date ↓</option>
          <option value="priority:desc">Priority ↓</option>
          <option value="priority:asc">Priority ↑</option>
        </select>
      </div>

      {loading && <p className="text-gray-500">Loading tickets...</p>}

      {!loading && error && (
        <p className="text-red-400">Could not load tickets: {error}</p>
      )}

      {!loading && !error && result && result.data.length === 0 && (
        <p className="text-gray-500">
          {status || priority || overdue || q
            ? "No tickets match this filter."
            : "You have no tickets."}
        </p>
      )}

      {!loading && !error && result && result.data.length > 0 && (
        <>
          <div className="border border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left bg-gray-900/50 text-gray-400">
                  <th className="py-3 px-4 font-medium">Subject</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Priority</th>
                  <th className="py-3 px-4 font-medium">Due</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((ticket) => (
                  <tr key={ticket.id} className="border-t border-gray-800 hover:bg-gray-900/30">
                    <td className="py-3 px-4">
                      <Link href={`/tickets/${ticket.id}`} className="text-blue-400 hover:underline">
                        {ticket.subject}
                      </Link>
                    </td>
                    <td className={`py-3 px-4 ${statusColor[ticket.status]}`}>{ticket.status}</td>
                    <td className={`py-3 px-4 ${priorityColor[ticket.priority]}`}>{ticket.priority}</td>
                    <td className="py-3 px-4 text-gray-400">
                      {new Date(ticket.dueAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4 text-sm text-gray-400">
            <span>
              Page {result.page} of {totalPages} ({result.total} total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => updateParams({ page: String(page - 1) })}
                className="border border-gray-700 px-3 py-1.5 rounded-md disabled:opacity-40 hover:bg-gray-900"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => updateParams({ page: String(page + 1) })}
                className="border border-gray-700 px-3 py-1.5 rounded-md disabled:opacity-40 hover:bg-gray-900"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
