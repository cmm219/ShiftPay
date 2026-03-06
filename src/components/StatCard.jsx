export default function StatCard({ icon, value, label }) {
  return (
    <div className="bg-bg-surface rounded-xl border border-border-subtle p-5 flex flex-col items-center text-center gap-1">
      <span className="text-2xl">{icon}</span>
      <span className="text-3xl font-bold font-display text-text-primary">
        {value}
      </span>
      <span className="text-text-secondary text-sm">{label}</span>
    </div>
  );
}
