import { render, screen, waitFor } from "@testing-library/react";
import TicketsPage from "../app/(protected)/tickets/page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("../lib/api", () => ({
  apiFetch: jest.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    fieldErrors?: Record<string, string>;
    constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
      super(message);
      this.status = status;
      this.fieldErrors = fieldErrors;
    }
  },
}));

import { apiFetch } from "@/lib/api";

describe("TicketsPage - list rendering", () => {
  beforeEach(() => {
    (apiFetch as jest.Mock).mockReset();
  });

  it("renders rows from a mocked page envelope", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({
      data: [
        { id: 1, subject: "First ticket", status: "open", priority: "high", dueAt: "2026-09-15T00:00:00.000Z" },
        { id: 2, subject: "Second ticket", status: "resolved", priority: "low", dueAt: "2026-09-16T00:00:00.000Z" },
      ],
      page: 1,
      pageSize: 20,
      total: 2,
    });

    render(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText("First ticket")).toBeInTheDocument();
    });
    expect(screen.getByText("Second ticket")).toBeInTheDocument();
    expect(screen.getByText(/2 total/)).toBeInTheDocument();
  });

  it("shows the true-empty state from an empty envelope", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ data: [], page: 1, pageSize: 20, total: 0 });

    render(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText("You have no tickets.")).toBeInTheDocument();
    });
  });
});
