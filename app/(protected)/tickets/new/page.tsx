"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { Ticket, TicketPriority } from "@/lib/types";

const PRIORITIES: TicketPriority[] = ["low", "normal", "high", "urgent"];

export default function NewTicketPage() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("normal");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError("");

    if (!subject.trim() || !body.trim()) {
      setFieldErrors({
        ...(!subject.trim() ? { subject: "Subject is required." } : {}),
        ...(!body.trim() ? { body: "Body is required." } : {}),
      });
      return;
    }

    setSubmitting(true);
    try {
      const created = await apiFetch<Ticket>("/tickets", {
        method: "POST",
        body: { subject: subject.trim(), body: body.trim(), priority },
      });
      router.push(`/tickets/${created.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
        else setGeneralError(err.message);
      } else {
        setGeneralError("Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto text-gray-100">
      <h1 className="text-2xl font-semibold mb-6">New ticket</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {generalError && <p className="text-red-400 text-sm">{generalError}</p>}

        <div>
          <label className="block text-sm text-gray-400 mb-1">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border border-gray-700 bg-gray-900 text-gray-100 rounded-md px-3 py-2 text-sm"
          />
          {fieldErrors.subject && (
            <p className="text-red-400 text-xs mt-1">{fieldErrors.subject}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="w-full border border-gray-700 bg-gray-900 text-gray-100 rounded-md px-3 py-2 text-sm"
          />
          {fieldErrors.body && (
            <p className="text-red-400 text-xs mt-1">{fieldErrors.body}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
            className="border border-gray-700 bg-gray-900 text-gray-100 rounded-md px-3 py-2 text-sm"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {fieldErrors.priority && (
            <p className="text-red-400 text-xs mt-1">{fieldErrors.priority}</p>
          )}
        </div>

        <button
          disabled={submitting}
          className="self-start bg-white text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create ticket"}
        </button>
      </form>
    </div>
  );
}
