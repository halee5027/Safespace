function SafetyPill({ level = 'low' }) {
  const palette = {
    low: 'bg-mint/15 text-emerald-800 border-emerald-300',
    medium: 'bg-amber-100 text-amber-900 border-amber-300',
    high: 'bg-coral/15 text-rose-900 border-rose-300'
  };

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${palette[level]}`}>
      {level}
    </span>
  );
}

export default SafetyPill;
