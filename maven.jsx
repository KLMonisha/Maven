import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";

const SYSTEM_PROMPT = `You are Maven — a sharp, no-BS business mentor built exclusively for freelancers who are serious about growing their income. You are not a general-purpose AI. You do not help with things outside of freelance business growth. You are the mentor your user wishes they had when they started.

Your one job: help freelancers go from where they are now to 10k+ months — through better positioning, pricing, client acquisition, proposals, retention, and business decisions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TONE & PERSONALITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Direct and confident. You say what needs to be said, even if it's uncomfortable.
- Warm but not sycophantic. Never say "great question!" or "absolutely!" — just answer.
- Conversational and human. Short paragraphs. Real talk. No corporate speak.
- Occasionally blunt. If someone is undercharging badly, say so plainly.
- Encouraging without being fake. You believe in the user's potential but you don't blow smoke.
- Use light humour when it fits, never when the user is stressed or venting.
- Never open two consecutive responses with a positive affirmation of what the user just said.
- Never tell the user you're asking multiple questions and then ask only one.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ONBOARDING (first conversation only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When a user first messages you, before anything else, run a quick onboarding. Ask these questions ONE AT A TIME — not all at once. Wait for each answer before asking the next. Keep the tone casual and curious, not like a form.

1. "What kind of freelance work do you do? (e.g. copywriting, web dev, design, video editing, consulting — whatever it is)"
2. "Roughly how much are you making from it per month right now? Ballpark is totally fine."
3. "What's your income goal — what would hitting that number actually mean for your life?"
4. "What feels like your biggest blocker right now? Getting clients, pricing, inconsistent work — what's most in the way?"
5. "Last one: how long have you been freelancing?"

After all 5 answers, give a brief personalised diagnosis (3–4 sentences) of where they are and what you'll focus on together. Then ask what they want to work on first, OR offer 2–3 concrete starting points based on their answers. Be opinionated — give a recommendation, don't just list options neutrally.

Store everything they tell you. Reference it throughout the conversation. Never make them repeat themselves.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE KNOWLEDGE BASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRICING & RATES
- Value-based pricing vs hourly vs project-based — when to use each
- How to calculate a minimum viable rate (expenses + profit goal ÷ billable hours)
- How to raise rates with existing clients without losing them
- Anchoring, packaging, and tiered offers
- When and how to quote confidently without caving under pressure

CLIENT ACQUISITION
- Cold outreach that actually works (personalised, specific, short)
- Warm referral systems — how to turn one client into three
- Portfolio and positioning on LinkedIn or relevant platforms
- Niche positioning: why "I do everything" kills revenue
- Inbound through content without needing a huge audience

PROPOSALS & SALES
- Writing proposals that close (structure, framing, specificity)
- Discovery calls — the questions that reveal budget and urgency
- Handling "can you do it cheaper?" without immediately discounting
- Reading buying signals and knowing when to follow up

CLIENT MANAGEMENT & RETENTION
- Scope creep: how to spot it early and handle it professionally
- Setting expectations at project start to avoid problems later
- Turning one-off clients into retainer clients
- Handling difficult clients, late payers, and red flags
- Offboarding well so clients refer you

BUSINESS FOUNDATIONS
- When to move from generalist to specialist
- Tracking income, expenses, and profitability simply
- Managing feast-or-famine with a pipeline mindset
- Simple goal-setting: monthly revenue targets broken into weekly actions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO RESPOND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GIVE SPECIFICS, NOT GENERICS.
Bad: "You should raise your rates."
Good: "Based on what you've told me — you're charging X for branding work with 3 years experience — you're probably 30–40% below market. Here's exactly how I'd raise it with your next client..."

WHEN SOMEONE ASKS FOR A TEMPLATE OR SCRIPT, WRITE IT.
Don't describe what a good proposal looks like. Write the actual proposal. Don't explain what a cold email should contain — write the cold email with their context filled in.

ASK ONE FOLLOW-UP WHEN YOU NEED CONTEXT.
If the question is vague, ask the one thing that would most change your answer — not a list of clarifying questions.

KEEP RESPONSES FOCUSED.
- Simple questions: 3–6 sentences max.
- Tactical advice: clear numbered steps if more than 3.
- Templates/scripts: write them, minimal preamble.
- Avoid headers unless the response is genuinely long and structured.
- Default response length is concise. Go longer only for templates or step-by-step plans.

CURRENCY AWARENESS.
If the user mentions a currency or location, use that currency for all numbers going forward. Don't switch back to dollars.

OUT OF SCOPE.
You don't do tax advice, legal advice, mental health support, or general life coaching. If it comes up: "That's outside what I'm built for — I'd talk to [relevant professional] about that. What I can help with is [bring back to freelance business]."

If the user tries to use you for anything unrelated (writing a poem, coding help, general questions), redirect warmly: "I'm built specifically for freelance business growth — that's where I can actually move the needle for you. Anything on the business side you want to dig into?"`;

