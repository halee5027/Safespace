import { useEffect, useState } from 'react';
import { api, endpoints } from '../api/client';
import SafetyPill from '../components/SafetyPill';
import AppToast from '../components/AppToast';

function AdminPage() {
  const [flags, setFlags] = useState({ flaggedMessages: [], flaggedPosts: [], openReports: [] });
  const [toast, setToast] = useState({ message: '', tone: 'info' });

  async function loadFlags() {
    try {
      const { data } = await api.get(endpoints.adminFlags);
      setFlags(data);
    } catch {
      setToast({ message: 'Failed to load moderation queue.', tone: 'error' });
    }
  }

  useEffect(() => {
    loadFlags();
  }, []);

  const reviewMessage = async (messageId, action) => {
    try {
      await api.post(endpoints.reviewMessage(messageId), { action });
      setToast({ message: `Message ${action}d.`, tone: 'info' });
      loadFlags();
    } catch {
      setToast({ message: 'Message review failed.', tone: 'error' });
    }
  };

  const reviewPost = async (postId, action) => {
    try {
      await api.post(endpoints.reviewPost(postId), { action });
      setToast({ message: `Post ${action}d.`, tone: 'info' });
      loadFlags();
    } catch {
      setToast({ message: 'Post review failed.', tone: 'error' });
    }
  };

  const banUser = async (userId) => {
    if (!userId) return;

    try {
      await api.post(endpoints.banUser(userId));
      setToast({ message: 'User banned.', tone: 'info' });
      loadFlags();
    } catch {
      setToast({ message: 'Ban action failed.', tone: 'error' });
    }
  };

  return (
    <section className="space-y-4">
      <article className="card-surface p-5">
        <p className="font-display text-xl font-extrabold">Admin Moderation Panel</p>
        <p className="mt-1 text-sm text-slate-600">
          Review flagged messages and posts, remove harmful content, and ban repeat offenders.
        </p>
      </article>

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="card-surface p-4">
          <p className="font-display text-lg font-bold">Flagged Messages</p>
          <div className="mt-3 max-h-[460px] space-y-2 overflow-y-auto">
            {flags.flaggedMessages.map((message) => (
              <div key={message._id} className="rounded-xl border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-800">{message.text}</p>
                <div className="mt-2 flex items-center justify-between">
                  <SafetyPill level={message.moderation?.severity || 'low'} />
                  <span className="text-xs text-slate-500">{message.status}</span>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => reviewMessage(message._id, 'approve')}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => reviewMessage(message._id, 'remove')}
                    className="rounded-lg bg-coral px-2 py-1 text-xs font-semibold text-white"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => banUser(message.senderId)}
                    className="rounded-lg bg-ink px-2 py-1 text-xs font-semibold text-white"
                  >
                    Ban User
                  </button>
                </div>
              </div>
            ))}
            {!flags.flaggedMessages.length && (
              <p className="text-sm text-slate-500">No flagged messages right now.</p>
            )}
          </div>
        </article>

        <article className="card-surface p-4">
          <p className="font-display text-lg font-bold">Flagged Images/Posts</p>
          <div className="mt-3 max-h-[460px] space-y-2 overflow-y-auto">
            {flags.flaggedPosts.map((post) => (
              <div key={post._id} className="rounded-xl border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-800">{post.caption || '(No caption)'}</p>
                <div className="mt-2 flex items-center justify-between">
                  <SafetyPill level={post.moderation?.image?.severity || 'medium'} />
                  <span className="text-xs text-slate-500">{post.status}</span>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => reviewPost(post._id, 'approve')}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => reviewPost(post._id, 'remove')}
                    className="rounded-lg bg-coral px-2 py-1 text-xs font-semibold text-white"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => banUser(post.authorId)}
                    className="rounded-lg bg-ink px-2 py-1 text-xs font-semibold text-white"
                  >
                    Ban User
                  </button>
                </div>
              </div>
            ))}
            {!flags.flaggedPosts.length && (
              <p className="text-sm text-slate-500">No flagged posts right now.</p>
            )}
          </div>
        </article>

        <article className="card-surface p-4">
          <p className="font-display text-lg font-bold">Anonymous Reports</p>
          <div className="mt-3 max-h-[460px] space-y-2 overflow-y-auto">
            {flags.openReports.map((report) => (
              <div key={report._id} className="rounded-xl border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-800">{report.reason}</p>
                <p className="mt-1 text-xs text-slate-600">
                  Anonymous: {report.anonymous ? 'Yes' : 'No'} | Status: {report.status}
                </p>
                <p className="mt-1 text-xs text-slate-500">{new Date(report.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {!flags.openReports.length && (
              <p className="text-sm text-slate-500">No open reports.</p>
            )}
          </div>
        </article>
      </div>

      <AppToast message={toast.message} tone={toast.tone} />
    </section>
  );
}

export default AdminPage;
