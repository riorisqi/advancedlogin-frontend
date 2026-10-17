# AdvancedLogin — Frontend

The React app for a learning project on **QR code login** (like WhatsApp Web, Discord or Steam):
a logged-in phone scans a QR code shown on a computer, approves, and the computer is signed in
without typing a password there.

One app serves both sides:

- **Desktop** (`/`): shows the QR code, follows its status live, finishes the login.
- **Phone** (`/m/...`): signs in with a password, scans/opens the QR, approves or rejects.

The API and the design docs live in the sibling repo
[`advancedlogin-backend`](https://github.com/riorisqi/advancedlogin-backend). Start with its
[docs/ARCHITECTURE.md](https://github.com/riorisqi/advancedlogin-backend/blob/main/docs/ARCHITECTURE.md).

## Stack

- React 19 + TypeScript, Vite 8, Tailwind CSS 4, React Router
- [`qrcode.react`](https://github.com/zpao/qrcode.react) to draw the QR code
- [`barcode-detector`](https://github.com/Sec-ant/barcode-detector) (the standard `BarcodeDetector`
  API on ZXing-WebAssembly) to read it with the phone camera
- `EventSource` (Server-Sent Events) for live status, with polling as a fallback
- [bun](https://bun.sh) as package manager and script runner, oxlint for linting

## Quick start

Prerequisites: **bun**, and the backend running on http://localhost:8080 (see its README).

```bash
bun install
bun dev            # http://localhost:5173
```

Vite proxies `/api/*` to the backend, so the browser only ever talks to one origin: no CORS,
and the cookies (`SESSION`, `qr_bind`, `XSRF-TOKEN`) behave like they would in production.
To point at a different backend: `BACKEND_URL=http://localhost:8090 bun dev`.

### Trying a QR login locally

Cookies are per browser profile, so use two:

1. **Desktop:** a normal window at http://localhost:5173 shows the QR code.
2. **Phone:** an **incognito/private** window at http://localhost:5173/m. Sign in with a test
   account (seeded from `app.seed-users` in the backend's `application.yml`).
3. On the desktop, click **dev: open approve link** under the QR. Paste the URL into the phone
   window, check the details, press **Approve**.
4. The desktop shows "Welcome, …".

The small grey **dev:** line under the QR tells you whether updates arrive over the SSE stream
or the polling fallback.

### With a real phone (camera scanner)

1. PC and phone on the **same Wi-Fi**. Backend running as usual.
2. In `frontend/`: `bun run dev:lan`. It prints a `Network: https://192.168.x.x:5173/` address.
   (Windows may ask to allow Node/bun through the firewall: allow it for private networks.)
3. **Desktop:** open that `https://192.168.x.x:5173` address (not localhost: the QR link is built
   from the address the desktop uses, and the phone can't reach "localhost").
4. **Phone:** open the same address + `/m`. Accept the certificate warning once (the dev cert is
   self-signed), sign in, tap **Scan QR code**, allow the camera, point it at the screen.
5. Check the details on the phone (browser, OS, the PC's LAN IP), tap **Approve**. The desktop
   signs in.

Why HTTPS: browsers only allow camera access on secure origins (`https://` or `localhost`).

## Scripts

| Command | What it does |
|---|---|
| `bun dev` | dev server on http://localhost:5173 with hot reload and the `/api` proxy |
| `bun run dev:lan` | same, but HTTPS (self-signed) and reachable from your LAN, for a real phone |
| `bun run build` | type-check (`tsc -b`) and build to `dist/` |
| `bun run lint` | oxlint, including the architecture rules below |
| `bun test` | unit tests (`*.test.ts`, run by bun's built-in test runner) |
| `bun run preview` | serve the production build locally |

## Routes

| Path | Side | Page |
|---|---|---|
| `/` | desktop | QR login when signed out, "Welcome" when signed in |
| `/status` | any | backend + Redis health |
| `/m/login` | phone | password sign-in |
| `/m` | phone | home: scan button, sign out |
| `/m/scan` | phone | camera scanner (or paste the link) |
| `/m/approve/:qrId` | phone | what the QR opens: device details + Approve / Reject |

All `/m/*` pages except `/m/login` are behind `RequireAuth`; after signing in you land where you were going.

## Code layout (clean architecture)

```
src/
├── domain/          plain TypeScript: types and pure logic (no React, no fetch)
├── application/     use-case hooks (useQrLogin, useQrApproval, AuthProvider) + ports
│   └── ports/       interfaces: AuthGateway, QrGateway, QrStatusStream, ...
├── infrastructure/  port implementations: fetch + CSRF, EventSource, camera, clock-skew helpers
├── presentation/    pages and components; they only talk to application hooks
├── app/             composition root: wires real implementations into a context, routes
└── main.tsx
```

The dependency rule is **enforced by `bun run lint`**: `.oxlintrc.json` has
`no-restricted-imports` overrides per folder (e.g. `presentation/` importing from
`infrastructure/` fails the lint). Why the layers exist and how they map to the backend:
[CLEAN_ARCHITECTURE.md](https://github.com/riorisqi/advancedlogin-backend/blob/main/docs/CLEAN_ARCHITECTURE.md)
(§4 is the frontend). Security backlog: [SECURITY.md](https://github.com/riorisqi/advancedlogin-backend/blob/main/docs/SECURITY.md).

## Things worth reading in the code

- `application/qr/useQrLogin.ts`: the desktop flow. Create session, SSE with polling fallback,
  countdown and auto-refresh, exchange the code. Note the `queueMicrotask` trick that stops
  React StrictMode's dev double-run from creating two sessions or redeeming a code twice.
- `infrastructure/http/httpClient.ts`: CSRF double-submit cookie, refresh-and-retry on 403.
- `infrastructure/http/serverClock.ts`: why deadlines from the server are converted to the
  local clock (user PCs have wrong clocks).
- `infrastructure/qr/sseQrStatusStream.ts`: `EventSource`, reconnects, and when to give up.
- `domain/qr/approveLink.ts` (+ its test): why the phone never just opens whatever URL the
  camera read.
- `infrastructure/camera/cameraQrCodeScanner.ts`: `getUserMedia`, decoding frames, turning the
  camera off again, and serving the `.wasm` from our own build instead of a CDN.
