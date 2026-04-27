function WarningModal({ open, warningText, onCancel, onEdit, onSendAnyway }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <p className="font-display text-lg font-bold text-rose-900">Think Before You Send</p>
        <p className="mt-2 text-sm text-slate-700">
          {warningText || 'This may be harmful. Edit before posting.'}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={onEdit}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Edit Message
          </button>
          <button
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={onSendAnyway}
            className="rounded-xl bg-coral px-4 py-2 text-sm font-bold text-white"
          >
            Send Anyway
          </button>
        </div>
      </div>
    </div>
  );
}

export default WarningModal;
