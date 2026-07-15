"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

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
    <div className="flex h-dvh flex-col bg-zinc-50 dark:bg-black">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between p-4 text-sm text-zinc-600 dark:text-zinc-400">
        <span>{session?.user?.email}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-zinc-500 hover:underline dark:text-zinc-400"
        >
          로그아웃
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-2xl px-4 py-2 whitespace-pre-wrap ${
              m.role === "user"
                ? "self-end bg-blue-600 text-white"
                : "self-start bg-zinc-200 text-black dark:bg-zinc-800 dark:text-zinc-50"
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
        className="mx-auto flex w-full max-w-2xl gap-2 p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요"
          className="flex-1 rounded-full border border-zinc-300 bg-white px-4 py-2 text-black outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-blue-600 px-5 py-2 font-medium text-white disabled:opacity-50"
        >
          전송
        </button>
      </form>
    </div>
  );
}
