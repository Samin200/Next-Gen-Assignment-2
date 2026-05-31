import { useState } from "react";

type Method = "GET" | "POST" | "PATCH" | "DELETE";

interface Endpoint {
  method: Method;
  path: string;
  auth: "public" | "authenticated" | "maintainer";
  summary: string;
  body?: string;
  params?: string;
  query?: string;
  response?: string;
  notes?: string[];
}

const endpoints: Endpoint[] = [
  {
    method: "POST",
    path: "/api/auth/signup",
    auth: "public",
    summary: "Register a new user. Password is hashed with bcrypt (8–12 rounds).",
    body: `{
  "name": "Ada Lovelace",
  "email": "ada@devpulse.io",
  "password": "strong-password",
  "role": "contributor" | "maintainer"
}`,
    response: `201 Created
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1, "name": "...", "email": "...",
    "role": "contributor",
    "created_at": "...", "updated_at": "..."
  }
}`,
  },
  {
    method: "POST",
    path: "/api/auth/login",
    auth: "public",
    summary: "Authenticate and receive a JWT.",
    body: `{ "email": "...", "password": "..." }`,
    response: `200 OK
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "<jwt>",
    "user": { "id": 1, "name": "...", "email": "...", "role": "..." }
  }
}`,
  },
  {
    method: "POST",
    path: "/api/issues",
    auth: "authenticated",
    summary: "Create a new issue. reporter_id is derived from the JWT.",
    body: `{
  "title": "Login button broken",
  "description": "Clicking login does nothing",
  "type": "bug" | "feature_request"
}`,
    response: `201 Created
{
  "success": true,
  "message": "Issue created successfully",
  "data": { id, title, description, type, status:"open",
            reporter_id, created_at, updated_at }
}`,
  },
  {
    method: "GET",
    path: "/api/issues",
    auth: "public",
    summary: "List issues. Nested reporter is fetched separately (no JOINs).",
    query: `sort=newest|oldest (default newest)
type=bug|feature_request
status=open|in_progress|resolved`,
    response: `200 OK
{
  "success": true,
  "message": "Issues fetched successfully",
  "data": [{
    "id": 1, "title": "...", "description": "...",
    "type": "bug", "status": "open",
    "reporter": { "id": 1, "name": "...", "role": "contributor" },
    "created_at": "...", "updated_at": "..."
  }]
}`,
  },
  {
    method: "GET",
    path: "/api/issues/:id",
    auth: "public",
    summary: "Get a single issue with a nested reporter object.",
    params: "id (positive integer)",
    response: `200 OK — same shape as items returned by GET /api/issues`,
  },
  {
    method: "PATCH",
    path: "/api/issues/:id",
    auth: "authenticated",
    summary:
      "Update an issue. Maintainers can update any issue. Contributors can only update their own open issues.",
    params: "id (positive integer)",
    body: `{ "title"?: "...", "description"?: "...", "type"?: "bug"|"feature_request" }
# status is NOT updatable via this endpoint`,
    response: `200 OK
{
  "success": true,
  "message": "Issue updated successfully",
  "data": { id, title, description, type, status,
            reporter_id, created_at, updated_at }
}`,
    notes: [
      "403 if contributor tries to update someone else's issue",
      "409 if contributor tries to update an issue whose status is not 'open'",
    ],
  },
  {
    method: "DELETE",
    path: "/api/issues/:id",
    auth: "maintainer",
    summary: "Delete an issue. Maintainer role required.",
    params: "id (positive integer)",
    response: `200 OK
{ "success": true, "message": "Issue deleted successfully" }`,
  },
];

