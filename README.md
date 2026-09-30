# MAX‑OS‑1

**Client Operating System with MAX-OS Abstractions**

> MAX-OS-1 is the first client OS implementation built on the Portal-OS kernel.

## Architecture

MAX‑OS‑1 is a **client OS**, not a kernel. It is built on top of Portal-OS, the planetary kernel, and communicates with Portal-OS through a well-defined envelope bridge.

```
┌─────────────────────────────────┐
│  MAX‑OS‑1 (Client OS)           │
│  - MAX-OS abstractions          │
│  - Session orchestration        │
│  - SIM cognitive wiring         │
│  - TEC execution layer          │
│  - Substrate persistence        │
└─────────────────────────────────┘
              ↓
    Portal-OS Envelope Bridge
  (Deterministic Request/Response)
              ↓
┌─────────────────────────────────┐
│  Portal-OS (Kernel)             │
│  src/do/PortalKernel.ts         │
│  - Phase‑12 lanes               │
│  - Durable Object state         │
│  - Identity enforcement         │
│  - Governance + Umbrella        │
└─────────────────────────────────┘
```

## This Repository

MAX‑OS‑1 contains:

- **src/maxos/** — MAX-OS abstractions:
  - `middleware/` — enforcement, identity validation, governance
  - `routing/` — lane-based envelope routing
  - `session/` — session orchestration
  - `state/` — substrate, repositories, R2 adapters
  - `observability/` — logging, metrics, tracing
  - `resilience/` — retries, circuit breaking, timeouts

- **src/index.ts** — Hono Worker entrypoint that:
  - Parses and validates incoming envelopes
  - Enforces identity + governance
  - Routes envelopes through MAX-OS lanes
  - Sends envelopes to Portal-OS kernel
  - Normalizes responses for clients

- **tests/** — Integration tests for MAX-OS abstractions

- **wrangler.toml** — Cloudflare Workers config:
  - `KERNEL_SERVICE` binding to `portal-kernel` Worker
  - `MAXOS_STATE` R2 bucket for persistent state
  - Phase-11 runtime variables

## Portal-OS Separation

**Portal-OS is the kernel. MAX-OS-1 is a client.**

The Portal-OS kernel repository (`planetary-max`) contains:
- `src/do/PortalKernel.ts` — single Durable Object
- `src/index.ts` — Worker routes that call PortalKernel
- Phase-12 lanes: portal, planetary, sim, windows, identity, umbrella, timeline, diff, replay
- JWT-based identity verification
- Umbrella strict governance enforcement

MAX-OS-1 does **not** implement the kernel; it sends typed envelopes to Portal-OS and receives deterministic results.

## Communication Protocol

### Request Envelope (MAX-OS-1 → Portal-OS)

```json
{
  "id": "message-unique-id",
  "type": "sim | tec | universe | session",
  "payload": { "...": "lane-specific data" },
  "identity": {
    "credential": "jwt-token",
    "id": "identity-id",
    "type": "user | service | system",
    "authenticated": true,
    "roles": ["role1", "role2"]
  },
  "governanceContext": {
    "umbrella": { "allowed": true, "policy": "..." },
    "planetary": { "allowed": true, "policy": "..." },
    "session": { "allowed": true, "policy": "..." }
  },
  "sessionId": "optional-session-id",
  "sim": { "...": "optional sim context" },
  "tec": { "...": "optional tec context" }
}
```

### Response Envelope (Portal-OS → MAX-OS-1)

```json
{
  "ok": true,
  "messageId": "message-unique-id",
  "status": 200,
  "data": { "...": "normalized result" }
}
```

## Development

### Prerequisites
- Node.js 18+
- Cloudflare Workers account
- Portal-OS kernel deployed (`portal-kernel` service binding)

### Installation

```bash
git clone https://github.com/maxijurreau/MAX-OS-1.git
cd MAX-OS-1
npm install
npm run build
npm run check
npm test
```

### Testing

```bash
# Type check
npm run check

# Run tests
npm test

# Deploy dry run (requires wrangler login)
npx wrangler deploy --dry-run
```

### Debugging

1. Verify Portal-OS kernel is running as `portal-kernel` service
2. Check `KERNEL_SERVICE` binding in `wrangler.toml`
3. Review enforcement middleware logs for identity/governance failures
4. Inspect envelope shape in middleware/enforcement.ts

## Integration with Portal-OS

MAX-OS-1 expects Portal-OS (`portal-kernel`) to be available via service binding.

**Deployment order:**
1. Deploy Portal-OS kernel (`planetary-max`)
2. Create or update `portal-kernel` service binding in your Cloudflare account
3. Deploy MAX-OS-1, which will call `KERNEL_SERVICE`

**Configuration:**
- Set `KERNEL_SERVICE` to the Portal-OS Worker
- Set `MAXOS_STATE` to an R2 bucket for session/SIM/TEC/universe state
- Portal-OS handles identity verification and governance enforcement

## Tests

MAX-OS-1 tests focus on:
- Envelope parsing and validation
- Enforcement middleware (identity + governance)
- Lane routing and orchestration
- Substrate persistence (R2 adapters)
- Resilience (retries, timeouts, circuit breaking)

Tests **do not** include PortalKernel unit tests — those belong in the Portal-OS repository.

## Status

- **Rebuild Phase**: 11
- **Architecture**: Client OS on Portal-OS kernel
- **Next Phase**: Deploy to Cloudflare with Portal-OS kernel service binding

---

**Last Updated**: 2026-09-30  
**Architecture**: Separated client (MAX-OS-1) and kernel (Portal-OS) repositories  
**Integration**: Envelope bridge to Portal-OS kernel
