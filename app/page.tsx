"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ConversationSummary = {
  id: string;
  title: string;
  createdAt: string;
};

const SUGGESTIONS = ["오늘 뭐 하면 좋을까?", "코드 리뷰 도와줘", "짧은 글 하나 써줘"];

function AssistantAvatar() {
  return (
    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 via-purple-500 to-blue-500 shadow-sm">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-[14px] text-white"
      >
        <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.035-.259a3.375 3.375 0 0 0 2.456-2.455L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 rounded-[20px] bg-zinc-100 px-4 py-3 dark:bg-zinc-900">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-600"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);

  async function fetchConversations() {
    const res = await fetch("/api/conversations");
    if (res.ok) setConversations(await res.json());
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on mount, not a sync setState
    fetchConversations();
  }, []);

  async function loadConversation(id: string) {
    if (id === conversationId || loading) return;
    const res = await fetch(`/api/conversations/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setConversationId(data.id);
    setMessages(
      data.messages.map((m: { role: Message["role"]; content: string }) => ({
        role: m.role,
        content: m.content,
      }))
    );
  }

  function newChat() {
    setConversationId(null);
    setMessages([]);
    setInput("");
  }

  async function sendMessage(text: string) {
    if (!text || loading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: nextMessages, conversationId }),
    });

    const returnedId = res.headers.get("X-Conversation-Id");
    const isNewConversation = returnedId && returnedId !== conversationId;
    if (returnedId) setConversationId(returnedId);

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      }
    }

    setLoading(false);
    if (isNewConversation) fetchConversations();
  }

  const lastMessage = messages[messages.length - 1];
  const isAwaitingFirstToken =
    loading && lastMessage?.role === "assistant" && lastMessage.content === "";

  return (
    <div className="flex h-dvh">
      <Sidebar
        conversations={conversations}
        activeId={conversationId}
        onSelect={loadConversation}
        onNewChat={newChat}
      />

      <div className="relative flex flex-1 flex-col overflow-hidden bg-white dark:bg-black">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-24 size-96 rounded-full bg-blue-400/25 blur-[100px] dark:bg-blue-500/15" />
          <div className="absolute top-1/3 -right-24 size-96 rounded-full bg-fuchsia-400/20 blur-[100px] dark:bg-fuchsia-500/10" />
          <div className="absolute bottom-0 left-1/4 size-96 rounded-full bg-purple-300/20 blur-[100px] dark:bg-purple-500/10" />
        </div>

        <main className="relative z-0 mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 overflow-y-auto px-4 py-6">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-6">
              <p className="bg-gradient-to-br from-fuchsia-500 via-purple-500 to-blue-500 bg-clip-text text-[22px] font-semibold text-transparent">
                무엇을 도와드릴까요?
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="rounded-full border border-zinc-200 bg-white/80 px-4 py-2 text-[13px] text-zinc-600 shadow-sm backdrop-blur-xl transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) =>
            m.role === "assistant" ? (
              <div key={i} className="flex items-end gap-2 self-start">
                <AssistantAvatar />
                {isAwaitingFirstToken && i === messages.length - 1 ? (
                  <TypingDots />
                ) : (
                  <div className="max-w-[80%] rounded-[20px] bg-zinc-100 px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50">
                    {m.content}
                  </div>
                )}
              </div>
            ) : (
              <div
                key={i}
                className="max-w-[80%] self-end rounded-[20px] bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap text-white shadow-sm"
              >
                {m.content}
              </div>
            )
          )}
        </main>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input.trim());
          }}
          className="relative z-10 border-t border-zinc-200/70 bg-white/70 backdrop-blur-xl dark:border-zinc-800/70 dark:bg-black/70"
        >
          <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-4 py-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="메시지를 입력하세요"
              className="flex-1 rounded-full border border-zinc-200 bg-zinc-100 px-4 py-2.5 text-[15px] text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:bg-black"
            />
            <button
              type="submit"
              disabled={loading}
              aria-label="전송"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-sm transition hover:brightness-110 disabled:opacity-40"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-[16px]"
              >
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
