'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Users, LayoutDashboard, Database, Activity, Mail, Trash2, Power, PowerOff, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalLeads: 0,
        activeCampaigns: 0,
        totalEmails: 0,
        serverStatus: 'Active'
    });
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        fetchGlobalData();
    }, []);

    const fetchGlobalData = async () => {
        // 1. Fetch Stats
        const { count: leadsCount } = await supabase.from('leads').select('*', { count: 'exact' });
        const { count: campaignsCount } = await supabase.from('campaigns').select('*', { count: 'exact' }).eq('is_active', true);
        const { data: leadsWithEmail } = await supabase.from('leads').select('id').not('email', 'is', null);

        setStats({
            totalLeads: leadsCount || 0,
            activeCampaigns: campaignsCount || 0,
            totalEmails: leadsWithEmail?.length || 0,
            serverStatus: 'Healthy'
        });

        // 2. Fetch Clients
        const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'client')
            .order('created_at', { ascending: false });

        setClients(profiles || []);
        setLoading(false);
    };

    const toggleClientStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
        fetchGlobalData();
    };

    if (loading) return <div className="p-8 text-white">Initializing God-Mode...</div>;

    return (
        <div className="min-h-screen bg-black text-gray-100 font-sans p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                        MASTER CRM
                    </h1>
                    <p className="text-gray-500">System Administrator Control Panel</p>
                </div>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg hover:bg-zinc-800 transition-all"
                >
                    <LayoutDashboard size={18} /> Client View
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                {[
                    { label: 'Global Leads', value: stats.totalLeads, icon: Database, color: 'text-blue-500' },
                    { label: 'Active Campaigns', value: stats.activeCampaigns, icon: Activity, color: 'text-green-500' },
                    { label: 'Emails Scraped', value: stats.totalEmails, icon: Mail, color: 'text-purple-500' },
                    { label: 'Cron Health', value: stats.serverStatus, icon: Power, color: 'text-emerald-500' },
                ].map((stat, i) => (
                    <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
                        <div className="flex justify-between items-start mb-4">
                            <stat.icon size={24} className={stat.color} />
                            <ArrowUpRight size={16} className="text-gray-600" />
                        </div>
                        <div className="text-3xl font-black">{stat.value}</div>
                        <div className="text-sm text-gray-500 uppercase tracking-wider mt-1">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Client Table */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <h2 className="text-xl font-bold flex items-center gap-2"><Users size={20} /> Manage Clients</h2>
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold">
                        Create Access ID
                    </button>
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-gray-500 text-xs uppercase tracking-widest bg-zinc-900/50">
                            <th className="p-4">Client Email</th>
                            <th className="p-4">Joined Date</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Google Key</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {clients.map((client) => (
                            <tr key={client.id} className="hover:bg-zinc-800/30 transition-colors">
                                <td className="p-4 font-bold">{client.email}</td>
                                <td className="p-4 text-gray-500">{new Date(client.created_at).toLocaleDateString()}</td>
                                <td className="p-4 text-gray-500">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${client.status === 'active' ? 'bg-green-900/30 text-green-500' : 'bg-red-900/30 text-red-500'
                                        }`}>
                                        {client.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {client.google_api_key ? (
                                        <span className="text-xs text-green-500 font-mono">ENCRYPTED/SET</span>
                                    ) : (
                                        <span className="text-xs text-gray-600 italic">NOT SET</span>
                                    )}
                                </td>
                                <td className="p-4 text-right flex justify-end gap-3">
                                    <button
                                        onClick={() => toggleClientStatus(client.id, client.status)}
                                        className={`p-2 rounded-lg transition-colors ${client.status === 'active' ? 'bg-red-900/20 text-red-500 hover:bg-red-900/40' : 'bg-green-900/20 text-green-500 hover:bg-green-900/40'
                                            }`}
                                    >
                                        {client.status === 'active' ? <PowerOff size={16} /> : <Power size={16} />}
                                    </button>
                                    <button className="p-2 bg-zinc-800 text-gray-400 rounded-lg hover:text-white transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
