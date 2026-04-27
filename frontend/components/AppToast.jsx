function AppToast({ message, tone = 'info' }) {
  if (!message) return null;

  const style = tone === 'error' ? 'bg-coral text-white' : 'bg-ink text-white';

  return <div className={`rounded-xl px-3 py-2 text-sm shadow-lg ${style}`}>{message}</div>;
}

export default AppToast;
