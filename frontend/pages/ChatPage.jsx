import { useEffect, useMemo, useState } from 'react';
import { api, endpoints } from '../api/client';
import SafetyPill from '../components/SafetyPill';
import WarningModal from '../components/WarningModal';
import AppToast from '../components/AppToast';
import { useAppContext } from '../contexts/AppContext';
import { useSocketContext } from '../contexts/SocketContext';

function ChatPage() {
  const { selectedUser, peerUser } = useAppContext();
  const { socket } = useSocketContext();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typingUserId, setTypingUserId] = useState(null);
  const [toast, setToast] = useState({ message: '', tone: 'info' });
  const [warningState, setWarningState] = useState({
    open: false,
    reason: '',
    pendingMessage: null
  });

  const conversationKey = useMemo(
    () => [selectedUser?._id, peerUser?._id].filter(Boolean).join(':') || 'empty',
    [selectedUser?._id, peerUser?._id]
  );

  useEffect(() => {
    if (!selectedUser?._id || !peerUser?._id) return;

    async function loadConversation() {
      setIsLoading(true);
      try {
        const { data } = await api.get(endpoints.messages, {
          params: {
            userA: selectedUser._id,
            userB: peerUser._id
          }
        });
        setMessages(data.messages || []);
      } catch (error) {
        setToast({ message: 'Unable to load chat history', tone: 'error' });
      } finally {
        setIsLoading(false);
      }
    }

    loadConversation();
  }, [conversationKey]);

  useEffect(() => {
    if (!socket || !selectedUser?._id || !peerUser?._id) return;

    const upsertMessage = (incoming) => {
      const involved =
        (String(incoming.senderId) === String(selectedUser._id) &&
          String(incoming.receiverId) === String(peerUser._id)) ||
        (String(incoming.senderId) === String(peerUser._id) &&
          String(incoming.receiverId) === String(selectedUser._id));

      if (!involved) return;

      setMessages((prev) => {
        if (prev.some((m) => String(m._id) === String(incoming._id))) return prev;
        return [...prev, incoming];
      });
    };

    const handleBlocked = () => {
      setToast({ message: 'A severe message was blocked by SafeSpace AI.', tone: 'error' });
    };

    const handleTyping = ({ fromUserId }) => {
      if (String(fromUserId) !== String(peerUser._id)) return;
      setTypingUserId(fromUserId);
      setTimeout(() => setTypingUserId(null), 1200);
    };

    socket.on('chat:message', upsertMessage);
    socket.on('chat:message-sent', upsertMessage);
    socket.on('chat:blocked', handleBlocked);
    socket.on('chat:typing', handleTyping);

    return () => {
      socket.off('chat:message', upsertMessage);
      socket.off('chat:message-sent', upsertMessage);
      socket.off('chat:blocked', handleBlocked);
      socket.off('chat:typing', handleTyping);
    };
  }, [socket, selectedUser?._id, peerUser?._id]);

  const triggerTyping = (value) => {
    setText(value);
    if (!socket || !selectedUser?._id || !peerUser?._id) return;
    socket.emit('chat:typing', {
      toUserId: peerUser._id,
      fromUserId: selectedUser._id
    });
  };

  const sendMessage = async ({ confirmSend = false, pendingMessageId = null } = {}) => {
    if (!text.trim()) return;

    try {
      const { data, status } = await api.post(endpoints.sendMessage, {
        senderId: selectedUser._id,
        receiverId: peerUser._id,
        text,
        confirmSend,
        pendingMessageId
      });

      if (status === 202 || data.status === 'warning') {
        setWarningState({
          open: true,
          reason: data.reason,
          pendingMessage: data.message
        });
        return;
      }

      if (data.status === 'sent') {
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(data.message._id))) return prev;
          return [...prev, data.message];
        });
        setText('');
        setWarningState({ open: false, reason: '', pendingMessage: null });
      }
    } catch (error) {
      const response = error.response?.data;

      if (error.response?.status === 403 && response?.status === 'blocked') {
        setToast({ message: 'Message blocked: severe harmful language detected.', tone: 'error' });
        setText('');
      } else {
        setToast({ message: 'Message failed to send.', tone: 'error' });
      }
    }
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <article className="card-surface grid-noise min-h-[560px] p-4 md:p-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <p className="font-display text-xl font-extrabold">Live Moderated Chat</p>
            <p className="text-sm text-slate-600">
              Messages are screened in real time before delivery.
            </p>
          </div>
          <SafetyPill level={typingUserId ? 'medium' : 'low'} />
        </div>

        <div className="mt-4 flex h-[390px] flex-col gap-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white/75 p-3">
          {isLoading && <p className="text-sm text-slate-500">Loading conversation...</p>}
          {!isLoading && messages.length === 0 && (
            <p className="text-sm text-slate-500">No messages yet. Start a conversation.</p>
          )}

          {messages.map((message) => {
            const isOwn = String(message.senderId) === String(selectedUser?._id);
            const severity = message?.moderation?.severity || 'low';
            const isToxic = severity === 'medium' || severity === 'high';

            return (
              <div
                key={message._id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  isOwn ? 'self-end bg-ink text-white' : 'self-start bg-slate-100 text-slate-900'
                } ${isToxic ? 'ring-2 ring-coral/50' : ''}`}
              >
                <p>{message.text}</p>
                <div className="mt-1 flex items-center gap-2 text-[11px] opacity-80">
                  <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
                  <SafetyPill level={severity} />
                </div>
              </div>
            );
          })}

          {typingUserId && (
            <p className="text-xs font-semibold text-amber-700">{peerUser?.displayName} is typing...</p>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={text}
            onChange={(e) => triggerTyping(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400"
          />
          <button
            onClick={() => sendMessage()}
            className="rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white"
          >
            Send
          </button>
        </div>
      </article>

      <aside className="card-surface min-h-[560px] p-5">
        <p className="font-display text-lg font-bold">Safety Guidance</p>
        <ul className="mt-3 space-y-3 text-sm text-slate-700">
          <li className="rounded-xl bg-mint/10 p-3">Low: message is delivered immediately.</li>
          <li className="rounded-xl bg-amber-100 p-3">
            Medium: warning popup asks sender to edit before posting.
          </li>
          <li className="rounded-xl bg-coral/10 p-3">High: message is blocked and moderators are notified.</li>
        </ul>

        <div className="mt-5 flex flex-col gap-2">
          <AppToast message={toast.message} tone={toast.tone} />
        </div>
      </aside>

      <WarningModal
        open={warningState.open}
        warningText={warningState.reason}
        onCancel={() => {
          setWarningState({ open: false, reason: '', pendingMessage: null });
          setText('');
        }}
        onEdit={() => {
          setWarningState({ open: false, reason: '', pendingMessage: null });
        }}
        onSendAnyway={() =>
          sendMessage({
            confirmSend: true,
            pendingMessageId: warningState.pendingMessage?._id
          })
        }
      />
    </section>
  );
}

export default ChatPage;
