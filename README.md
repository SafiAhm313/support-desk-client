# Support Desk Client

Next.js (App Router) + TypeScript + Tailwind frontend for the Support Desk ticketing system, built in Week 11 of the Coding Pixel internship. Consumes the Week 10 NestJS API.

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

The app also builds and runs correctly with this variable **unset** - an absent API URL is a supported state (requests will fail gracefully with a "not configured" error rather than crashing).

## Seeded accounts, by role

| Role | Email | Password |
|---|---|---|
| Customer | `safi.ahmad.mgs@gmail.com` | `safi1234` |
| Agent | `agent1@supportdesk.test` | `agent1234` |
| Admin | `admin@supportdesk.test` | `agent1234` |

The agent and admin passwords were reset from unknown Week 10 seed values via a direct database update (bcrypt, 10 rounds) during development, since the API has no endpoint to create or promote agent/admin accounts.

## Known limitation: assignee selection

The Week 10 API has no endpoint to list users or agents (`GET /users` does not exist). The "Assign to..." control on the ticket detail page is therefore populated from a small hardcoded list of the three known seed accounts (`lib` constant `KNOWN_ASSIGNEES` in the ticket detail page), rather than being dynamically fetched. A real system would need a users-listing endpoint to do this properly.

## Testing

npm test


Runs five component/unit specs under `__tests__/` with `fetch`/`apiFetch` mocked - no live API or database required. Covers: the API client's Authorization header handling, ticket list rendering (populated and empty states), filter-to-URL-to-request propagation, role-gated ticket controls, and the status transition machine.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and pull request to `main`: Node 20, `npm ci`, `npm run build`, `npm test`. No API, database, or secrets required.
