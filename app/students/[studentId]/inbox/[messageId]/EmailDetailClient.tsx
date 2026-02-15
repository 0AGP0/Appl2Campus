"use client";

import { useState } from "react";
import Link from "next/link";
import { ComposeModal } from "@/components/ComposeModal";

type AttachmentMeta = {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
};

type Message = {
  id: string;
  gmailMessageId: string;
  threadId: string;
  from: string | null;
  to: string | null;
  cc: string | null;
  subject: string | null;
  snippet: string | null;
  bodyHtml: string | null;
  internalDate: Date | null;
  attachments?: AttachmentMeta[];
};

type StageItem = { slug: string; name: string };

export function EmailDetailClient({
  studentId,
  studentStage,
  gmailAddress,
  message,
  thread,
  stages,
}: {
  studentId: string;
  studentStage: string;
  gmailAddress: string;
  message: Message;
  thread: Message[];
  stages: StageItem[];
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);

  async function sendReply() {
    if (!message.from) return;
    const to = message.from.replace(/^.*<([^>]+)>$/, "$1").trim() || message.from;
    setSending(true);
    const html = replyBody?.trim() ? replyBody : "<p>(No content)</p>";
    const res = await fetch(`/api/students/${studentId}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        subject: message.subject?.startsWith("Re:") ? message.subject : `Re: ${message.subject ?? ""}`,
        html,
      }),
    });
    if (res.ok) {
      setReplyOpen(false);
      setReplyBody("");
      window.location.reload();
    } else {
      const data = await res.json();
      alert(data.error ?? "Gönderilemedi");
    }
    setSending(false);
  }

  const stageName = stages.find((s) => s.slug === studentStage)?.name ?? studentStage;

  return (
    <main className="flex-1 flex flex-col sm:flex-row overflow-hidden min-h-0">
      {/* Sidebar: hidden on mobile (back is in page header) */}
      <aside className="hidden sm:flex w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-col shrink-0">
        <div className="p-4">
          <Link
            href={`/students/${studentId}/inbox`}
            className="w-full bg-primary/10 text-primary font-medium py-3 rounded-xl flex items-center justify-center gap-2 border border-primary/20"
          >
            <span className="material-icons-outlined text-sm">inbox</span>
            Gelen kutusuna dön
          </Link>
        </div>
      </aside>

      <section className="flex-1 bg-white dark:bg-slate-900 flex flex-col overflow-hidden min-w-0">
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mevcut aşama</span>
            <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
              {stageName}
            </span>
            <Link
              href="/students"
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              Aşama öğrenci listesi tablosundan değiştirilir
              <span className="material-icons-outlined text-sm">open_in_new</span>
            </Link>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 break-words">
              {message.subject ?? "(Konu yok)"}
            </h1>
            {thread.map((m) => (
              <div
                key={m.id}
                className="mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-slate-100 dark:border-slate-800"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3 sm:mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg sm:text-xl shrink-0">
                      {(m.from ?? "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">
                        {m.from ?? "Bilinmiyor"}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-500 truncate">
                        Alıcı: {m.to ?? "—"}
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-xs sm:text-sm text-slate-500">
                      {m.internalDate
                        ? new Date(m.internalDate).toLocaleString()
                        : ""}
                    </p>
                  </div>
                </div>
                <div
                  className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300"
                  dangerouslySetInnerHTML={{
                    __html: m.bodyHtml ?? `<p>${m.snippet ?? ""}</p>`,
                  }}
                />
                {m.id === message.id && (message.attachments?.length ?? 0) > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span className="material-icons-outlined text-sm">attach_file</span>
                      Ekler
                    </p>
                    <ul className="flex flex-wrap gap-2">
                      {(message.attachments ?? []).map((a) => (
                        <li key={a.attachmentId}>
                          <a
                            href={`/api/students/${studentId}/emails/${message.gmailMessageId}/attachments/${a.attachmentId}?filename=${encodeURIComponent(a.filename)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          >
                            <span className="material-icons-outlined text-base">attach_file</span>
                            <span className="truncate max-w-[180px]">{a.filename}</span>
                            {a.size > 0 && (
                              <span className="text-xs text-slate-400">
                                ({(a.size / 1024).toFixed(1)} KB)
                              </span>
                            )}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}

            {!replyOpen ? (
              <div
                onClick={() => setReplyOpen(true)}
                className="mt-8 sm:mt-12 p-4 sm:p-6 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/30 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors touch-manipulation"
              >
                <div className="flex items-center gap-4">
                  <span className="material-icons-outlined text-slate-400">reply</span>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {message.from} yanıtla...
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-8 sm:mt-12 p-4 sm:p-6 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-icons-outlined text-slate-400">reply</span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hızlı yanıt</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Alıcı: {message.from}</p>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                  <textarea
                    className="w-full border-none focus:ring-0 text-sm min-h-[120px] resize-none bg-transparent placeholder:text-slate-400"
                    placeholder="Mesajınızı buraya yazın..."
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                  />
                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => { setReplyOpen(false); setReplyBody(""); }}
                      className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      İptal
                    </button>
                    <button
                      onClick={sendReply}
                      disabled={sending}
                      className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <span className="material-icons-outlined text-lg">send</span>
                      {sending ? "Gönderiliyor..." : "Gönder"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
