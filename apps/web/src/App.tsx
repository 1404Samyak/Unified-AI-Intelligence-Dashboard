import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BookOpen,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Database,
  GraduationCap,
  LibraryBig,
  Loader2,
  LogOut,
  MessageSquareText,
  RefreshCcw,
  Search,
  Send,
  Sparkles,
  Utensils,
  Wrench,
  XCircle
} from "lucide-react";
import {
  clearStoredToken,
  getDashboard,
  getHealth,
  getMe,
  getStoredToken,
  getTools,
  loginUser,
  registerUser,
  sendChat,
  setStoredToken,
  type AuthUser,
  type ChatResponse,
  type RegisterPayload,
  type RegisteredTool,
  type ToolResult
} from "./api.js";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  response?: ChatResponse;
};

type View = "overview" | "assistant" | "tools";

const domainMeta = {
  library: { label: "Library", icon: LibraryBig, color: "green" },
  cafeteria: { label: "Cafeteria", icon: Utensils, color: "amber" },
  events: { label: "Events", icon: CalendarDays, color: "rose" },
  academics: { label: "Academics", icon: GraduationCap, color: "blue" }
} as const;

const quickPrompts = [
  "Is Clean Code available and what events are happening today?",
  "What is for lunch today and do we have Jain options?",
  "Show upcoming tech workshops and the AI course syllabus.",
  "What is the attendance policy and my library fines?"
];

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<View>("overview");
  const [dashboard, setDashboard] = useState<ToolResult[]>([]);
  const [tools, setTools] = useState<RegisteredTool[]>([]);
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [model, setModel] = useState("ollama");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      text: "Campus sources are connected through independent MCP servers. Ask about books, meals, events, or academic rules."
    }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const groupedTools = useMemo(() => {
    return tools.reduce<Record<string, RegisteredTool[]>>((acc, tool) => {
      acc[tool.domain] ??= [];
      acc[tool.domain].push(tool);
      return acc;
    }, {});
  }, [tools]);

  const initials = (user?.name ?? "User")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAuthLoading(false);
      return;
    }

    getMe()
      .then((result) => setUser(result.user))
      .catch(() => {
        clearStoredToken();
        setUser(null);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    if (user) {
      void refreshAll();
    }
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function refreshAll() {
    if (!user) return;
    setRefreshing(true);
    try {
      const [health, dashboardResult, toolResult] = await Promise.all([getHealth(), getDashboard(), getTools()]);
      setModel(health.ollama?.model ?? "ollama");
      setDashboard(dashboardResult.cards);
      setTools(toolResult.tools);
      setUnavailable(toolResult.unavailableServers);
    } catch (error) {
      setUnavailable([error instanceof Error ? error.message : "Unable to reach backend"]);
    } finally {
      setRefreshing(false);
    }
  }

  async function submitPrompt(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed || loading || !user) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed
    };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await sendChat(trimmed);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: response.answer,
          response
        }
      ]);
      setUnavailable(response.unavailableServers);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: error instanceof Error ? error.message : "The assistant could not complete the request."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void submitPrompt(input);
  }

  function handleLogout() {
    clearStoredToken();
    setUser(null);
    setDashboard([]);
    setTools([]);
    setMessages([
      {
        id: "intro",
        role: "assistant",
        text: "Campus sources are connected through independent MCP servers. Ask about books, meals, events, or academic rules."
      }
    ]);
  }

  if (authLoading) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <Loader2 className="spin" size={22} />
          <h1>Loading Campus AI</h1>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        onAuthenticated={(auth) => {
          setStoredToken(auth.token);
          setUser(auth.user);
        }}
      />
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">
            <Sparkles size={21} />
          </div>
          <div>
            <h1>Campus AI</h1>
            <p>Unified dashboard</p>
          </div>
        </div>

        <nav className="nav-stack" aria-label="Primary">
          <button className={view === "overview" ? "active" : ""} onClick={() => setView("overview")}>
            <Database size={18} />
            Overview
          </button>
          <button className={view === "assistant" ? "active" : ""} onClick={() => setView("assistant")}>
            <Bot size={18} />
            Assistant
          </button>
          <button className={view === "tools" ? "active" : ""} onClick={() => setView("tools")}>
            <Wrench size={18} />
            Tools
          </button>
        </nav>

        <section className="student-panel" aria-label="Student profile">
          <div className="avatar">{initials}</div>
          <div>
            <strong>{user.name}</strong>
            <span>{user.branch ?? "Student"} · Sem {user.semester ?? "-"}</span>
          </div>
        </section>

        <button className="logout-button" onClick={handleLogout}>
          <LogOut size={16} />
          Logout
        </button>

        <section className="status-panel" aria-label="System status">
          <div className="status-line">
            <CheckCircle2 size={16} />
            <span>{tools.length} MCP tools</span>
          </div>
          <div className="status-line">
            <Bot size={16} />
            <span>{model}</span>
          </div>
          <div className={unavailable.length ? "status-line warn" : "status-line"}>
            {unavailable.length ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{unavailable.length ? `${unavailable.length} source issue` : "Sources ready"}</span>
          </div>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Live campus sources</p>
            <h2>{view === "overview" ? "Unified Intelligence Dashboard" : view === "assistant" ? "AI Assistant" : "MCP Tool Registry"}</h2>
          </div>
          <button className="icon-button" onClick={() => void refreshAll()} title="Refresh sources" aria-label="Refresh sources">
            {refreshing ? <Loader2 className="spin" size={19} /> : <RefreshCcw size={19} />}
          </button>
        </header>

        {unavailable.length > 0 && (
          <section className="alert-strip" aria-label="Unavailable sources">
            <Bell size={18} />
            <span>{unavailable.join(" | ")}</span>
          </section>
        )}

        {view === "overview" && (
          <section className="overview-grid">
            <MetricCard icon={Wrench} label="Student tools" value={tools.length.toString()} tone="blue" />
            <MetricCard icon={Database} label="MCP servers" value="4" tone="amber" />
            <MetricCard icon={Clock3} label="Fetch mode" value="Live" tone="rose" />
            <MetricCard icon={Bot} label="Model" value={model} tone="green" />
            <DashboardCards cards={dashboard} />
          </section>
        )}

        {view === "assistant" && (
          <section className="assistant-layout">
            <div className="chat-panel">
              <div className="quick-row">
                {quickPrompts.map((prompt) => (
                  <button key={prompt} onClick={() => void submitPrompt(prompt)}>
                    <MessageSquareText size={15} />
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="messages" aria-live="polite">
                {messages.map((message) => (
                  <article key={message.id} className={`message ${message.role}`}>
                    <div className="message-label">{message.role === "user" ? "You" : "Campus AI"}</div>
                    <p>{message.text}</p>
                    {message.response && <ToolTrace response={message.response} />}
                  </article>
                ))}
                {loading && (
                  <article className="message assistant">
                    <div className="message-label">Campus AI</div>
                    <p className="loading-line">
                      <Loader2 className="spin" size={16} />
                      Querying campus tools
                    </p>
                  </article>
                )}
                <div ref={chatEndRef} />
              </div>

              <form className="composer" onSubmit={handleSubmit}>
                <Search size={18} />
                <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask across library, cafeteria, events, or academics" />
                <button className="send-button" type="submit" disabled={loading || !input.trim()} title="Send" aria-label="Send">
                  <Send size={18} />
                </button>
              </form>
            </div>

            <SourceRail tools={tools} />
          </section>
        )}

        {view === "tools" && <ToolsExplorer groupedTools={groupedTools} />}
      </section>
    </main>
  );
}

function MetricCard({ icon: Icon, label, value, tone }: { icon: typeof Wrench; label: string; value: string; tone: string }) {
  return (
    <article className={`metric-card ${tone}`}>
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function DashboardCards({ cards }: { cards: ToolResult[] }) {
  if (!cards.length) {
    return <div className="empty-state">Start the backend and MCP servers to load source cards.</div>;
  }

  return (
    <section className="source-grid">
      {cards.map((card) => {
        const meta = domainMeta[card.domain];
        const Icon = meta.icon;
        return (
          <article className={`source-card ${meta.color}`} key={card.qualifiedName}>
            <div className="source-card-head">
              <Icon size={19} />
              <div>
                <strong>{meta.label}</strong>
                <span>{card.toolName}</span>
              </div>
            </div>
            <SourcePreview result={card} />
          </article>
        );
      })}
    </section>
  );
}

function SourcePreview({ result }: { result: ToolResult }) {
  if (!result.ok) return <p className="muted">{result.error}</p>;
  const data = result.data as Record<string, unknown> | undefined;

  if (result.domain === "library" && Array.isArray(data?.books)) {
    return (
      <ul className="compact-list">
        {data.books.slice(0, 3).map((book) => {
          const item = book as { id?: string; title?: string; availability?: { availableCopies?: number } };
          return <li key={item.id}>{item.title} <span>{item.availability?.availableCopies ?? 0} available</span></li>;
        })}
      </ul>
    );
  }

  if (result.domain === "events" && Array.isArray(data?.events)) {
    return (
      <ul className="compact-list">
        {data.events.slice(0, 3).map((event) => {
          const item = event as { id?: string; title?: string; venue?: string };
          return <li key={item.id}>{item.title} <span>{item.venue}</span></li>;
        })}
      </ul>
    );
  }

  if (result.domain === "cafeteria" && data?.menu && typeof data.menu === "object") {
    const menu = data.menu as { lunch?: Array<{ id?: string; name?: string }>; specials?: Array<{ id?: string; name?: string }> };
    return (
      <ul className="compact-list">
        {[...(menu.lunch ?? []), ...(menu.specials ?? [])].slice(0, 4).map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    );
  }

  if (result.domain === "academics" && Array.isArray(data?.notices)) {
    return (
      <ul className="compact-list">
        {data.notices.slice(0, 3).map((notice) => {
          const item = notice as { id?: string; title?: string; department?: string };
          return <li key={item.id}>{item.title} <span>{item.department}</span></li>;
        })}
      </ul>
    );
  }

  return <pre className="json-preview">{JSON.stringify(data, null, 2).slice(0, 380)}</pre>;
}

function ToolTrace({ response }: { response: ChatResponse }) {
  const successfulDomains = Array.from(new Set(response.toolResults.filter((result) => result.ok).map((result) => result.domain)));
  const failedCount = response.toolResults.filter((result) => !result.ok).length;

  return (
    <div className="trace">
      <div className="trace-row">
        <span>Campus source check complete</span>
        <span>{successfulDomains.length} source{successfulDomains.length === 1 ? "" : "s"}</span>
      </div>
      <div className="trace-tools">
        {successfulDomains.map((domain) => {
          const meta = domainMeta[domain];
          return (
            <span className={`tool-pill ${meta.color}`} key={domain}>
              <CheckCircle2 size={13} />
              {meta.label}
            </span>
          );
        })}
        {failedCount > 0 && (
          <span className="tool-pill muted-pill">
            <XCircle size={13} />
            {failedCount} unavailable
          </span>
        )}
      </div>
    </div>
  );
}

function SourceRail({ tools }: { tools: RegisteredTool[] }) {
  const counts = tools.reduce<Record<string, number>>((acc, tool) => {
    acc[tool.domain] = (acc[tool.domain] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <aside className="source-rail">
      {Object.entries(domainMeta).map(([domain, meta]) => {
        const Icon = meta.icon;
        return (
          <article className={`rail-item ${meta.color}`} key={domain}>
            <Icon size={20} />
            <strong>{meta.label}</strong>
            <span>{counts[domain] ?? 0} tools</span>
          </article>
        );
      })}
    </aside>
  );
}

function ToolsExplorer({ groupedTools }: { groupedTools: Record<string, RegisteredTool[]> }) {
  return (
    <section className="tools-layout">
      <div className="tool-columns">
        {Object.entries(groupedTools).map(([domain, domainTools]) => {
          const meta = domainMeta[domain as keyof typeof domainMeta];
          const Icon = meta.icon;
          return (
            <section className="tool-column" key={domain}>
              <div className="tool-column-head">
                <Icon size={18} />
                <strong>{meta.label}</strong>
                <span>{domainTools.length}</span>
              </div>
              <div className="tool-list">
                {domainTools.map((tool) => (
                  <article className="tool-row" key={tool.qualifiedName}>
                    <BookOpen size={15} />
                    <div>
                      <strong>{tool.name}</strong>
                      <p>{tool.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (auth: { user: AuthUser; token: string }) => void }) {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    yearOfStudy: "1",
    branch: "",
    semester: "1",
    enrollmentNumber: ""
  });

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "login") {
        const auth = await loginUser({ email: form.email, password: form.password });
        onAuthenticated(auth);
        return;
      }

      const payload: RegisterPayload = {
        role: "student",
        name: form.name,
        email: form.email,
        password: form.password,
        yearOfStudy: Number(form.yearOfStudy),
        branch: form.branch,
        semester: Number(form.semester) as 1 | 2,
        enrollmentNumber: form.enrollmentNumber
      };

      const auth = await registerUser(payload);
      onAuthenticated(auth);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-block auth-brand">
          <div className="brand-mark">
            <Sparkles size={21} />
          </div>
          <div>
            <h1>Campus AI</h1>
            <p>Unified dashboard</p>
          </div>
        </div>

        <div className="segmented auth-tabs" role="tablist" aria-label="Authentication mode">
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")} type="button">
            Register
          </button>
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")} type="button">
            Login
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label>
              Name
              <input value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
            </label>
          )}

          <label>
            Email
            <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} required />
          </label>

          <label>
            Password
            <input type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} minLength={6} required />
          </label>

          {mode === "register" && (
            <>
              <div className="form-grid">
                <label>
                  Year
                  <input type="number" min="1" max="5" value={form.yearOfStudy} onChange={(event) => updateField("yearOfStudy", event.target.value)} required />
                </label>
                <label>
                  Semester
                  <select value={form.semester} onChange={(event) => updateField("semester", event.target.value)} required>
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </select>
                </label>
              </div>
              <label>
                Branch
                <input value={form.branch} onChange={(event) => updateField("branch", event.target.value)} required />
              </label>
              <label>
                Enrollment number
                <input value={form.enrollmentNumber} onChange={(event) => updateField("enrollmentNumber", event.target.value)} required />
              </label>
            </>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? <Loader2 className="spin" size={17} /> : mode === "register" ? "Create account" : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default App;
