import { useEffect, useMemo, useState } from 'react';
import { api, endpoints } from '../api/client';
import SafetyPill from '../components/SafetyPill';
import AppToast from '../components/AppToast';
import { useAppContext } from '../contexts/AppContext';
import { useSocketContext } from '../contexts/SocketContext';

function AlertsPage() {
  const { selectedUser } = useAppContext();
  const { liveAlerts } = useSocketContext();
  const [data, setData] = useState({ alerts: [], flaggedInteractions: [], suggestedActions: [], riskLevel: 'low' });
  const [toast, setToast] = useState({ message: '', tone: 'info' });

  const mergedAlerts = useMemo(() => {
    const seen = new Set();
    return [...liveAlerts, ...data.alerts].filter((alert) => {
      const key = String(alert._id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [liveAlerts, data.alerts]);

  useEffect(() => {
    if (!selectedUser?._id) return;

    async function loadAlerts() {
      try {
        const { data: alertsData } = await api.get(endpoints.alerts(selectedUser._id));
        setData(alertsData);
      } catch (error) {
        setToast({ message: 'Unable to load alerts.', tone: 'error' });
      }
    }

    loadAlerts();
  }, [selectedUser?._id, liveAlerts.length]);

  const runQuickAction = async (action) => {
    if (action === 'report') {
      try {
        await api.post(endpoints.report, {
          reporterId: selectedUser._id,
          reason: 'User reported suspicious targeting via quick action',
          anonymous: true
        });
        setToast({ message: 'Anonymous report submitted.', tone: 'info' });
      } catch {
        setToast({ message: 'Report failed.', tone: 'error' });
      }
      return;
    }

    setToast({ message: `${action.toUpperCase()} action acknowledged.`, tone: 'info' });
  };

  const markRead = async (alertId) => {
    try {
      await api.patch(`/alerts/read/${alertId}`);
      setData((prev) => ({
        ...prev,
        alerts: prev.alerts.map((alert) =>
          String(alert._id) === String(alertId) ? { ...alert, read: true } : alert
        )
      }));
    } catch {
      setToast({ message: 'Failed to mark alert as read.', tone: 'error' });
    }
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[1.8fr_1.2fr]">
      <article className="card-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-display text-xl font-extrabold">Safety Alerts</p>
          <SafetyPill level={data.riskLevel} />
        </div>

        <div className="max-h-[620px] space-y-3 overflow-y-auto pr-1">
          {mergedAlerts.map((alert) => (
            <div
              key={alert._id}
              className={`rounded-2xl border p-4 ${
                alert.read ? 'border-slate-200 bg-slate-50' : 'border-amber-200 bg-amber-50/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800">{alert.title}</p>
                {!alert.read && (
                  <button
                    onClick={() => markRead(alert._id)}
                    className="text-xs font-bold text-ink underline"
                  >
                    Mark read
                  </button>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-700">{alert.message}</p>
              <p className="mt-1 text-xs text-slate-500">{new Date(alert.createdAt).toLocaleString()}</p>
            </div>
          ))}

          {!mergedAlerts.length && <p className="text-sm text-slate-500">No alerts for now.</p>}
        </div>
      </article>

      <aside className="space-y-4">
        <article className="card-surface p-5">
          <p className="font-display text-lg font-bold">Quick Actions</p>
          <p className="mt-1 text-sm text-slate-600">You may be targeted. Use one-tap safety actions.</p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {(data.suggestedActions || ['block', 'report', 'mute']).map((action) => (
              <button
                key={action}
                onClick={() => runQuickAction(action)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700"
              >
                {action}
              </button>
            ))}
          </div>
        </article>

        <article className="card-surface p-5">
          <p className="font-display text-lg font-bold">Flagged Interactions</p>
          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
            {data.flaggedInteractions?.map((item) => (
              <div key={item._id} className="rounded-xl border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-800">{item.text}</p>
                <div className="mt-2 flex items-center justify-between">
                  <SafetyPill level={item.moderation?.severity || 'low'} />
                  <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {!data.flaggedInteractions?.length && (
              <p className="text-sm text-slate-500">No flagged interactions found.</p>
            )}
          </div>
        </article>

        <AppToast message={toast.message} tone={toast.tone} />
      </aside>
    </section>
  );
}

export default AlertsPage;
