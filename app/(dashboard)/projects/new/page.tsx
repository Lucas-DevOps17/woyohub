export default function NewProjectPage() {
  return (
    <div className="px-4 lg:px-10 py-8 lg:py-12 max-w-lg mx-auto animate-fade-in">
      <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-[var(--on-surface)] mb-4" style={{ letterSpacing: -0.5 }}>Add a project</h1>
      <div className="rounded-3xl p-12 text-center" style={{ background: "var(--surface-card)" }}>
        <p className="text-4xl mb-4">🚧</p>
        <h3 className="font-display text-lg font-bold text-[var(--on-surface)]">Coming soon</h3>
        <p className="text-sm mt-1" style={{ color: "var(--on-surface-variant)" }}>Project creation is being built in Phase 2.</p>
      </div>
    </div>
  );
}