const methodStyles: Record<Method, string> = {
  GET: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  POST: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  PATCH: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  DELETE: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

const authBadge: Record<Endpoint["auth"], string> = {
  public: "bg-slate-700/60 text-slate-300",
  authenticated: "bg-violet-500/20 text-violet-300",
  maintainer: "bg-fuchsia-500/20 text-fuchsia-300",
};

export default function App() {
  const [active, setActive] = useState(0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-[32rem] h-[32rem] bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 grid place-items-center text-xl shadow-lg shadow-indigo-500/20">
              💓
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                DevPulse
              </h1>
              <p className="text-sm text-slate-400">Tech Issue Tracker REST API</p>
            </div>
          </div>
          <p className="text-slate-300 max-w-3xl leading-relaxed">
            A Node.js + TypeScript + Express REST API backed by PostgreSQL
            (native <code className="text-emerald-300">pg</code> driver, raw
            SQL, no JOINs). Supports JWT auth with role-based permissions for{" "}
            <span className="text-violet-300">maintainers</span> and{" "}
            <span className="text-fuchsia-300">contributors</span>.
          </p>

          <div className="flex flex-wrap gap-2 mt-5 text-xs">
            <Badge>Node.js</Badge>
            <Badge>TypeScript (strict)</Badge>
            <Badge>Express</Badge>
            <Badge>PostgreSQL + pg</Badge>
            <Badge>JWT</Badge>
            <Badge>bcrypt</Badge>
            <Badge>http-status-codes</Badge>
          </div>
        </header>

        {/* Auth callout */}
        <section className="mb-10 grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              🔑 Authorization header
            </h3>
            <p className="text-sm text-slate-400 mb-3">
              Pass the JWT directly — no <code>Bearer</code> prefix.
            </p>
            <pre className="text-xs bg-slate-950/80 border border-slate-800 rounded-md p-3 text-emerald-300 overflow-x-auto">
{`Authorization: <token>`}
            </pre>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              📦 Response envelope
            </h3>
            <pre className="text-xs bg-slate-950/80 border border-slate-800 rounded-md p-3 text-sky-300 overflow-x-auto">
{`// success
{ "success": true, "message": "...", "data": ... }

// error
{ "success": false, "message": "...", "errors": ... }`}
            </pre>
          </div>
        </section>

        {/* Layout */}
        <div className="grid md:grid-cols-[260px_1fr] gap-6">
          {/* Sidebar */}
          <aside className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 h-fit md:sticky md:top-6">
            <h2 className="text-xs uppercase tracking-wider text-slate-500 px-2 mb-2">
              Endpoints
            </h2>
            <nav className="flex flex-col gap-1">
              {endpoints.map((e, i) => (
                <button
                  key={e.path + e.method}
                  onClick={() => setActive(i)}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition border ${
                    active === i
                      ? "bg-slate-800/80 border-slate-700 text-white"
                      : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${methodStyles[e.method]}`}
                    >
                      {e.method}
                    </span>
                    <span className="font-mono text-xs truncate">{e.path}</span>
                  </div>
                </button>
              ))}
            </nav>
          </aside>

          {/* Detail */}
          <main className="space-y-4">
            {endpoints.map((e, i) => (
              <article
                key={e.path + e.method}
                className={`rounded-xl border bg-slate-900/40 p-6 transition ${
                  active === i
                    ? "border-slate-700 shadow-lg shadow-indigo-500/5"
                    : "border-slate-800 opacity-80"
                }`}
              >
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span
                    className={`text-xs font-mono font-bold px-2 py-1 rounded border ${methodStyles[e.method]}`}
                  >
                    {e.method}
                  </span>
                  <code className="font-mono text-base text-white">{e.path}</code>
                  <span
                    className={`ml-auto text-[11px] px-2 py-1 rounded-full ${authBadge[e.auth]}`}
                  >
                    {e.auth}
                  </span>
                </div>
                <p className="text-slate-300 mb-4">{e.summary}</p>

                {e.query && <Block label="Query params" code={e.query} />}
                {e.params && <Block label="Path params" code={e.params} />}
                {e.body && <Block label="Request body" code={e.body} tone="emerald" />}
                {e.response && (
                  <Block label="Response" code={e.response} tone="sky" />
                )}
                {e.notes && (
                  <div className="mt-4 text-xs space-y-1">
                    {e.notes.map((n) => (
                      <div key={n} className="text-amber-300/90">
                        ⚠ {n}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}

            {/* Status codes */}
            <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
              <h2 className="text-white font-semibold mb-3">Status codes</h2>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                {[
                  ["200", "GET / PATCH / DELETE success"],
                  ["201", "POST success"],
                  ["400", "Validation error, duplicate resource"],
                  ["401", "Missing / invalid / expired JWT"],
                  ["403", "Valid token, wrong role or not owner"],
                  ["404", "Resource not found"],
                  ["409", "Business logic conflict"],
                  ["500", "Unexpected server error"],
                ].map(([code, desc]) => (
                  <div
                    key={code}
                    className="flex items-center gap-3 px-3 py-2 rounded-md bg-slate-950/40 border border-slate-800"
                  >
                    <code className="font-mono text-emerald-300">{code}</code>
                    <span className="text-slate-400 text-xs">{desc}</span>
                  </div>
                ))}
              </div>
            </section>
          </main>
        </div>

        <footer className="mt-12 text-center text-xs text-slate-500">
          Built with Node.js · Express · TypeScript · PostgreSQL
        </footer>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700 text-slate-300">
      {children}
    </span>
  );
}

function Block({
  label,
  code,
  tone = "slate",
}: {
  label: string;
  code: string;
  tone?: "slate" | "emerald" | "sky";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-300"
      : tone === "sky"
        ? "text-sky-300"
        : "text-slate-300";
  return (
    <div className="mb-3">
      <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </div>
      <pre
        className={`text-xs bg-slate-950/80 border border-slate-800 rounded-md p-3 overflow-x-auto font-mono ${toneClass}`}
      >
        {code}
      </pre>
    </div>
  );
}
