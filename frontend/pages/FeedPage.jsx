import { useEffect, useMemo, useState } from 'react';
import { api, endpoints } from '../api/client';
import SafetyPill from '../components/SafetyPill';
import AppToast from '../components/AppToast';
import { useAppContext } from '../contexts/AppContext';
import { useSocketContext } from '../contexts/SocketContext';

function FeedPage() {
  const { selectedUser } = useAppContext();
  const { socket } = useSocketContext();
  const [posts, setPosts] = useState([]);
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState({});
  const [toast, setToast] = useState({ message: '', tone: 'info' });

  async function loadFeed() {
    try {
      const { data } = await api.get(endpoints.feed);
      setPosts(data.posts || []);
    } catch (error) {
      setToast({ message: 'Unable to load feed', tone: 'error' });
    }
  }

  useEffect(() => {
    loadFeed();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onNewPost = (post) => {
      setPosts((prev) => [
        {
          ...post,
          imageSrc: post.imageSrc || ''
        },
        ...prev
      ]);
    };

    socket.on('feed:new-post', onNewPost);
    return () => socket.off('feed:new-post', onNewPost);
  }, [socket]);

  const onImageChange = (event) => {
    const file = event.target.files?.[0];
    setImageFile(file || null);

    if (!file) {
      setPreview('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const submitPost = async () => {
    if (!caption.trim() && !imageFile) {
      setToast({ message: 'Add a caption or image before posting.', tone: 'error' });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('authorId', selectedUser._id);
      formData.append('caption', caption);
      if (imageFile) formData.append('image', imageFile);

      const { data } = await api.post(endpoints.uploadContent, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const nextPost = {
        ...data.post,
        imageSrc: data.post.imageData
          ? `data:${data.post.imageMimeType || 'image/png'};base64,${data.post.imageData}`
          : ''
      };

      setPosts((prev) => [nextPost, ...prev]);
      setCaption('');
      setImageFile(null);
      setPreview('');
      setToast({
        message:
          data.status === 'allow'
            ? 'Post shared successfully.'
            : 'Post published with safety restrictions.',
        tone: data.status === 'allow' ? 'info' : 'error'
      });
    } catch (error) {
      if (error.response?.status === 403) {
        setToast({ message: 'Post blocked and flagged for moderator review.', tone: 'error' });
      } else {
        setToast({ message: 'Upload failed.', tone: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const feedCards = useMemo(() => posts.slice(0, 30), [posts]);

  return (
    <section className="grid gap-4 lg:grid-cols-[1.2fr_1.8fr]">
      <article className="card-surface p-5">
        <p className="font-display text-xl font-extrabold">Share to Social Feed</p>
        <p className="mt-1 text-sm text-slate-600">
          Caption and image are analyzed together to detect harassment memes and humiliation content.
        </p>

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption..."
          className="mt-4 min-h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400"
        />

        <label className="mt-3 block rounded-xl border border-dashed border-slate-400 p-3 text-sm font-semibold text-slate-700">
          Upload image/meme
          <input type="file" accept="image/*" onChange={onImageChange} className="mt-2 block w-full text-xs" />
        </label>

        {preview && (
          <img src={preview} alt="preview" className="mt-4 max-h-56 w-full rounded-2xl object-cover" />
        )}

        <button
          onClick={submitPost}
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Post with AI Safety'}
        </button>

        <div className="mt-4">
          <AppToast message={toast.message} tone={toast.tone} />
        </div>
      </article>

      <article className="card-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-display text-xl font-extrabold">Moderated Feed</p>
          <p className="text-xs font-semibold text-slate-500">Sensitive posts auto-blurred</p>
        </div>

        <div className="max-h-[640px] space-y-4 overflow-y-auto pr-1">
          {feedCards.map((post, index) => {
            const severity =
              post.moderation?.image?.severity === 'high' || post.moderation?.text?.severity === 'high'
                ? 'high'
                : post.status === 'blurred'
                  ? 'medium'
                  : 'low';

            const sensitive = post.status === 'blurred' || post.status === 'blocked';
            const showSensitive = revealed[post._id] || !sensitive;

            return (
              <article
                key={post._id}
                className="animate-riseIn rounded-2xl border border-slate-200 bg-white p-3"
                style={{ animationDelay: `${index * 45}ms` }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">{new Date(post.createdAt).toLocaleString()}</p>
                  <SafetyPill level={severity} />
                </div>

                {!!post.caption && <p className="mb-2 text-sm text-slate-800">{post.caption}</p>}

                {post.imageSrc && (
                  <div className="relative overflow-hidden rounded-xl">
                    <img
                      src={post.imageSrc}
                      alt="post"
                      className={`max-h-80 w-full object-cover transition ${showSensitive ? 'blur-0' : 'blur-xl saturate-0'}`}
                    />
                    {!showSensitive && (
                      <button
                        onClick={() =>
                          setRevealed((prev) => ({
                            ...prev,
                            [post._id]: true
                          }))
                        }
                        className="absolute inset-0 flex items-center justify-center bg-slate-900/55 text-sm font-bold text-white"
                      >
                        Tap to view (Sensitive)
                      </button>
                    )}
                  </div>
                )}

                {post?.moderation?.explanation && (
                  <p className="mt-2 text-xs text-slate-500">AI explanation: {post.moderation.explanation}</p>
                )}
              </article>
            );
          })}

          {!feedCards.length && <p className="text-sm text-slate-500">No posts yet.</p>}
        </div>
      </article>
    </section>
  );
}

export default FeedPage;
