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
  MessageSquareText,
  RefreshCcw,
  Search,
  Send,
  Shield,
  Sparkles,
  Utensils,
  Wrench,
  XCircle
} from "lucide-react";
import { getDashboard, getHealth, getTools, sendChat, type ChatResponse, type RegisteredTool, type ToolResult } from "./api.js";

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

const isAdminTool = (name: string) =>
  /^(create|update|delete|mark|cancel_book_reservation|renew_book|reserve_book|register_for_event|cancel_event_registration|rate_food_item|submit_menu_feedback)/.test(name);

function App() {
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

  const adminCount = tools.filter((tool) => isAdminTool(tool.name)).length;
  const studentCount = tools.length - adminCount;

  useEffect(() => {
    void refreshAll();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function refreshAll() {
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
    if (!trimmed || loading) return;

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
          <div className="avatar">AS</div>
          <div>
            <strong>Aarav Sharma</strong>
            <span>CSE, Semester 5</span>
          </div>
        </section>

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
            <MetricCard icon={Wrench} label="Student tools" value={studentCount.toString()} tone="blue" />
            <MetricCard icon={Shield} label="Admin tools" value={adminCount.toString()} tone="green" />
            <MetricCard icon={Database} label="MCP servers" value="4" tone="amber" />
            <MetricCard icon={Clock3} label="Fetch mode" value="Live" tone="rose" />
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
  return (
    <div className="trace">
      <div className="trace-row">
        <span>{response.usedOllama ? "Ollama planned" : "Fallback planned"}</span>
        <span>{response.toolResults.length} calls</span>
      </div>
      <div className="trace-tools">
        {response.toolResults.map((result) => {
          const meta = domainMeta[result.domain];
          return (
            <span className={`tool-pill ${meta.color}`} key={`${result.qualifiedName}-${JSON.stringify(result.arguments)}`}>
              {result.ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
              {result.qualifiedName}
            </span>
          );
        })}
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
  const [mode, setMode] = useState<"all" | "student" | "admin">("all");

  return (
    <section className="tools-layout">
      <div className="segmented" role="tablist" aria-label="Tool filter">
        {(["all", "student", "admin"] as const).map((item) => (
          <button className={mode === item ? "active" : ""} key={item} onClick={() => setMode(item)}>
            {item}
          </button>
        ))}
      </div>

      <div className="tool-columns">
        {Object.entries(groupedTools).map(([domain, domainTools]) => {
          const meta = domainMeta[domain as keyof typeof domainMeta];
          const Icon = meta.icon;
          const filtered = domainTools.filter((tool) => {
            if (mode === "all") return true;
            return mode === "admin" ? isAdminTool(tool.name) : !isAdminTool(tool.name);
          });
          return (
            <section className="tool-column" key={domain}>
              <div className="tool-column-head">
                <Icon size={18} />
                <strong>{meta.label}</strong>
                <span>{filtered.length}</span>
              </div>
              <div className="tool-list">
                {filtered.map((tool) => (
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

export default App;
