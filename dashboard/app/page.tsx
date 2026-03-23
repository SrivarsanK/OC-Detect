'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  ChevronRight, 
  Download, 
  FileText, 
  History, 
  Info, 
  LayoutDashboard, 
  Map, 
  ShieldCheck,
  Loader2,
  RefreshCcw,
  Microscope,
  Stethoscope,
  Terminal,
  Zap,
  Globe,
  Settings,
  Bell,
  Search,
  ExternalLink
} from 'lucide-react';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const API_BASE = "http://localhost:8000/api/v1";

interface Case {
  id: string;
  prediction_class: string;
  confidence: number;
  uncertainty: number;
  timestamp: string;
  status: string;
  report_pdf_path?: string;
}

export default function Home() {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const resp = await axios.get(`${API_BASE}/cases/`);
      setCases(resp.data);
    } catch (err) {
      console.error("Failed to fetch cases", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (id: string) => {
    try {
      setSyncing(id);
      await axios.post(`${API_BASE}/cases/${id}/sync`);
      setTimeout(fetchCases, 2000); 
    } catch (err) {
      console.error("Sync failed", err);
    } finally {
      setSyncing(null);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'synced': return 'success';
      case 'processed': return 'cyan';
      default: return 'outline';
    }
  };

  const getTriageStyle = (triage: string) => {
    if (['Malignant', 'Pre-malignant'].includes(triage)) return 'text-rose-500';
    if (triage === 'Benign') return 'text-amber-500';
    return 'text-emerald-500';
  };

  return (
    <div className="flex bg-background text-foreground font-sans selection:bg-cyan-500/30 overflow-hidden min-h-screen">
      
      {/* Sidebar */}
      <aside className="w-20 lg:w-72 border-r border-slate-900 bg-slate-950/50 backdrop-blur-3xl flex flex-col items-center lg:items-stretch group/sidebar py-8 z-50">
        <div className="px-6 mb-12 flex items-center gap-3">
          <div className="p-2.5 bg-cyan-600 rounded-xl shadow-lg shadow-cyan-500/20 flex-shrink-0">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div className="hidden lg:block overflow-hidden whitespace-nowrap">
            <span className="text-xl font-outfit font-black tracking-tight text-white leading-none">OralGuard</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1 block">Specialist Portal</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
           <Button variant="ghost" className="w-full justify-start gap-4 px-4 py-6 rounded-2xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-400 font-outfit font-bold border border-cyan-500/20">
              <LayoutDashboard className="size-6" />
              <span className="hidden lg:inline">Triage Stream</span>
           </Button>
           <Button variant="ghost" className="w-full justify-start gap-4 px-4 py-6 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-900 font-outfit font-bold">
              <History className="size-6 text-slate-500" />
              <span className="hidden lg:inline">Clinical Archive</span>
           </Button>
           <Button variant="ghost" className="w-full justify-start gap-4 px-4 py-6 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-900 font-outfit font-bold">
              <Microscope className="size-6 text-slate-500" />
              <span className="hidden lg:inline">AI Analytics</span>
           </Button>
        </nav>

        <div className="px-4 space-y-4">
          <Separator className="my-4" />
          <div className="hidden lg:flex items-center gap-3 p-4 bg-slate-900/50 rounded-[2rem] border border-slate-800">
             <div className="w-10 h-10 bg-cyan-500/20 rounded-full border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-black">
               DS
             </div>
             <div className="flex-1 overflow-hidden">
                <p className="text-xs font-black truncate text-white leading-tight">Dr. Specialist</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase truncate tracking-widest mt-0.5">Oncologist</p>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        <header className="h-20 border-b border-slate-900 bg-slate-950/50 backdrop-blur-xl px-12 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-4 bg-slate-900/40 px-5 py-2.5 rounded-[1.5rem] border border-slate-800/50 w-[400px]">
            <Search className="size-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by Patient ID or Finding..."
              className="bg-transparent border-none outline-none text-xs font-medium w-full text-slate-200 placeholder:text-slate-600"
            />
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]"></span>
               <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Sync: Nominal</span>
             </div>
             <Button 
              onClick={fetchCases}
              disabled={loading}
              className="px-6 h-12 bg-white text-slate-950 hover:bg-cyan-50 font-outfit font-black rounded-2xl gap-3"
             >
               <RefreshCcw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
               Synchronize
             </Button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          
          {/* Case Stream */}
          <section className="flex-1 p-12 overflow-y-auto overflow-x-hidden custom-scrollbar bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.05)_0%,transparent_50%)]">
             <div className="mb-10 flex items-end justify-between">
                <div>
                   <h1 className="text-4xl font-outfit font-black tracking-tighter text-white">Clinical Triage</h1>
                   <div className="flex items-center gap-3 mt-2">
                     <Badge variant="secondary" className="bg-slate-900 border-slate-800 px-3">Total: {cases.length}</Badge>
                     <Badge variant="destructive" className="px-3">Critical: {cases.filter(c => ['Malignant', 'Pre-malignant'].includes(c.prediction_class)).length}</Badge>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {cases.map((c) => (
                  <Card 
                    key={c.id}
                    onClick={() => setSelectedCase(c)}
                    className={`group transition-all cursor-pointer relative ${
                      selectedCase?.id === c.id 
                      ? 'border-cyan-500/50 bg-slate-900 shadow-2xl shadow-cyan-500/10' 
                      : 'hover:border-slate-700 hover:bg-slate-900/50'
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-8">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "size-12 rounded-2xl flex items-center justify-center border transition-all duration-300",
                          selectedCase?.id === c.id ? "bg-cyan-500 border-cyan-400 shadow-lg shadow-cyan-500/40" : "bg-slate-950 border-slate-800"
                        )}>
                           <FileText className={cn("size-6", selectedCase?.id === c.id ? "text-white" : "text-slate-600")} />
                        </div>
                        <div>
                           <CardDescription className="text-[9px] uppercase tracking-widest leading-none mb-1">ID: {c.id.substring(0, 10).toUpperCase()}</CardDescription>
                           <CardTitle className="text-lg">Specialist Review</CardTitle>
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(c.status)}>{c.status}</Badge>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-6 items-end">
                       <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-900">
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Primary Classification</p>
                          <p className={cn("text-2xl font-outfit font-black tracking-tighter", getTriageStyle(c.prediction_class))}>{c.prediction_class}</p>
                       </div>
                       <div className="space-y-3">
                          <div className="flex justify-between items-center px-1">
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confidence Score</p>
                             <p className="text-xs font-black">{(c.confidence * 100).toFixed(0)}%</p>
                          </div>
                          <div className="h-2 bg-slate-950 rounded-full border border-slate-900 group-hover:border-slate-800 transition-colors">
                             <div 
                              className={cn("h-full rounded-full transition-all duration-700", getTriageStyle(c.prediction_class).replace('text-', 'bg-'))}
                              style={{ width: `${c.confidence * 100}%` }}
                             />
                          </div>
                          {c.status !== 'synced' && (
                             <Button 
                                variant="outline" 
                                size="sm"
                                disabled={syncing === c.id}
                                onClick={(e) => { e.stopPropagation(); handleSync(c.id); }}
                                className="w-full h-10 rounded-xl bg-slate-950 border-slate-900 hover:border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-400 group/sync"
                             >
                               {syncing === c.id ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
                               <span>Push to Cloud</span>
                             </Button>
                          )}
                       </div>
                    </CardContent>
                  </Card>
                ))}
             </div>
          </section>

          {/* Evidence Panel */}
          <section className="w-[520px] border-l border-slate-900 bg-slate-950/80 backdrop-blur-3xl p-12 overflow-y-auto shrink-0 scrollbar-hide">
             {selectedCase ? (
               <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
                  <div className="flex items-center justify-between">
                     <div>
                        <Badge variant="cyan" className="mb-2">Evidence Review</Badge>
                        <h2 className="text-4xl font-outfit font-black tracking-tighter text-white">Diagnostic Deep-Dive</h2>
                     </div>
                     <Button size="icon-lg" variant="outline" className="border-slate-800 bg-slate-900 hover:text-cyan-400 rounded-2xl group">
                        <Download className="size-6 transition-transform group-hover:scale-110" />
                     </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <Card className="bg-slate-900/50 rounded-3xl border-slate-900 p-6 flex flex-col gap-2">
                        <CardDescription className="uppercase tracking-[0.2em] font-black text-[9px]">XAI Variance</CardDescription>
                        <div className="flex items-baseline gap-2">
                           <span className="text-4xl font-outfit font-black">{(selectedCase.uncertainty).toFixed(3)}</span>
                           <span className="text-[10px] font-bold text-rose-500">Critical</span>
                        </div>
                     </Card>
                     <Card className="bg-slate-900/50 rounded-3xl border-slate-900 p-6 flex flex-col gap-2">
                        <CardDescription className="uppercase tracking-[0.2em] font-black text-[9px]">Latency Score</CardDescription>
                        <div className="flex items-baseline gap-2">
                           <span className="text-4xl font-outfit font-black">42</span>
                           <span className="text-[10px] font-bold text-emerald-500">ms</span>
                        </div>
                     </Card>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 inline-flex items-center gap-2">
                        <Map className="size-4 text-cyan-500" /> Specialist Activation Map
                      </p>
                    </div>
                    
                    <div className="aspect-square bg-slate-950 rounded-[2.5rem] border border-slate-900 overflow-hidden relative group ring-1 ring-white/5 shadow-2xl">
                        <img 
                          src={`/api/placeholder/600/600`} 
                          alt="AI Heatmap"
                          className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-8">
                           <div className="flex items-start gap-4">
                              <div className="w-1 h-12 bg-cyan-600 rounded-full shrink-0" />
                              <p className="text-sm font-bold text-slate-200 leading-relaxed">
                                 AI highlights high-resolution pixel activations in the posterior border region. Triage recommended for suspicious texture divergence.
                              </p>
                           </div>
                        </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full h-16 bg-cyan-600 hover:bg-cyan-500 text-white font-outfit font-black text-lg rounded-[2.5rem] shadow-xl shadow-cyan-900/20 group"
                    onClick={() => {
                        window.open(`${API_BASE}/cases/${selectedCase.id}/report/pdf`, '_blank');
                    }}
                  >
                    Generate Clinical Report
                    <ExternalLink className="size-5 ml-2 opacity-50 group-hover:opacity-100" />
                  </Button>

                  <div className="flex items-start gap-4 p-6 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
                     <Info className="size-5 text-slate-600 shrink-0 mt-0.5" />
                     <p className="text-[11px] font-bold text-slate-500 leading-normal">
                        OralGuard AI prediction is a collaborative clinical assistant. Final diagnosis is subject to specialist review and biopsy confirmation where indicated.
                     </p>
                  </div>
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-800 translate-y-[-10%]">
                  <div className="size-20 bg-slate-900 rounded-[2rem] border border-white/5 flex items-center justify-center mb-6 shadow-2xl">
                    <Activity className="size-10 text-slate-800" />
                  </div>
                  <h3 className="text-xl font-outfit font-black text-slate-600 tracking-tight">System Monitor Idle</h3>
                  <p className="text-sm text-slate-700 text-center mt-3 max-w-[280px] leading-relaxed font-semibold">
                    Select a high-resolution case scan to initialize the Specialist Evidence Engine.
                  </p>
               </div>
             )}
          </section>

        </div>

        <footer className="h-12 border-t border-slate-900 bg-slate-950 px-12 flex items-center justify-between text-[10px] text-slate-700 font-bold uppercase tracking-[0.2em] shrink-0">
           <div className="flex items-center gap-8">
              <span className="flex items-center gap-2 text-cyan-600">
                <span className="size-2 bg-cyan-600 rounded-full animate-pulse"></span> INFRASTRUCTURE: ONLINE
              </span>
              <span>PHC NODES: 12</span>
              <span>SYNC LATENCY: 42MS</span>
           </div>
           <div>ORALGUARD SPECIALIST PORTAL &copy; 2026</div>
        </footer>
      </main>

      <style jsx global>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #0f172a; border-radius: 2rem; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-in-right { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-in { animation: fade-in 0.5s ease-out; }
        .slide-in-from-right-8 { animation: slide-in-right 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}
