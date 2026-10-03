# Support Desk Client

Next.js (App Router) + TypeScript + Tailwind frontend for the Support Desk ticketing system, built in Week 11 of the Coding Pixel internship, hardened and deployed in Week 12. Consumes the Week 10/12 NestJS API.

**Live client:** https://support-desk-client-iota.vercel.app
**Live API:** https://support-desk-cyan.vercel.app

## Running the API and client together

Two servers, two terminals, from sibling repository folders:

**Terminal 1 - API** (in the `support-desk` repo)
npm install
npm run start:dev

Runs on `http://localhost:3001` (set via `PORT` in the API's `.env`).

**Terminal 2 - Client** (this repo)
npm install
npm run dev

Runs on `http://localhost:3000`.

Both must be running for the app to work end to end.

## Environment variables

Copy `.env.example` to `.env.local` and set:
NEXT_PUBLIC_API_URL=http://localhost:3001

For the deployed client this is set to the deployed API's URL in Vercel, before build time, since Next.js inlines `NEXT_PUBLIC_*` variables at build time. The app also builds and runs correctly with this variable **unset** locally - an absent API URL is a supported state (requests will fail gracefully with a "not configured" error rather than crashing).

## Seeded accounts

Use the same accounts documented in the API's README (all `password123`), for example:

| Role | Email |
|---|---|
| Admin | `admin@supportdesk.test` |
| Agent | `agent1@supportdesk.test` |
| Customer | `customer1@supportdesk.test` |

These exist on both the local database and the deployed Neon database.

## Assignee selection

The "Assign to..." control on the ticket detail page fetches real agents and admins from `GET /users/assignable` on the API, rather than a hardcoded list - this was fixed in Week 12 after the Week 10 API gained that endpoint.

## Error handling

API errors map to distinct messages by status code (`lib/error-messages.ts`): 400 shows the validation message, 403 says permission was denied, 404 says the resource wasn't found, 409 and 422 show the server's specific conflict/validation message. A 401 clears the session and redirects to `/login`.

## 404 page

An unknown route renders the app's own dark-themed "Page not found" screen (`app/not-found.tsx`), not a framework default.

## Testing
npm test

Runs the component/unit specs under `__tests__/` with `fetch`/`apiFetch` mocked - no live API or database required. Covers: the API client's Authorization header handling, ticket list rendering (populated and empty states), filter-to-URL-to-request propagation, role-gated ticket controls, and the status transition machine.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and pull request to `main`: Node 20, `npm ci`, `npm run build`, `npm test`. No API, database, or secrets required.
