"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ComposeModal } from "@/components/ComposeModal";
import { PageHeader } from "@/components/PageHeader";

const SEARCH_DEBOUNCE_MS = 300;

type BadgeItem = { id: string; name: string; color: string | null };

type EmailMessage = {
  id: string;
  gmailMessageId: string;
  threadId: string;
  from: string | null;
  to: string | null;
  subject: string | null;
  snippet: string | null;
  internalDate: string | null;
  bodyHtml?: string | null;
  badges?: BadgeItem[];
};

type AttachmentMeta = { filename: string; mimeType?: string; size: number; attachmentId: string };

type ThreadMessage = EmailMessage & {
  bodyHtml?: string | null;
  badges?: BadgeItem[];
  attachments?: AttachmentMeta[];
};

type FolderItem = { id: string; name: string; fromAddress: string | null };

export function InboxClient({
  studentId,
  studentName,
  studentStage,
  gmailAddress,
  connectionStatus,
  initialLabel,
  user,
  backHref,
  backLabel,
  inboxBasePath,
  initialFolders,
  initialBadges,
  initialStages,
}: {
  studentId: string;
  studentName: string;
  studentStage: string;
  gmailAddress: string;
  connectionStatus: string;
  initialLabel: string;
  user?: { name: string | null; email: string | null };
  backHref?: string;
  backLabel?: string;
  inboxBasePath?: string;
  initialFolders?: FolderItem[];
  initialBadges?: BadgeItem[];
  initialStages?: { slug: string; name: string }[];
}) {
  const basePath = inboxBasePath ?? `/students/${studentId}`;
  const showStage = inboxBasePath == null;
  const searchParams = useSearchParams();
  const label = searchParams.get("label") ?? initialLabel;
  const folderId = searchParams.get("folderId") ?? "";
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [threadDetail, setThreadDetail] = useState<{ message: ThreadMessage; thread: ThreadMessage[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyPrefill, setReplyPrefill] = useState<{ to: string; subject: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [stage, setStage] = useState(studentStage);
  const [folders, setFolders] = useState<FolderItem[]>(initialFolders ?? []);
  const [badges, setBadges] = useState<BadgeItem[]>(initialBadges ?? []);
  const [stagesList, setStagesList] = useState<{ slug: string; name: string }[]>(initialStages ?? []);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderFrom, setNewFolderFrom] = useState("");
  const [newBadgeName, setNewBadgeName] = useState("");
  const [folderCreating, setFolderCreating] = useState(false);
  const [badgeCreating, setBadgeCreating] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);

  useEffect(() => {
    setStage(studentStage);
  }, [studentStage]);

  useEffect(() => {
    if (!selectedId) {
      setThreadDetail(null);
      return;
    }
    setDetailLoading(true);
    fetch(`/api/students/${studentId}/emails/${selectedId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.message) setThreadDetail({ message: data.message, thread: data.thread ?? [data.message] });
        else setThreadDetail(null);
      })
      .finally(() => setDetailLoading(false));
  }, [studentId, selectedId]);

  const fetchEmails = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      label,
      page: String(page),
      pageSize: "50",
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(folderId && { folderId }),
    });
    fetch(`/api/students/${studentId}/emails?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setMessages(data.messages ?? []);
        setTotal(data.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [studentId, label, page, debouncedSearch, folderId]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  const handleSyncRef = useRef(handleSync);
  const syncingRef = useRef(syncing);
  handleSyncRef.current = handleSync;
  syncingRef.current = syncing;
  // Gelen/giden mailleri periyodik yenile (bağlantı varken her 60 sn sync + liste güncelle)
  useEffect(() => {
    if (connectionStatus !== "connected") return;
    const interval = setInterval(() => {
      if (!syncingRef.current) handleSyncRef.current();
    }, 60_000);
    return () => clearInterval(interval);
  }, [connectionStatus]);

  useEffect(() => {
    if (initialFolders !== undefined) return;
    fetch(`/api/students/${studentId}/folders`)
      .then((r) => r.json())
      .then((data) => setFolders(data.folders ?? []))
      .catch(() => {});
  }, [studentId, initialFolders]);

  useEffect(() => {
    if (initialBadges !== undefined) return;
    fetch("/api/badges")
      .then((r) => r.json())
      .then((data) => setBadges(data.badges ?? []))
      .catch(() => {});
  }, [initialBadges]);

  useEffect(() => {
    if (initialStages !== undefined) return;
    fetch("/api/stages")
      .then((r) => r.json())
      .then((data: { stages?: { slug: string; name: string }[] }) => setStagesList(data.stages ?? []))
      .catch(() => {});
  }, [initialStages]);

  async function createFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setFolderCreating(true);
    const res = await fetch(`/api/students/${studentId}/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFolderName.trim(), fromAddress: newFolderFrom.trim() || null }),
    });
    setFolderCreating(false);
    if (res.ok) {
      setFolderModalOpen(false);
      setNewFolderName("");
      setNewFolderFrom("");
      const data = await res.json();
      setFolders((f) => [...f, data].sort((a, b) => a.name.localeCompare(b.name)));
    }
  }

  async function createBadge(e: React.FormEvent) {
    e.preventDefault();
    if (!newBadgeName.trim()) return;
    setBadgeCreating(true);
    const res = await fetch("/api/badges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newBadgeName.trim() }),
    });
    setBadgeCreating(false);
    if (res.ok) {
      setBadgeModalOpen(false);
      setNewBadgeName("");
      const data = await res.json();
      setBadges((b) => [...b, data].sort((a, b) => a.name.localeCompare(b.name)));
    }
  }

  async function toggleMessageBadge(messageId: string, badgeId: string, currentBadges: BadgeItem[]) {
    const hasBadge = currentBadges.some((b) => b.id === badgeId);
    const res = await fetch(`/api/students/${studentId}/emails/${messageId}/badges`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badgeId, action: hasBadge ? "remove" : "add" }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setThreadDetail((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        message: { ...prev.message, badges: data.badges },
        thread: prev.thread.map((m) =>
          m.gmailMessageId === messageId ? { ...m, badges: data.badges } : m
        ),
      };
    });
    setMessages((msgs) =>
      msgs.map((m) => (m.gmailMessageId === messageId ? { ...m, badges: data.badges } : m))
    );
  }

  async function handleSync() {
    if (connectionStatus !== "connected") return;
    setSyncing(true);
    try {
      await fetch(`/api/students/${studentId}/sync`, { method: "POST" });
      fetchEmails();
    } finally {
      setSyncing(false);
    }
  }

  const totalPages = Math.ceil(total / 50);
  const showListOnMobile = !selectedId;
  const showDetailOnMobile = !!selectedId;

  const SidebarContent = () => (
    <>
        <div className="p-4">
          <button
            onClick={() => {
              setComposeOpen(true);
              setOverflowOpen(false);
            }}
            disabled={connectionStatus !== "connected"}
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-icons-outlined text-sm">edit</span>
            Yeni mail
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 space-y-6">
            <div className="space-y-1">
            <Link
              href={`${basePath}/inbox${folderId ? `?folderId=${folderId}` : ""}`}
              onClick={() => setOverflowOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium group ${
                label === "INBOX" && !folderId ? "bg-primary/10 text-primary" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-icons-outlined text-lg">inbox</span>
                <span className="text-sm">Gelen kutusu</span>
              </div>
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                {total}
              </span>
            </Link>
            <Link
              href={`${basePath}/inbox?label=SENT`}
              onClick={() => setOverflowOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                label === "SENT" ? "bg-primary/10 text-primary" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <span className="material-icons-outlined text-lg">send</span>
              <span>Gönderilen</span>
            </Link>
          </div>
          {showStage && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
              Mevcut aşama
            </div>
            <div className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {stagesList.find((s) => s.slug === stage)?.name ?? stage}
              </p>
              <Link
                href="/students"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Aşama öğrenci listesi tablosundan değiştirilir
                <span className="material-icons-outlined text-sm">open_in_new</span>
              </Link>
            </div>
          </div>
          )}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Klasörler</span>
              <button
                type="button"
                onClick={() => setFolderModalOpen(true)}
                className="text-primary hover:bg-primary/10 p-1 rounded"
                title="Yeni klasör"
              >
                <span className="material-icons-outlined text-lg">add</span>
              </button>
            </div>
            <div className="space-y-0.5">
              {folders.map((f) => (
                <div
                  key={f.id}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    folderId === f.id ? "bg-primary/10 text-primary font-medium" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <Link href={`${basePath}/inbox?folderId=${f.id}&label=INBOX`} onClick={() => setOverflowOpen(false)} className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="material-icons-outlined text-lg shrink-0">folder</span>
                    <span className="truncate">{f.name}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!confirm(`"${f.name}" klasörünü silmek istediğinize emin misiniz?`)) return;
                      fetch(`/api/students/${studentId}/folders/${f.id}`, { method: "DELETE" }).then(() => {
                        setFolders((prev) => prev.filter((x) => x.id !== f.id));
                        if (folderId === f.id) window.location.href = `${basePath}/inbox`;
                      });
                    }}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-0.5 shrink-0"
                    title="Klasörü sil"
                  >
                    <span className="material-icons-outlined text-sm">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Etiketler</span>
              <button
                type="button"
                onClick={() => setBadgeModalOpen(true)}
                className="text-primary hover:bg-primary/10 p-1 rounded"
                title="Yeni etiket"
              >
                <span className="material-icons-outlined text-lg">add</span>
              </button>
            </div>
            <div className="space-y-0.5 max-h-32 overflow-y-auto">
              {badges.map((b) => (
                <div key={b.id} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: b.color ?? "#137fec" }}
                  />
                  <span className="truncate text-slate-600 dark:text-slate-400">{b.name}</span>
                </div>
              ))}
            </div>
          </div>
        </nav>
    </>
  );

  const inboxActions = (
    <div className="flex items-center gap-1">
      {/* Sync: sadece masaüstünde header'da; mobilde overflow menüde */}
      <div className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-full">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-xs font-medium text-green-700 dark:text-green-400">Sync</span>
      </div>
      {/* Overflow menü: sadece mobilde (masaüstünde sidebar/listedeki aksiyonlar yeterli) */}
      <div className="relative sm:hidden">
        <button
          type="button"
          onClick={() => setOverflowOpen((o) => !o)}
          className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          aria-label="Diğer işlemler"
        >
          <span className="material-icons-outlined">more_vert</span>
        </button>
        {overflowOpen && (
          <>
            <div className="fixed inset-0 z-40" aria-hidden onClick={() => setOverflowOpen(false)} />
            <div className="absolute right-0 top-full mt-1 py-1 w-56 max-h-[70vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50">
              <button
                type="button"
                disabled={connectionStatus !== "connected"}
                onClick={() => { setComposeOpen(true); setOverflowOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                <span className="material-icons-outlined text-lg">edit</span>
                Yeni mail
              </button>
              <button
                type="button"
                onClick={() => { connectionStatus === "connected" && handleSync(); setOverflowOpen(false); }}
                disabled={connectionStatus !== "connected" || syncing}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                <span className="material-icons-outlined text-lg">refresh</span>
                {syncing ? "Yenileniyor…" : "Yenile"}
              </button>
              {showStage && (
                <>
                  <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                  <div className="px-4 py-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mevcut aşama</div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {stagesList.find((s) => s.slug === stage)?.name ?? stage}
                    </p>
                    <Link
                      href="/students"
                      onClick={() => setOverflowOpen(false)}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Öğrenci listesinde değiştir
                    </Link>
                  </div>
                </>
              )}
              <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Klasörler</div>
              {folders.length === 0 ? (
                <p className="px-4 py-2 text-xs text-slate-500">Klasör yok</p>
              ) : (
                folders.map((f) => (
                  <Link
                    key={f.id}
                    href={`${basePath}/inbox?folderId=${f.id}&label=INBOX`}
                    onClick={() => setOverflowOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2 text-sm ${folderId === f.id ? "bg-primary/10 text-primary font-medium" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                  >
                    <span className="material-icons-outlined text-lg">folder</span>
                    <span className="truncate">{f.name}</span>
                  </Link>
                ))
              )}
              <button
                type="button"
                onClick={() => { setFolderModalOpen(true); setOverflowOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-primary hover:bg-primary/10"
              >
                <span className="material-icons-outlined text-lg">add</span>
                Yeni klasör
              </button>
              <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Etiketler</div>
              {badges.slice(0, 5).map((b) => (
                <div key={b.id} className="flex items-center gap-3 px-4 py-1.5 text-sm text-slate-600 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.color ?? "#137fec" }} />
                  <span className="truncate">{b.name}</span>
                </div>
              ))}
              {badges.length > 5 && <p className="px-4 py-1 text-xs text-slate-500">+{badges.length - 5} daha</p>}
              <button
                type="button"
                onClick={() => { setBadgeModalOpen(true); setOverflowOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-primary hover:bg-primary/10"
              >
                <span className="material-icons-outlined text-lg">add</span>
                Yeni etiket
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <PageHeader
        backHref={backHref ?? (inboxBasePath ? basePath : `/students/${studentId}`)}
        backLabel={backLabel ?? (inboxBasePath ? "Panele dön" : "Öğrenciye dön")}
        title={label === "SENT" ? "Gönderilen" : "Gelen kutusu"}
        actions={inboxActions}
      />

      {/* Mobil: Gelen kutusu | Gönderilen sekmeleri */}
      <div className="md:hidden flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <Link
          href={`${basePath}/inbox`}
          className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${label === "INBOX" && !folderId ? "text-primary border-b-2 border-primary" : "text-slate-500 dark:text-slate-400"}`}
        >
          Gelen kutusu
        </Link>
        <Link
          href={`${basePath}/inbox?label=SENT`}
          className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${label === "SENT" ? "text-primary border-b-2 border-primary" : "text-slate-500 dark:text-slate-400"}`}
        >
          Gönderilen
        </Link>
      </div>

      <main className="flex-1 min-h-0 flex overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* List pane: full width on mobile when no selection, fixed width on desktop */}
      <section className={`border-r border-slate-200 dark:border-slate-800 bg-background-light dark:bg-slate-900/50 flex flex-col shrink-0 min-h-0
        ${showDetailOnMobile ? "hidden md:flex w-[400px]" : "flex-1 md:flex-initial md:w-[400px] min-w-0"}`}>
        <div className="p-3 sm:p-4 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={handleSync}
              disabled={connectionStatus !== "connected" || syncing}
              className="material-icons-outlined text-slate-400 text-lg hover:text-slate-600 disabled:opacity-50 shrink-0"
              title="Yenile"
            >
              refresh
            </button>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 shrink-0">
            <span>1-{messages.length} / {total}</span>
          </div>
        </div>
        <div className="p-2 shrink-0 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <span className="material-icons-outlined absolute left-3 top-2 text-slate-400 text-sm">
                search
              </span>
              <input
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/50"
                placeholder="Mailde ara..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Yükleniyor...</div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <span className="material-icons-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3">
                {label === "SENT" ? "send" : "inbox"}
              </span>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {label === "SENT" ? "Gönderilmiş mail yok" : "Gelen kutusu boş"}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {label === "SENT"
                  ? "Henüz gönderilen mesaj bulunmuyor."
                  : "Bu klasörde veya etikette mail yok."}
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedId(m.gmailMessageId)}
                className={`group border-b border-slate-200/60 dark:border-slate-800/60 p-3 sm:p-4 cursor-pointer block transition-colors w-full text-left touch-manipulation ${
                  selectedId === m.gmailMessageId
                    ? "bg-white dark:bg-slate-900 border-l-4 border-l-primary"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate block">
                    {m.from ?? "Bilinmiyor"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">
                    {m.internalDate
                      ? new Date(m.internalDate).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate mb-1">
                  {m.subject ?? "(Konu yok)"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {m.snippet ?? ""}
                </p>
                {(m.badges?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {m.badges!.map((b) => (
                      <span
                        key={b.id}
                        className="px-2 py-0.5 text-[10px] font-semibold rounded uppercase"
                        style={{
                          backgroundColor: `${b.color ?? "#137fec"}20`,
                          color: b.color ?? "#137fec",
                        }}
                      >
                        {b.name}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </section>

      {/* Detail pane: on mobile full width when selected, with back button */}
      <section className={`flex-1 min-h-0 bg-white dark:bg-slate-900 flex overflow-hidden min-w-0 ${showListOnMobile ? "hidden md:flex" : ""}`}>
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-4 text-center">
              <span className="material-icons-outlined text-4xl mb-2">mail</span>
              <p className="text-sm">Bir mail seçin veya yeni mesaj yazın</p>
            </div>
          ) : detailLoading ? (
            <div className="flex-1 flex items-center justify-center text-slate-500">Yükleniyor...</div>
          ) : threadDetail ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Mobile: back to list */}
              <div className="md:hidden flex items-center gap-2 p-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="p-2 -ml-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1"
                >
                  <span className="material-icons-outlined">arrow_back</span>
                  <span className="text-sm font-medium">Liste</span>
                </button>
              </div>
              <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 shrink-0 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate flex-1 min-w-0">
                    {threadDetail.message.subject ?? "(Konu yok)"}
                  </h1>
                  <div className="flex items-center gap-2 shrink-0">
                  {connectionStatus === "connected" && (
                    <button
                    type="button"
                    onClick={() => {
                      const from = threadDetail.message.from ?? "";
                      const to = from.replace(/^.*<([^>]+)>$/, "$1").trim() || from;
                      const subj = threadDetail.message.subject?.startsWith("Re:")
                        ? threadDetail.message.subject
                        : `Re: ${threadDetail.message.subject ?? ""}`;
                      setReplyPrefill({ to, subject: subj });
                      setComposeOpen(true);
                    }}
                    className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2 shrink-0"
                  >
                    <span className="material-icons-outlined text-lg">reply</span>
                    Yanıtla
                  </button>
                  )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Etiketler</span>
                  {(threadDetail.message.badges ?? []).map((b) => (
                    <span
                      key={b.id}
                      className="px-2 py-0.5 text-xs font-semibold rounded"
                      style={{ backgroundColor: `${b.color ?? "#137fec"}25`, color: b.color ?? "#137fec" }}
                    >
                      {b.name}
                    </span>
                  ))}
                  <select
                    className="text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-1 px-2"
                    value=""
                    onChange={(e) => {
                      const id = e.target.value;
                      if (id) toggleMessageBadge(selectedId!, id, threadDetail.message.badges ?? []);
                      e.target.value = "";
                    }}
                  >
                    <option value="">+ Etiket ekle</option>
                    {badges.map((b) => (
                      <option key={b.id} value={b.id}>
                        {(threadDetail.message.badges ?? []).some((x) => x.id === b.id) ? `✓ ${b.name}` : b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
                  {threadDetail.thread.map((m) => (
                    <div
                      key={m.id}
                      className="pb-6 border-b border-slate-100 dark:border-slate-800 last:border-0"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {(m.from ?? "?").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">{m.from ?? "Bilinmiyor"}</div>
                            <div className="text-xs text-slate-500">Alıcı: {m.to ?? "—"}</div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          {m.internalDate ? new Date(m.internalDate).toLocaleString() : ""}
                        </div>
                      </div>
                      <div
                        className="prose prose-slate dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-300"
                        dangerouslySetInnerHTML={{
                          __html: m.bodyHtml ?? `<p>${m.snippet ?? ""}</p>`,
                        }}
                      />
                      {m.gmailMessageId === selectedId && (threadDetail.message.attachments?.length ?? 0) > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <span className="material-icons-outlined text-sm">attach_file</span>
                            Ekler
                          </p>
                          <ul className="flex flex-wrap gap-2">
                            {(threadDetail.message.attachments ?? []).map((a) => (
                              <li key={a.attachmentId}>
                                <a
                                  href={`/api/students/${studentId}/emails/${selectedId}/attachments/${a.attachmentId}?filename=${encodeURIComponent(a.filename)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs hover:bg-slate-200 dark:hover:bg-slate-700"
                                >
                                  <span className="material-icons-outlined text-sm">attach_file</span>
                                  <span className="truncate max-w-[140px]">{a.filename}</span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">Mesaj yüklenemedi</div>
          )}
        </div>
        <aside className="hidden lg:flex w-[260px] border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex-col shrink-0 p-4 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            {inboxBasePath ? "Hesap" : "Öğrenci özeti"}
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl mb-3">
              {studentName.slice(0, 2).toUpperCase()}
            </div>
            <p className="text-xs text-slate-500 mb-1">{inboxBasePath ? "Öğrenci" : "Aday"}</p>
            <p className="font-semibold text-slate-900 dark:text-white mb-3">{studentName}</p>
            {showStage && (
              <div className="mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mevcut aşama</span>
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded">
                    {stagesList.find((s) => s.slug === stage)?.name ?? stage}
                  </span>
                </div>
                <Link
                  href="/students"
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Aşama öğrenci listesi tablosundan değiştirilir
                  <span className="material-icons-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            )}
            {gmailAddress && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 truncate" title={gmailAddress}>
                {gmailAddress}
              </p>
            )}
            <Link
              href={inboxBasePath ? `${inboxBasePath}/settings` : `/students/${studentId}`}
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              {inboxBasePath ? "Ayarlar" : "Profili görüntüle"}
              <span className="material-icons-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </aside>
      </section>

      {folderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Yeni klasör</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Bu adresten gelen mailler bu klasörde görünecek.
            </p>
            <form onSubmit={createFolder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Klasör adı</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  placeholder="örn. Stanford"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gönderen adresi (içeren)</label>
                <input
                  type="text"
                  value={newFolderFrom}
                  onChange={(e) => setNewFolderFrom(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  placeholder="örn. stanford.edu veya admissions@stanford.edu"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setFolderModalOpen(false)} className="flex-1 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  İptal
                </button>
                <button type="submit" disabled={folderCreating} className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
                  {folderCreating ? "Oluşturuluyor..." : "Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {badgeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Yeni etiket</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Mailleri etiketleyip kategorize etmek için bir etiket oluşturun.
            </p>
            <form onSubmit={createBadge} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Etiket adı</label>
                <input
                  type="text"
                  value={newBadgeName}
                  onChange={(e) => setNewBadgeName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  placeholder="örn. Önemli, Yanıtlanacak"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setBadgeModalOpen(false)} className="flex-1 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  İptal
                </button>
                <button type="submit" disabled={badgeCreating} className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
                  {badgeCreating ? "Oluşturuluyor..." : "Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {composeOpen && (
        <ComposeModal
          studentId={studentId}
          gmailAddress={gmailAddress}
          onClose={() => {
            setComposeOpen(false);
            setReplyPrefill(null);
          }}
          onSent={() => {
            setComposeOpen(false);
            setReplyPrefill(null);
            handleSync();
          }}
          initialTo={replyPrefill?.to}
          initialSubject={replyPrefill?.subject}
        />
      )}
      </main>
    </div>
  );
}
