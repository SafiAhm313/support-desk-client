"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required.");
      return;
    }
    setSubmitting(true);
    try {
      await register(fullName.trim(), email.trim(), password);
      router.push("/tickets");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto mt-16 flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Create account</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="border p-2 rounded" />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="border p-2 rounded" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="border p-2 rounded" />
      <button disabled={submitting} className="bg-black text-white p-2 rounded disabled:opacity-50">
        {submitting ? "Creating..." : "Create account"}
      </button>
    </form>
  );
}
