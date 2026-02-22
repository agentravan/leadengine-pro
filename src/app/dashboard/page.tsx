'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import Auth from '@/components/Auth';
import { LogOut, Plus, Trash2, Download, Globe, MapPin, Mail, Phone, ShieldCheck, Key } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [showAddCampaign, setShowAddCampaign] = useState(false);
    const [showBYOK, setShowBYOK] = useState(false);
    const [niche, setNiche] = useState('');
    const [location, setLocation] = useState('');
    const [apiKey, setApiKey] = useState('');
    const router = useRouter();

    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setProfile(profile);
                if (!profile?.google_api_key) {
                    setShowBYOK(true);
                }
                fetchData(user.id);
            }
            setLoading(false);
        };
        getUser();
    }, []);

    const fetchData = async (userId: string) => {
        const { data: campaignsData } = await supabase.from('campaigns').select('*').eq('user_id', userId);
        const { data: leadsData } = await supabase.from('leads').select('*').eq('user_id', userId).order('fetched_at', { ascending: false });
        setCampaigns(campaignsData || []);
        setLeads(leadsData || []);
    };

    const handleSaveApiKey = async () => {
        const { error } = await supabase.from('profiles').update({ google_api_key: apiKey }).eq('id', user.id);
        if (!error) {
            setProfile({ ...profile, google_api_key: apiKey });
            setShowBYOK(false);
        }
    };

    const handleAddCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        await supabase.from('campaigns').insert({ user_id: user.id, niche, location });
        setNiche(''); setLocation(''); setShowAddCampaign(false);
        fetchData(user.id);
    };

    if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Loading Enterprise SaaS...</div>;
    if (!user) return <Auth />;
    if (profile?.status === 'suspended') return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-8">
            <div className="bg-red-900/20 border border-red-900 p-8 rounded-2xl text-center max-w-md">
                <h1 className="text-3xl font-black text-red-500 mb-4">ACCESS SUSPENDED</h1>
                <p className="text-gray-400">Your account has been deactivated by the administrator. Please contact support for more information.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-zinc-950 text-gray-100 font-sans">
            {/* BYOK Blur Overlay */}
            {showBYOK && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xl">
                    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md w-full shadow-2xl">
                        <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center mb-6 text-indigo-500">
                            <Key size={32} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Activate Account</h2>
                        <p className="text-gray-400 mb-6">Enter your Google Places API Key to enable automated lead generation for your dashboard.</p>
                        <input
                            placeholder="AIzaSyC..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full bg-zinc-800 border-zinc-700 py-3 px-4 rounded-xl mb-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                            onClick={handleSaveApiKey}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl font-bold transition-all"
                        >
                            Save & Continue
                        </button>
                    </div>
                </div>
            )}

            {/* Navbar */}
            <nav className="border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md px-8 py-4 flex justify-between items-center sticky top-0 z-50">
                <h1 className="text-xl font-black text-white flex items-center gap-2">
                    <ShieldCheck className="text-indigo-500" /> LEADENGINE <span className="text-[10px] bg-indigo-900/50 text-indigo-400 px-2 py-0.5 rounded uppercase">Client</span>
                </h1>
                <div className="flex items-center gap-4">
                    {profile?.role === 'admin' && (
                        <button
                            onClick={() => router.push('/admin')}
                            className="text-xs bg-red-900/30 text-red-500 border border-red-900/50 px-3 py-1 rounded-full font-bold hover:bg-red-900/50 transition-all uppercase"
                        >
                            Master CRM
                        </button>
                    )}
                    <button
                        onClick={() => supabase.auth.signOut().then(() => setUser(null))}
                        className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
                    >
                        <LogOut size={20} className="text-gray-500" />
                    </button>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto p-8 space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-4xl font-black tracking-tight">Campaigns</h2>
                        <p className="text-gray-500 mt-1">Daily Automated Lead Extraction</p>
                    </div>
                    <button
                        onClick={() => setShowAddCampaign(true)}
                        className="bg-white text-black px-6 py-3 rounded-2xl font-black hover:bg-gray-200 transition-all shadow-xl"
                    >
                        Create New Campaign
                    </button>
                </div>

                {/* Campaign List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {campaigns.map((c) => (
                        <div key={c.id} className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 bg-indigo-600/10 text-indigo-500 text-[10px] uppercase font-black px-4 rounded-bl-xl tracking-widest">
                                Processing Every 24h
                            </div>
                            <h3 className="text-2xl font-bold mb-1">{c.niche}</h3>
                            <p className="text-gray-500 flex items-center gap-2 text-sm mb-6 uppercase tracking-wider">
                                <MapPin size={16} /> {c.location}
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1 bg-green-900/20 text-green-500 rounded-full text-xs font-bold ring-1 ring-green-900/50">
                                    <Activity size={12} /> Active
                                </div>
                                <span className="text-gray-600 text-[10px] font-bold">25 LEADS / DAY</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Leads Grid */}
                <div className="space-y-6">
                    <div className="flex justify-between items-end">
                        <h3 className="text-2xl font-bold">Latest Leads</h3>
                        <button className="text-indigo-500 font-bold text-sm flex items-center gap-2 hover:underline">
                            <Download size={18} /> Export Results
                        </button>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
                        <table className="w-full text-left">
                            <thead className="bg-zinc-950 border-b border-zinc-800">
                                <tr className="text-gray-600 text-[10px] uppercase font-black tracking-widest">
                                    <th className="p-6">Company</th>
                                    <th className="p-6">Contact info</th>
                                    <th className="p-6">Location</th>
                                    <th className="p-6 text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {leads.map(l => (
                                    <tr key={l.id} className="hover:bg-zinc-800/30 transition-colors">
                                        <td className="p-6">
                                            <div className="font-bold text-white mb-1">{l.company_name}</div>
                                            {l.website && <a href={l.website} className="text-indigo-500 text-xs flex items-center gap-1 hover:underline"><Globe size={12} /> Website</a>}
                                        </td>
                                        <td className="p-6">
                                            {l.email ? (
                                                <div className="flex items-center gap-2 text-sm text-gray-300"><Mail size={14} className="text-indigo-400" /> {l.email}</div>
                                            ) : (
                                                <div className="text-[10px] uppercase font-black text-zinc-600">Scraping Local Domain...</div>
                                            )}
                                            {l.phone && <div className="flex items-center gap-2 text-sm text-gray-400 mt-1"><Phone size={14} /> {l.phone}</div>}
                                        </td>
                                        <td className="p-6 text-sm text-zinc-500 max-w-xs">{l.address}</td>
                                        <td className="p-6 text-right text-xs text-zinc-600 font-mono italic">
                                            {new Date(l.fetched_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
