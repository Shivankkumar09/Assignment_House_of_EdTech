export default function AuthShell({
  heading,
  sub,
  children,
}: {
  heading: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-ink-50">
      {/* Signature panel: stacked "revisions" of a page, referencing version history */}
      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-ink-950 lg:flex">
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }} />
        <div className="relative flex flex-col items-center gap-10 px-12">
          <div className="relative h-64 w-48">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-sm border border-ink-700 bg-ink-900 shadow-2xl"
                style={{
                  transform: `translate(${i * 10}px, ${-i * 10}px) rotate(${(i - 1.5) * 2}deg)`,
                  opacity: 1 - i * 0.12,
                }}
              >
                <div className="p-4">
                  <div className="mb-3 h-1.5 w-2/3 rounded-full bg-ink-600" />
                  <div className="mb-1.5 h-1 w-full rounded-full bg-ink-700" />
                  <div className="mb-1.5 h-1 w-5/6 rounded-full bg-ink-700" />
                  <div className="h-1 w-4/6 rounded-full bg-ink-700" />
                </div>
              </div>
            ))}
            <div className="absolute -right-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-signal text-[11px] font-bold text-white shadow-lg">
              v4
            </div>
          </div>
          <div className="max-w-xs text-center">
            <p className="font-display text-2xl italic text-ink-100">
              Every edit remembered.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-400">
              Marginal keeps a full, navigable history of your document —
              online or off — and reconciles every change the moment you reconnect.
            </p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col justify-center px-8 py-16 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-ink-950 font-display text-base italic text-white">
              M
            </div>
            <span className="font-display text-lg italic text-ink-900">Marginal</span>
          </div>
          <h1 className="font-display text-2xl text-ink-950">{heading}</h1>
          <p className="mt-1.5 text-sm text-ink-500">{sub}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
