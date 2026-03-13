"use client";

import { useEffect, useState } from "react";

type Note = {
  id: string;
  type: string;
  content: string | null;
  fileName: string | null;
  filePath: string | null;
  createdAt: string;
  author: { id: string; name: string | null; email: string | null };
};

export function StudentNotesSidebar({ studentId }: { studentId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchNotes = async () => {
    const res = await fetch(`/api/students/${studentId}/notes`);
    if (res.status === 403) {
      setForbidden(true);
      setLoading(false);
      return;
    }
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    setNotes(data.notes ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, [studentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/students/${studentId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, type: "note" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Not eklenemedi.");
        return;
      }
      const created = await res.json();
      setNotes((prev) => [created, ...prev]);
      setContent("");
    } finally {
      setSubmitting(false);
    }
  };

  if (forbidden) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
          <span className="material-icons-outlined text-lg">note</span>
          Notlar
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Not ekle..."
            rows={3}
            className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm p-2 resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="btn btn-primary text-sm py-1.5"
          >
            {submitting ? "Ekleniyor..." : "Ekle"}
          </button>
        </form>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading ? (
          <p className="text-slate-500 text-sm">Yükleniyor...</p>
        ) : notes.length === 0 ? (
          <p className="text-slate-500 text-sm">Henüz not yok.</p>
        ) : (
          notes.map((n) => (
            <div
              key={n.id}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-2.5 text-sm"
            >
              <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words">
                {n.content || (n.fileName ? `Dosya: ${n.fileName}` : "—")}
              </p>
              <p className="mt-1.5 text-xs text-slate-500">
                {n.author.name || n.author.email || "Bilinmeyen"} ·{" "}
                {new Date(n.createdAt).toLocaleString("tr-TR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
