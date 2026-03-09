import React, { useEffect, useState } from 'react';
import { 
  Users, 
  MessageSquare, 
  Zap, 
  Shield, 
  Music, 
  BarChart3, 
  Settings,
  Activity,
  Award,
  Coins
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface Stats {
  totalUsers: number;
  topUsers: Array<{ id: string; level: number; xp: number }>;
  serverStats: Array<{ date: string; messages_sent: number; commands_used: number }>;
}

export default function App() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => console.error("Failed to fetch stats:", err));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#141414]"></div>
          <p className="text-[#141414] uppercase tracking-widest text-sm">Initializing LEViO...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Sidebar */}
      <nav className="fixed left-0 top-0 h-full w-64 border-r border-[#141414] p-8 flex flex-col gap-8 bg-[#E4E3E0] z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#141414] rounded-full flex items-center justify-center">
            <Zap className="text-[#E4E3E0] w-6 h-6" />
          </div>
          <h1 className="font-serif italic text-2xl tracking-tight">LEViO</h1>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">Main Menu</p>
          <NavItem icon={<Activity size={18} />} label="Overview" active />
          <NavItem icon={<Shield size={18} />} label="Moderation" />
          <NavItem icon={<Music size={18} />} label="Music Player" />
          <NavItem icon={<Award size={18} />} label="Leveling" />
          <NavItem icon={<Coins size={18} />} label="Economy" />
          <NavItem icon={<Settings size={18} />} label="Settings" />
        </div>

        <div className="mt-auto border-t border-[#141414] pt-8">
          <div className="flex items-center gap-3 p-3 border border-[#141414] rounded-lg">
            <div className="w-8 h-8 bg-[#141414] rounded-full"></div>
            <div>
              <p className="text-xs font-bold">Admin Panel</p>
              <p className="text-[10px] opacity-50">v1.2.4-stable</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pl-64 p-12">
        <header className="flex justify-between items-end mb-12 border-b border-[#141414] pb-8">
          <div>
            <p className="font-serif italic text-sm opacity-50 mb-1">System Status: Optimal</p>
            <h2 className="text-4xl font-bold tracking-tighter uppercase">Server Analytics</h2>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Uptime</p>
              <p className="font-mono text-xl">99.98%</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Latency</p>
              <p className="font-mono text-xl">24ms</p>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-8 mb-12">
          <StatCard label="Total Members" value={stats?.totalUsers || 0} change="+12%" />
          <StatCard label="Messages (24h)" value={stats?.serverStats[0]?.messages_sent || 0} change="+5.4%" />
          <StatCard label="Commands Used" value={stats?.serverStats[0]?.commands_used || 0} change="+2.1%" />
          <StatCard label="Active Voice" value="14" change="Stable" />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-3 gap-8 mb-12">
          <div className="col-span-2 border border-[#141414] p-8 rounded-2xl bg-white/50">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-serif italic text-xl">Message Activity</h3>
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-[#141414]"></span>
                <span className="text-[10px] uppercase font-bold opacity-40">Weekly View</span>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.serverStats.reverse()}>
                  <defs>
                    <linearGradient id="colorMsg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#141414" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#141414" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#141414" strokeOpacity={0.1} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontFamily: 'monospace'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontFamily: 'monospace'}} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#141414', border: 'none', borderRadius: '8px', color: '#E4E3E0'}}
                    itemStyle={{color: '#E4E3E0', fontFamily: 'monospace'}}
                  />
                  <Area type="monotone" dataKey="messages_sent" stroke="#141414" strokeWidth={2} fillOpacity={1} fill="url(#colorMsg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-[#141414] p-8 rounded-2xl bg-[#141414] text-[#E4E3E0]">
            <h3 className="font-serif italic text-xl mb-8">Top Chatters</h3>
            <div className="flex flex-col gap-6">
              {stats?.topUsers.map((user, i) => (
                <div key={user.id} className="flex items-center justify-between border-b border-[#E4E3E0]/20 pb-4 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs opacity-40">0{i+1}</span>
                    <div>
                      <p className="text-sm font-bold truncate w-24">User_{user.id.slice(-4)}</p>
                      <p className="text-[10px] opacity-50 uppercase tracking-widest">Level {user.level}</p>
                    </div>
                  </div>
                  <p className="font-mono text-sm">{user.xp} XP</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Events Table */}
        <div className="border border-[#141414] rounded-2xl overflow-hidden">
          <div className="bg-[#141414] p-4 flex justify-between items-center">
            <h3 className="text-[#E4E3E0] font-serif italic">Recent Moderation Logs</h3>
            <button className="text-[10px] text-[#E4E3E0] uppercase tracking-widest font-bold border border-[#E4E3E0]/30 px-3 py-1 rounded-full hover:bg-[#E4E3E0] hover:text-[#141414] transition-colors">
              View All
            </button>
          </div>
          <div className="bg-white/30">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#141414]/10">
                  <th className="p-4 text-[10px] uppercase tracking-widest opacity-40 font-bold">Timestamp</th>
                  <th className="p-4 text-[10px] uppercase tracking-widest opacity-40 font-bold">Action</th>
                  <th className="p-4 text-[10px] uppercase tracking-widest opacity-40 font-bold">User</th>
                  <th className="p-4 text-[10px] uppercase tracking-widest opacity-40 font-bold">Moderator</th>
                  <th className="p-4 text-[10px] uppercase tracking-widest opacity-40 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                <TableRow time="14:22:01" action="Mute (1h)" user="Shadow#4421" mod="LEViO_AI" status="Active" />
                <TableRow time="13:45:12" action="Warning" user="Ghost_99" mod="Mod_Sarah" status="Logged" />
                <TableRow time="12:10:55" action="Slowmode" user="General" mod="LEViO_AI" status="Expired" />
                <TableRow time="11:05:33" action="Ban" user="SpamBot_X" mod="Admin_Dave" status="Permanent" />
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${active ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'}`}>
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function StatCard({ label, value, change }: { label: string, value: string | number, change: string }) {
  return (
    <div className="border border-[#141414] p-6 rounded-2xl bg-white/50 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all group cursor-default">
      <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-4 group-hover:text-[#E4E3E0]/60">{label}</p>
      <div className="flex items-baseline justify-between">
        <h4 className="text-3xl font-bold tracking-tighter font-mono">{value}</h4>
        <span className="text-[10px] font-mono opacity-60">{change}</span>
      </div>
    </div>
  );
}

function TableRow({ time, action, user, mod, status }: { time: string, action: string, user: string, mod: string, status: string }) {
  return (
    <tr className="border-b border-[#141414]/5 hover:bg-[#141414]/5 transition-colors cursor-pointer">
      <td className="p-4 font-mono text-xs opacity-60">{time}</td>
      <td className="p-4 font-bold text-sm">{action}</td>
      <td className="p-4 text-sm">{user}</td>
      <td className="p-4 text-sm italic font-serif">{mod}</td>
      <td className="p-4">
        <span className="text-[9px] uppercase font-bold border border-[#141414] px-2 py-0.5 rounded-full">
          {status}
        </span>
      </td>
    </tr>
  );
}
