import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import TicketsPage from "../app/(protected)/tickets/page";

let mockSearchParams = new URLSearchParams();
const pushMock = jest.fn((url: string) => {
  const queryString = url.split("?")[1] ?? "";
  mockSearchParams = new URLSearchParams(queryString);
});

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => mockSearchParams,
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

describe("TicketsPage - filters drive the URL and the request", () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams();
    pushMock.mockClear();
    (apiFetch as jest.Mock).mockReset();
    (apiFetch as jest.Mock).mockResolvedValue({ data: [], page: 1, pageSize: 20, total: 0 });
  });

  it("changing the status filter updates the URL and issues a request carrying it", async () => {
    const { rerender } = render(<TicketsPage />);

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledTimes(1);
    });

    const statusSelect = screen.getByDisplayValue("All statuses");
    fireEvent.change(statusSelect, { target: { value: "open" } });

    // The filter change should have called router.push with status=open in the URL
    expect(pushMock).toHaveBeenCalledTimes(1);
    const pushedUrl = pushMock.mock.calls[0][0] as string;
    expect(pushedUrl).toContain("status=open");

    // Simulate Next.js re-rendering the page with the new URL's searchParams
    rerender(<TicketsPage />);

    await waitFor(() => {
      const calls = (apiFetch as jest.Mock).mock.calls;
      const lastCallUrl = calls[calls.length - 1][0] as string;
      expect(lastCallUrl).toContain("status=open");
    });
  });
});
