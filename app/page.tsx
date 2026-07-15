"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./theme-toggle";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  async function sendMessage() {
    const text = input.trim();
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
  }

  return (
    <div className="flex h-dvh flex-col bg-white dark:bg-black">
      <nav className="sticky top-0 z-10 border-b border-zinc-200/70 bg-white/70 backdrop-blur-xl dark:border-zinc-800/70 dark:bg-black/70">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-3">
          <span className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            mcp-host
          </span>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="hidden text-[13px] text-zinc-500 dark:text-zinc-400 sm:inline">
              {session?.user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-[13px] text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              로그아웃
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-[17px] font-medium text-zinc-400 dark:text-zinc-600">
              무엇을 도와드릴까요?
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-[20px] px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap ${
              m.role === "user"
                ? "self-end bg-blue-500 text-white"
                : "self-start bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50"
            }`}
          >
            {m.content}
          </div>
        ))}
      </main>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="border-t border-zinc-200/70 bg-white/70 backdrop-blur-xl dark:border-zinc-800/70 dark:bg-black/70"
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
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white transition hover:bg-blue-600 disabled:opacity-40"
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
  );
}
