# Vikunja MCP Server

MCP server exposing the Vikunja task management API to Claude.ai via OAuth 2.0.

## Tech Stack

- **Runtime**: Node.js 22 (CommonJS)
- **Language**: TypeScript strict mode
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **Vikunja API**: axios (REST HTTP client)
- **HTTP**: Express 4
- **Auth**: JWT via `jsonwebtoken`, OAuth 2.0 via MCP SDK's `mcpAuthRouter`
- **Token store**: SQLite via `better-sqlite3` (persists across restarts)

## Project Structure

```
src/
├── config.ts           # Env var validation (fail-fast on startup)
├── index.ts            # Express app + startup/shutdown lifecycle
├── auth/
│   ├── db.ts           # better-sqlite3 singleton + schema init
│   ├── store.ts        # SQLite-backed OAuth state (codes, tokens, clients)
│   ├── oauth.ts        # OAuthServerProvider + HTML login form
│   └── middleware.ts   # Bearer JWT validation middleware
├── vikunja/
│   └── client.ts       # axios singleton — all Vikunja API calls go here
└── mcp/
    ├── server.ts       # McpServer factory + tool registration
    └── tools/
        ├── utils.ts    # Shared ok() / fail() helpers
        ├── tasks.ts
        ├── comments.ts
        ├── labels.ts
        ├── projects.ts
        ├── teams.ts
        ├── users.ts
        ├── views.ts
        └── filters.ts
```

## Development

```bash
cp .env.example .env    # fill in your values
npm install
npm run dev             # ts-node with hot reload
npm run build           # compile to dist/ via esbuild (~6ms)
npm start               # run compiled output
```

> **IMPORTANT**: NEVER run `npm run typecheck` — the MCP SDK's type definitions exceed Node's heap limit and will OOM.
> Use `npm run build` (esbuild) to verify the code compiles.

## Vikunja API Conventions

The Vikunja REST API uses **non-standard HTTP verbs**:

| Operation | Verb |
|-----------|------|
| Create    | `PUT` |
| Update    | `POST` |
| Delete    | `DELETE` |
| Read      | `GET` |

This is the opposite of typical REST. The `vikunjaClient` in `src/vikunja/client.ts` abstracts this — tool code never calls axios directly.

## Adding a New Tool

1. Add the typed method to `VikunjaClient` in `src/vikunja/client.ts`
2. Register the tool in the appropriate file under `src/mcp/tools/`
3. Add it to `createMcpServer()` in `src/mcp/server.ts` if it's a new file
4. Update the Tools table in `README.md`
5. Run `npm run build` to verify

Tool registration pattern:

```typescript
import { ok, fail } from './utils';

server.registerTool('tool-name', {
  description: 'What this tool does.',
  inputSchema: {
    id: z.number().int().describe('Resource ID'),
    // ...
  },
}, async ({ id }) => {
  try {
    return ok(await vikunjaClient.someMethod(id));
  } catch (e) { return fail('my tool error', e); }
});
```

## Coding Rules

- No file > 300 lines
- No function > 50 lines
- TypeScript strict mode — no `any` without comment justification
- All tool handlers must have a try/catch returning `fail('X tool error', e)` on error
- All Vikunja API calls go through `vikunjaClient` — no direct axios usage in tool files
- Use `ok()` and `fail()` from `src/mcp/tools/utils.ts` — never define them inline in tool files
- Tool responses use compact JSON (`JSON.stringify(data)`) — no pretty-printing
- **List methods** in `VikunjaClient` strip noisy/unused fields (e.g. `created_by`, `bucket_id`, `position`) before returning; **single-item methods** return the full object

## Auth Flow (for reference)

1. Claude.ai discovers OAuth metadata at `/.well-known/oauth-authorization-server`
2. Redirects user to `/authorize` — our HTML form asks for `MCP_AUTH_PASSWORD`
3. On correct password, we issue an auth code and redirect back to Claude.ai
4. Claude.ai exchanges the code at `/token` for a JWT access token (24hr) + refresh token (90d)
5. All `/mcp` requests include `Authorization: Bearer <jwt>` — validated by `bearerAuthMiddleware`

## README Maintenance

**Keep README.md in sync when making changes:**

- Adding a tool → update the correct row in the Tools table
- Adding a new tool file → add a new row to the table and update the Project Structure tree
- Adding/removing env vars → update the Environment Variables table
- The feature count in the Features section ("42 tools") must match the actual count
