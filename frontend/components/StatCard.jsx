function StatCard({ label, value, tone = 'mint' }) {
  const accent = {
    mint: 'from-mint/30 to-white',
    coral: 'from-coral/25 to-white',
    amber: 'from-amber-200 to-white',
    ink: 'from-slate-200 to-white'
  };

  return (
    <article className={`card-surface bg-gradient-to-br ${accent[tone]} p-5`}> 
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-display font-bold tracking-tight">{value}</p>
    </article>
  );
}

export default StatCard;