// ─── helpers ───────────────────────────────
async function callGroq(messages) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.body;
}

async function* streamReader(body) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop();
    for (const line of lines) {
      const trimmed = line.replace(/^data: /, "").trim();
      if (!trimmed || trimmed === "[DONE]") continue;
      try {
        const json = JSON.parse(trimmed);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch { }
    }
  }
}

// ─── styles ────────────────────────────────
const G = {
  bg: "#0c0c0c",
  surface: "#141414",
  surfaceHi: "#1c1c1c",
  border: "#252525",
  borderHi: "#363636",
  accent: "#d4ff4e",
  accentDim: "#a8cc3a",
  text: "#eeebe3",
  muted: "#636363",
  mutedHi: "#8a8a8a",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Syne:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: ${G.bg};
    color: ${G.text};
    font-family: 'Syne', sans-serif;
    -webkit-font-smoothing: antialiased;
    height: 100vh;
    overflow: hidden;
  }

  body::after {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 9999;
    opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 180px;
  }

  #root { height: 100vh; }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${G.border}; border-radius: 2px; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; box-shadow: 0 0 6px ${G.accent}; }
    50%       { opacity: 0.5; box-shadow: 0 0 2px ${G.accent}; }
  }
  @keyframes blink {
    0%, 80%, 100% { transform: scale(1); opacity: 0.4; }
    40%           { transform: scale(1.3); opacity: 1; }
  }
  @keyframes ripple {
    0%   { transform: scale(1); opacity: 1; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  .fade-up  { animation: fadeUp 0.35s ease both; }
  .fade-in  { animation: fadeIn 0.4s ease both; }

  /* ── markdown inside chat bubbles ── */
  .fade-up p { margin: 0 0 0.6em; }
  .fade-up p:last-child { margin-bottom: 0; }
  .fade-up ul, .fade-up ol { margin: 0.4em 0 0.6em 1.4em; padding: 0; }
  .fade-up li { margin-bottom: 0.25em; }
  .fade-up strong { color: ${G.accent}; font-weight: 600; }
  .fade-up em { font-style: italic; color: ${G.mutedHi}; }
  .fade-up code {
    font-family: 'DM Mono', monospace;
    font-size: 0.88em;
    background: rgba(255,255,255,0.06);
    padding: 1px 5px;
    border-radius: 4px;
    border: 1px solid ${G.border};
  }
  .fade-up pre {
    background: ${G.bg};
    border: 1px solid ${G.border};
    border-radius: 6px;
    padding: 12px 14px;
    overflow-x: auto;
    margin: 0.5em 0;
  }
  .fade-up pre code { background: none; border: none; padding: 0; }
  .fade-up hr {
    border: none;
    border-top: 1px solid ${G.border};
    margin: 0.8em 0;
  }
  .fade-up h1, .fade-up h2, .fade-up h3 {
    font-family: 'Instrument Serif', serif;
    font-weight: 400;
    margin: 0.6em 0 0.3em;
    color: ${G.text};
  }
`;

// ─── sub-components ────────────────────────

function TypingIndicator() {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5,
      padding: "14px 18px",
      background: G.surface,
      border: `1px solid ${G.border}`,
      borderLeft: `3px solid ${G.accent}`,
      borderRadius: "3px 10px 10px 10px",
      alignSelf: "flex-start",
      animation: "fadeUp 0.3s ease both",
    }}>
      {[0, 0.18, 0.36].map((d, i) => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: G.mutedHi,
          display: "inline-block",
          animation: `blink 1.1s ${d}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

function MicButton({ listening, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={listening ? "Stop recording" : "Speak your message"}
      style={{
        width: 38, height: 38,
        borderRadius: 8,
        border: `1px solid ${listening ? G.accent : G.border}`,
        background: listening ? `rgba(212,255,78,0.12)` : G.surfaceHi,
        color: listening ? G.accent : G.mutedHi,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        position: "relative",
        transition: "all 0.18s",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {listening && (
        <span style={{
          position: "absolute", inset: 0, borderRadius: 8,
          border: `1px solid ${G.accent}`,
          animation: "ripple 1.2s ease-out infinite",
          pointerEvents: "none",
        }} />
      )}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
      </svg>
    </button>
  );
}

function SendButton({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title="Send message"
      style={{
        width: 38, height: 38,
        borderRadius: 8,
        border: "none",
        background: disabled ? G.border : G.accent,
        color: disabled ? G.muted : "#0c0c0c",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        transition: "all 0.18s",
        transform: disabled ? "none" : undefined,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </svg>
    </button>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className="fade-up" style={{
      display: "flex", flexDirection: "column",
      alignItems: isUser ? "flex-end" : "flex-start",
      gap: 5,
    }}>
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color: isUser ? G.mutedHi : G.muted,
        paddingInline: 4,
      }}>
        {isUser ? "You" : "Maven"}
      </span>
      <div style={{
        padding: "13px 17px",
        borderRadius: isUser ? "10px 3px 10px 10px" : "3px 10px 10px 10px",
        background: isUser ? G.surfaceHi : G.surface,
        border: `1px solid ${isUser ? G.borderHi : G.border}`,
        borderLeft: isUser ? undefined : `3px solid ${G.accent}`,
        fontSize: 15,
        lineHeight: 1.68,
        maxWidth: "86%",
        wordBreak: "break-word",
        color: G.text,
      }}>
        <ReactMarkdown>{msg.content}</ReactMarkdown>
      </div>
    </div>
  );
}

function Welcome({ onStart }) {
  return (
    <div className="fade-up" style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 24px", textAlign: "center", gap: 14,
    }}>
      <div style={{
        fontFamily: "'Instrument Serif', serif",
        fontStyle: "italic",
        fontSize: 56,
        color: G.accent,
        lineHeight: 1,
        marginBottom: 4,
      }}>M</div>

      <h1 style={{
        fontFamily: "'Instrument Serif', serif",
        fontStyle: "italic",
        fontSize: 28,
        fontWeight: 400,
        color: G.text,
        letterSpacing: "-0.4px",
      }}>
        Meet Maven
      </h1>

      <p style={{
        fontSize: 14,
        color: G.mutedHi,
        maxWidth: 320,
        lineHeight: 1.65,
      }}>
        A no-BS business mentor built for freelancers serious about growing their income.
      </p>

      <button
        onClick={onStart}
        style={{
          marginTop: 10,
          background: G.accent,
          color: "#0c0c0c",
          border: "none",
          padding: "13px 34px",
          borderRadius: 10,
          fontFamily: "'Syne', sans-serif",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          letterSpacing: "0.02em",
          transition: "all 0.18s",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = `0 8px 28px rgba(212,255,78,0.28)`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        Start session →
      </button>

      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 11,
        color: G.muted,
        letterSpacing: "0.03em",
        marginTop: 4,
      }}>
        No account needed · Early access
      </span>
    </div>
  );
}

// ─── main app ──────────────────────────────
export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceAvail, setVoiceAvail] = useState(false);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const recognRef = useRef(null);

  // check voice support
  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceAvail(!!SpeechRec);
  }, []);

  // scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // auto-resize textarea
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      Math.min(textareaRef.current.scrollHeight, 140) + "px";
  }, [input]);

  const send = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: "user", content: trimmed };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);

    try {
      const body = await callGroq(history);
      let reply = "";
      const id = Date.now();

      // add empty assistant message to stream into
      setMessages(prev => [...prev, { role: "assistant", content: "", id }]);

      for await (const chunk of streamReader(body)) {
        reply += chunk;
        setMessages(prev =>
          prev.map(m => m.id === id ? { ...m, content: reply } : m)
        );
      }

      // clean up the id field after streaming
      setMessages(prev =>
        prev.map(m => m.id === id ? { role: "assistant", content: reply } : m)
      );
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong connecting to the API. Check your Groq key and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, messages, loading]);

  const handleStart = useCallback(async () => {
    setStarted(true);
    setLoading(true);
    try {
      const body = await callGroq([{ role: "user", content: "hi" }]);
      let reply = "";
      const id = Date.now();
      setMessages([{ role: "assistant", content: "", id }]);
      for await (const chunk of streamReader(body)) {
        reply += chunk;
        setMessages([{ role: "assistant", content: reply, id }]);
      }
      setMessages([{ role: "assistant", content: reply }]);
    } catch {
      setMessages([{
        role: "assistant",
        content: "Couldn't connect. Double-check your Groq API key at the top of the file.",
      }]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleKey = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }, [send]);

  const toggleVoice = useCallback(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    if (listening) {
      recognRef.current?.stop();
      recognRef.current = null;
      setListening(false);
      // send whatever has been transcribed so far
      if (input.trim()) {
        setTimeout(() => send(input), 100);
      }
      return;
    }

    const rec = new SpeechRec();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = true;

    rec.onstart = () => setListening(true);
    rec.onend = () => {
      // auto-restart if still listening (handles browser timeouts / pauses)
      if (recognRef.current) {
        try { rec.start(); } catch {}
      } else {
        setListening(false);
      }
    };
    rec.onerror = (e) => {
      if (e.error !== "no-speech") {
        recognRef.current = null;
        setListening(false);
      }
    };

    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join("");
      setInput(transcript);
    };

    recognRef.current = rec;
    rec.start();
  }, [listening, send, input]);

  return (
    <>
      <style>{css}</style>
      <div style={{
        display: "flex", flexDirection: "column",
        height: "100vh",
        maxWidth: 780,
        margin: "0 auto",
      }}>

        {/* ── header ── */}
        <header style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: `1px solid ${G.border}`,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{
              fontFamily: "'Instrument Serif', serif",
              fontStyle: "italic",
              fontSize: 22,
              color: G.text,
              letterSpacing: "-0.2px",
            }}>Maven</span>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: G.accent,
              background: "rgba(212,255,78,0.08)",
              border: `1px solid rgba(212,255,78,0.2)`,
              padding: "2px 8px",
              borderRadius: 20,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}>Beta</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: G.accent,
              display: "inline-block",
              animation: "pulse 2.5s ease-in-out infinite",
            }} />
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: G.muted,
              letterSpacing: "0.04em",
            }}>Freelance mentor · Beta</span>
          </div>
        </header>

        {/* ── messages or welcome ── */}
        {!started ? (
          <Welcome onStart={handleStart} />
        ) : (
          <div style={{
            flex: 1, overflowY: "auto",
            padding: "24px 24px 8px",
            display: "flex", flexDirection: "column", gap: 18,
          }}>
            {messages.map((m, i) => (
              <Message key={i} msg={{ role: m.role === "assistant" ? "assistant" : "user", content: m.content }} />
            ))}
            {loading && messages.length === 0 && <TypingIndicator />}
            {loading && messages.length > 0 && !messages[messages.length - 1].content && (
              <TypingIndicator />
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* ── input area ── */}
        {started && (
          <div style={{
            padding: "12px 24px 20px",
            borderTop: `1px solid ${G.border}`,
            flexShrink: 0,
          }}>
            {listening && (
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                marginBottom: 8,
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: G.accent,
                letterSpacing: "0.04em",
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: G.accent,
                  animation: "pulse 0.8s ease-in-out infinite",
                  display: "inline-block",
                }} />
                Listening...
              </div>
            )}

            <div style={{
              display: "flex", alignItems: "flex-end", gap: 8,
              background: G.surface,
              border: `1px solid ${G.border}`,
              borderRadius: 12,
              padding: "10px 12px",
              transition: "border-color 0.2s",
            }}
              onFocus={() => { }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask Maven anything about your freelance business..."
                rows={1}
                disabled={loading}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: G.text,
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 15,
                  lineHeight: 1.55,
                  resize: "none",
                  minHeight: 24,
                  maxHeight: 140,
                  overflowY: "auto",
                  padding: "2px 0",
                  caretColor: G.accent,
                  opacity: loading ? 0.5 : 1,
                }}
              />

              {voiceAvail && (
                <MicButton
                  listening={listening}
                  onClick={toggleVoice}
                  disabled={loading}
                />
              )}
              <SendButton
                onClick={() => send()}
                disabled={!input.trim() || loading}
              />
            </div>

            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: G.muted,
              letterSpacing: "0.03em",
              textAlign: "center",
              marginTop: 10,
            }}>
              Enter to send · Shift+Enter for new line{voiceAvail ? " · Mic for voice" : ""}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
