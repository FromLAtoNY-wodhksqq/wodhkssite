"use client";

import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./theme-toggle";

type ConversationSummary = {
  id: string;
  title: string;
  createdAt: string;
};

export function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNewChat,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}) {
  const { data: session } = useSession();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-zinc-200/70 bg-zinc-50/70 backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-950/70">
      <div className="flex items-center justify-between px-4 py-4">
        <span className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          mcp-host
        </span>
        <ThemeToggle />
      </div>

      <div className="px-3">
        <button
          onClick={onNewChat}
          className="flex w-full items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[13px] font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-[14px]"
          >
            <path d="M12 4.5a.75.75 0 0 1 .75.75v6h6a.75.75 0 0 1 0 1.5h-6v6a.75.75 0 0 1-1.5 0v-6h-6a.75.75 0 0 1 0-1.5h6v-6A.75.75 0 0 1 12 4.5Z" />
          </svg>
          새 대화
        </button>
      </div>

      <nav className="mt-3 flex-1 space-y-0.5 overflow-y-auto px-3">
        {conversations.length === 0 && (
          <p className="px-2 py-4 text-center text-[12px] text-zinc-400 dark:text-zinc-600">
            대화 내역이 없습니다
          </p>
        )}
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`block w-full truncate rounded-lg px-2.5 py-2 text-left text-[13px] transition ${
              c.id === activeId
                ? "bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
                : "text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-800/60"
            }`}
          >
            {c.title || "새 대화"}
          </button>
        ))}
      </nav>

      <div className="flex items-center justify-between border-t border-zinc-200/70 px-4 py-3 dark:border-zinc-800/70">
        <span className="truncate text-[12px] text-zinc-500 dark:text-zinc-400">
          {session?.user?.email}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="shrink-0 text-[12px] text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          로그아웃
        </button>
      </div>
    </aside>
  );
}
