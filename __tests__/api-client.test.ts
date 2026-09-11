import { apiFetch } from "@/lib/api";
import { setToken, clearToken } from "@/lib/session";

function mockFetchOnce(body: unknown, status = 200) {
  const mockFn = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
  global.fetch = mockFn as unknown as typeof fetch;
  return mockFn;
}

describe("apiFetch - Authorization header", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:3001";
    localStorage.clear();
  });

  it("attaches the Authorization header when a session token exists", async () => {
    setToken("fake-token-123");
    const fetchSpy = mockFetchOnce({ ok: true });

    await apiFetch("/tickets");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, options] = fetchSpy.mock.calls[0];
    const headers = options?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer fake-token-123");
  });

  it("omits the Authorization header when signed out", async () => {
    clearToken();
    const fetchSpy = mockFetchOnce({ ok: true });

    await apiFetch("/tickets");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, options] = fetchSpy.mock.calls[0];
    const headers = options?.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });
});
