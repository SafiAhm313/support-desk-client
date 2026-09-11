import { render, screen, waitFor } from "@testing-library/react";
import TicketDetailPage from "../app/(protected)/tickets/[id]/page";

let mockUser: { id: number; fullName: string; email: string; role: string; createdAt: string } | null = null;

jest.mock("../lib/auth-context", () => ({
  useAuth: () => ({
    user: mockUser,
    token: "fake-token",
    isLoading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "1" }),
  useRouter: () => ({ push: jest.fn() }),
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

const mockTicket = {
  id: 1,
  subject: "Sample ticket",
  body: "Body text",
  status: "open",
  priority: "normal",
  requester: { id: 10, fullName: "Cara Customer", email: "c@x.com", role: "customer", createdAt: "" },
  assignee: null,
  dueAt: "2026-09-20T00:00:00.000Z",
  createdAt: "2026-09-10T00:00:00.000Z",
  updatedAt: "2026-09-10T00:00:00.000Z",
  tags: [],
};

function setupApiMock() {
  (apiFetch as jest.Mock).mockImplementation((path: string) => {
    if (path === "/tickets/1") return Promise.resolve(mockTicket);
    if (path === "/tickets/1/comments") return Promise.resolve([]);
    if (path === "/tickets/1/events") return Promise.resolve([]);
    if (path === "/tags") return Promise.resolve([]);
    return Promise.resolve([]);
  });
}

describe("TicketDetailPage - role-gated controls", () => {
  beforeEach(() => {
    (apiFetch as jest.Mock).mockReset();
    setupApiMock();
  });

  it("shows agent controls (assign, status, tags) for an agent", async () => {
    mockUser = { id: 2, fullName: "Alex Agent", email: "agent1@x.com", role: "agent", createdAt: "" };

    render(<TicketDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Sample ticket")).toBeInTheDocument();
    });

    expect(screen.getByText("Assign to...")).toBeInTheDocument();
    expect(screen.getByText("Change status...")).toBeInTheDocument();
    expect(screen.getByText("Add a tag...")).toBeInTheDocument();
  });

  it("hides agent controls for a customer", async () => {
    mockUser = { id: 10, fullName: "Cara Customer", email: "c@x.com", role: "customer", createdAt: "" };

    render(<TicketDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Sample ticket")).toBeInTheDocument();
    });

    expect(screen.queryByText("Assign to...")).not.toBeInTheDocument();
    expect(screen.queryByText("Change status...")).not.toBeInTheDocument();
    expect(screen.queryByText("Add a tag...")).not.toBeInTheDocument();
  });
});
