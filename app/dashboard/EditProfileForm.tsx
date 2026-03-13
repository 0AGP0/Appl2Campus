"use client";

import { useState } from "react";

export function EditProfileForm({
  initialName,
  initialLoginEmail,
}: {
  initialName: string;
  initialLoginEmail: string | null;
}) {
  const [name, setName] = useState(initialName);
  const [loginEmail, setLoginEmail] = useState(initialLoginEmail ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!loginEmail.trim()) {
      setMessage({ type: "error", text: "Giriş e-postası gerekli." });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || initialName,
          loginEmail: loginEmail.trim().toLowerCase(),
          ...(newPassword ? { newPassword } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: "ok", text: "Portal giriş bilgileri kaydedildi." });
        setNewPassword("");
      } else {
        setMessage({ type: "error", text: data.error ?? "Kaydedilemedi." });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Ad Soyad
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="Adınız Soyadınız"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Giriş e-postası
        </label>
        <input
          type="email"
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="portala girişte kullandığın e-posta"
          required
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Bu e-posta ile portala giriş yaparsın.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Yeni şifre (opsiyonel)
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="Değiştirmek istemiyorsan boş bırak"
          minLength={8}
          maxLength={128}
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          En az 8 karakter. Sadece değiştirmek istediğinde doldur.
        </p>
      </div>
      {message && (
        <p className={`text-sm ${message.type === "ok" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {message.text}
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
