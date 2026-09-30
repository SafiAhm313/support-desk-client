import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center text-gray-100 px-6">
      <h1 className="text-3xl font-semibold mb-2">Page not found</h1>
      <p className="text-gray-400 mb-6">
        The page you are looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link
        href="/tickets"
        className="bg-white text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200"
      >
        Back to Tickets
      </Link>
    </div>
  );
}
