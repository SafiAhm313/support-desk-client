import { ApiError } from "./api";

// Maps known API status codes to a message specific to what went wrong,
// rather than showing the raw API message for every failure alike.
export function describeApiError(err: unknown, fallback = "Something went wrong."): string {
  if (!(err instanceof ApiError)) return fallback;

  switch (err.status) {
    case 400:
      return err.message || "That request was not valid.";
    case 403:
      return "You do not have permission to do that.";
    case 404:
      return "That could not be found.";
    case 409:
      return err.message || "That change conflicts with the ticket'\''s current state.";
    case 422:
      return err.message || "That value is not acceptable here.";
    default:
      return err.message || fallback;
  }
}
