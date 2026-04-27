import { NavLink } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

const navItems = [
  { to: '/chat', label: 'Live Chat' },
  { to: '/feed', label: 'Social Feed' },
  { to: '/dashboard', label: 'Safety Dashboard' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/admin', label: 'Admin' }
];

function AppShell({ children }) {
  const { users, selectedUser, peerUser, setSelectedUserId, setPeerUserId } = useAppContext();

  return (
    <div className="min-h-screen pb-10">
      <header className="mx-auto mt-6 w-[95%] max-w-7xl rounded-3xl border border-white/70 bg-white/75 px-4 py-4 shadow-panel backdrop-blur-lg md:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-display text-2xl font-extrabold tracking-tight text-ink">SafeSpace AI</p>
            <p className="text-sm text-slate-600">Real-time cyberbullying prevention across chat, memes, and behavior signals.</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
              Active User
              <select
                value={selectedUser?._id || ''}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.displayName} ({user.role})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
              Chat Peer
              <select
                value={peerUser?._id || ''}
                onChange={(e) => setPeerUserId(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {users
                  .filter((user) => String(user._id) !== String(selectedUser?._id))
                  .map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.displayName}
                    </option>
                  ))}
              </select>
            </label>
          </div>
        </div>

        <nav className="mt-4 flex flex-wrap gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-bold transition ${
                  isActive
                    ? 'bg-ink text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto mt-5 w-[95%] max-w-7xl">{children}</main>
    </div>
  );
}

export default AppShell;
