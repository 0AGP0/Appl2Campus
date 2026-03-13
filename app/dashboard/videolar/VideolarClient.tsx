"use client";

// Revize 2: Tek playlist, 3 kategori (Video 1-7, 8-21, 22+)
const PLAYLIST_ID = "PLwmei0cWWv_aceoGRw6g0LWqyCxo7H_rW";

const CATEGORIES = [
  { id: "kabul", title: "Üniversite Kabul Süreci", description: "Video 1 – 7", index: 0 },
  { id: "vize", title: "Vizeye Doğru", description: "Video 8 – 21", index: 7 },
  { id: "almanya", title: "Almanya Rehberi", description: "Video 22 ve sonrası", index: 21 },
];

export function VideolarClient() {
  return (
    <div className="space-y-8">
      {CATEGORIES.map((cat) => (
        <section
          key={cat.id}
          className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">{cat.title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{cat.description}</p>
          </div>
          <div className="p-6">
            <div className="aspect-video max-w-3xl rounded-xl overflow-hidden bg-slate-900">
              <iframe
                title={cat.title}
                src={`https://www.youtube.com/embed/videoseries?list=${PLAYLIST_ID}&index=${cat.index}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
