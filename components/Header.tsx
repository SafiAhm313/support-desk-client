"use client";
import { useAuth } from "@/lib/auth-context";

export function Header() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <header className="flex justify-between items-center p-4 border-b">
      <span className="font-medium">
        {user.fullName} <span className="text-gray-500 text-sm">({user.role})</span>
      </span>
      <button onClick={logout} className="text-sm text-red-600">
        Sign out
      </button>
    </header>
  );
}
