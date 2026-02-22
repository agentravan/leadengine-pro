'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Auth from '@/components/Auth';
import { ShieldCheck, Zap, BarChart3, Users2 } from 'lucide-react';

export default function Home() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) {
                router.push('/dashboard');
            }
            setLoading(false);
        });
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!session) {
        return (
            <div className="min-h-screen bg-black text-white font-sans overflow-hidden selection:bg-indigo-500/30">
                {/* Animated Background */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 blur-[120px] rounded-full"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full"></div>
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center min-h-screen max-w-7xl mx-auto px-6 gap-16">
                    <div className="lg:w-1/2 space-y-8 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest">
                            <Zap size={14} className="fill-indigo-400" /> Enterprise Edition
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]">
                            ULTIMATE <br />
                            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                LEAD ENGINE
                            </span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
                            The world's most powerful B2B lead generation platform. Automated extraction, custom scraping, and multi-tenant isolation.
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4">
                            {[
                                { icon: ShieldCheck, text: 'RBAC Security' },
                                { icon: BarChart3, text: 'Custom Scraper' },
                                { icon: Users2, text: 'Multi-Tenant' },
                            ].map((feat, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm font-bold text-gray-300">
                                    <feat.icon size={18} className="text-indigo-500" /> {feat.text}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:w-[450px] w-full transform hover:scale-[1.01] transition-all duration-500">
                        <Auth />
                    </div>
                </div>

                <footer className="absolute bottom-4 w-full text-center text-zinc-700 text-[10px] font-bold uppercase tracking-[0.3em]">
                    Designed for high-performance sales teams
                </footer>
            </div>
        );
    }

    return null;
}
