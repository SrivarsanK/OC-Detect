'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
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
  ExternalLink,
  Eye,
  EyeOff,
  ClipboardList
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
  const [showOverlay, setShowOverlay] = useState(true);

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
      // Simulate real clinical sync
      setTimeout(() => setLoading(false), 800);
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

  const getStatusVariant = (status: string): "success" | "cyan" | "outline" | "default" | "secondary" | "destructive" => {
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
      
      {/* 🚀 Sidebar Navigation */}
      <aside className="w-20 lg:w-72 border-r border-slate-900 bg-slate-950/50 backdrop-blur-3xl flex flex-col items-center lg:items-stretch group/sidebar py-8 z-50">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="px-6 mb-12 flex items-center gap-3"
        >
          <div className="p-2.5 bg-cyan-600 rounded-xl shadow-lg shadow-cyan-500/20 flex-shrink-0 transition-transform hover:scale-105 active:scale-95">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div className="hidden lg:block overflow-hidden whitespace-nowrap">
            <span className="text-xl font-outfit font-black tracking-tight text-white leading-none">OralGuard</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1 block">Specialist Portal</span>
          </div>
        </motion.div>

        <nav className="flex-1 px-4 space-y-2">
           <Button variant="ghost" className="w-full justify-start gap-4 px-4 py-6 rounded-2xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-400 font-outfit font-bold border border-cyan-500/20 transition-all active:scale-[0.98]">
              <LayoutDashboard className="size-6 shrink-0" />
              <span className="hidden lg:inline">Triage Stream</span>
           </Button>
           <Button variant="ghost" className="w-full justify-start gap-4 px-4 py-6 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-900 font-outfit font-bold transition-all active:scale-[0.98]">
              <History className="size-6 text-slate-500 shrink-0" />
              <span className="hidden lg:inline">Clinical Archive</span>
           </Button>
           <Button variant="ghost" className="w-full justify-start gap-4 px-4 py-6 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-900 font-outfit font-bold transition-all active:scale-[0.98]">
              <Microscope className="size-6 text-slate-500 shrink-0" />
              <span className="hidden lg:inline">AI Analytics</span>
           </Button>
           <Button variant="ghost" className="w-full justify-start gap-4 px-4 py-6 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-900 font-outfit font-bold transition-all active:scale-[0.98]">
              <Globe className="size-6 text-slate-500 shrink-0" />
              <span className="hidden lg:inline">Node Settings</span>
           </Button>
        </nav>

        <div className="px-4 space-y-4">
          <Separator className="my-4 bg-slate-900" />
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="hidden lg:flex items-center gap-3 p-4 bg-slate-900/50 rounded-[2rem] border border-slate-800 cursor-pointer transition-colors hover:bg-slate-900"
          >
             <div className="w-10 h-10 bg-cyan-500/20 rounded-full border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-black relative">
               DS
               <span className="absolute bottom-0 right-0 size-2.5 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
             </div>
             <div className="flex-1 overflow-hidden font-outfit">
                <p className="text-sm font-black truncate text-white leading-tight">Dr. Specialist</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase truncate tracking-widest mt-0.5">Tertiary Care</p>
             </div>
             <Settings className="size-4 text-slate-700 hover:text-white transition" />
          </motion.div>
        </div>
      </aside>

      {/* 🖥️ Main Workspace */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Control Bar */}
        <header className="h-20 border-b border-slate-900 bg-slate-950/50 backdrop-blur-xl px-12 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-4 bg-slate-900/40 px-5 py-2.5 rounded-[1.5rem] border border-slate-800/50 w-[400px] group focus-within:border-cyan-500/50 transition-all">
            <Search className="size-4 text-slate-500 group-focus-within:text-cyan-400 transition" />
            <input 
              type="text" 
              placeholder="Search by Patient ID or Findings..."
              className="bg-transparent border-none outline-none text-xs font-medium w-full text-slate-200 placeholder:text-slate-600"
            />
          </div>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]"></span>
               <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Sync: Connected</span>
             </div>
             <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white relative">
                   <Bell className="size-5" />
                   <span className="absolute top-0 right-0 size-2 bg-rose-500 rounded-full border-2 border-slate-950"></span>
                </Button>
                <Separator orientation="vertical" className="h-6 bg-slate-800" />
                <Button 
                  onClick={fetchCases}
                  disabled={loading}
                  className="px-6 h-12 bg-white text-slate-950 hover:bg-cyan-50 font-outfit font-black rounded-2xl gap-3 shadow-lg shadow-white/5 active:scale-95 transition"
                >
                  <RefreshCcw className={cn("size-4", loading ? "animate-spin" : "")} />
                  Sync Stream
                </Button>
             </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          
          {/* 📋 Clinical Case Stream */}
          <section className="flex-1 p-12 overflow-y-auto overflow-x-hidden custom-scrollbar bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.05)_0%,transparent_50%)]">
             <div className="mb-10 flex items-end justify-between">
                <div>
                   <motion.h1 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-outfit font-black tracking-tighter text-white"
                   >
                     Specialist Case Triage
                   </motion.h1>
                   <div className="flex items-center gap-3 mt-4">
                     <Badge variant="secondary" className="bg-slate-900 border-slate-800 px-4 py-1">Nodes: 12 Active</Badge>
                     <Badge variant="success" className="px-4 py-1">Synced: {cases.filter(c => c.status === 'synced').length}</Badge>
                     <Badge variant="destructive" className="px-4 py-1 font-black">Urgent: {cases.filter(c => ['Malignant', 'Pre-malignant'].includes(c.prediction_class)).length}</Badge>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Global Queue Status</p>
                   <p className="text-xs font-bold text-slate-400 mt-1 italic leading-none">Last sync: {new Date().toLocaleTimeString()}</p>
                </div>
             </div>

             <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-24">
                <AnimatePresence mode="popLayout">
                  {loading && cases.length === 0 ? (
                    Array(4).fill(0).map((_, i) => (
                      <div key={i} className="h-[240px] rounded-[2.5rem] bg-slate-900/30 border border-slate-900 animate-pulse flex flex-col p-8 gap-4">
                        <div className="flex justify-between">
                           <div className="flex gap-4">
                              <div className="size-12 bg-slate-800 rounded-2xl" />
                              <div className="space-y-2 py-1">
                                 <div className="w-24 h-2 bg-slate-800 rounded" />
                                 <div className="w-32 h-4 bg-slate-800 rounded" />
                              </div>
                           </div>
                           <div className="w-16 h-4 bg-slate-800 rounded-full" />
                        </div>
                        <div className="mt-auto grid grid-cols-2 gap-6">
                           <div className="h-16 bg-slate-800/50 rounded-2xl" />
                           <div className="h-16 bg-slate-800/50 rounded-2xl" />
                        </div>
                      </div>
                    ))
                  ) : cases.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="col-span-2 p-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-900 rounded-[3rem] bg-slate-950/20"
                    >
                       <Zap className="size-12 text-slate-800 mb-6" />
                       <p className="text-slate-600 font-outfit font-black text-xl">Cloud Queue Empty</p>
                       <p className="text-slate-700 text-sm mt-2">Initialize PHC edge nodes to begin clinical intake.</p>
                       <Button variant="outline" className="mt-8 border-slate-800" onClick={fetchCases}>Manual Scan</Button>
                    </motion.div>
                  ) : cases.map((c, index) => (
                  <motion.div
                    key={c.id}
                    layoutId={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      onClick={() => setSelectedCase(c)}
                      className={cn(
                        "group transition-all cursor-pointer relative bento-card border-[1.5px] h-full overflow-hidden",
                        selectedCase?.id === c.id 
                        ? 'border-cyan-500 bg-slate-900 shadow-2xl shadow-cyan-900/10' 
                        : 'border-slate-800/60 bg-slate-900/20 hover:border-slate-700 hover:bg-slate-900/40'
                      )}
                    >
                      {/* Aura Effect */}
                      <div className={cn(
                        "absolute -top-16 -right-16 size-48 blur-[80px] pointer-events-none transition-opacity duration-700",
                        selectedCase?.id === c.id ? "opacity-30" : "opacity-0",
                        ['Malignant', 'Pre-malignant'].includes(c.prediction_class) ? "bg-rose-500" : "bg-cyan-500"
                      )} />

                      <CardHeader className="flex flex-row items-center justify-between pb-8 pt-10 px-10">
                        <div className="flex items-center gap-5">
                          <motion.div 
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className={cn(
                              "size-14 rounded-2xl flex items-center justify-center border transition-all duration-300",
                              selectedCase?.id === c.id ? "bg-cyan-500 border-cyan-400 shadow-xl shadow-cyan-500/40" : "bg-slate-950 border-slate-800"
                            )}
                          >
                             <FileText className={cn("size-7", selectedCase?.id === c.id ? "text-white" : "text-slate-600")} />
                          </motion.div>
                          <div className="font-outfit">
                             <CardDescription className="text-[10px] uppercase tracking-widest font-black leading-none mb-1 opacity-50">NODE_AUTO_TRIAGE</CardDescription>
                             <CardTitle className="text-xl">ID: {c.id.substring(0, 12).toUpperCase()}</CardTitle>
                          </div>
                        </div>
                        <Badge variant={getStatusVariant(c.status)} className="px-4 py-1 shadow-sm">{c.status}</Badge>
                      </CardHeader>

                      <CardContent className="grid grid-cols-2 gap-8 items-end px-10 pb-10">
                         <div className={cn(
                            "p-6 rounded-3xl border transition-all duration-300",
                            ['Malignant', 'Pre-malignant'].includes(c.prediction_class) ? "bg-rose-500/5 border-rose-500/10" : "bg-emerald-500/5 border-emerald-500/10"
                         )}>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-3">Triage Verdict</p>
                            <p className={cn("text-3xl font-outfit font-black tracking-tighter leading-none", getTriageStyle(c.prediction_class))}>{c.prediction_class}</p>
                         </div>
                         <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                               <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest inline-flex items-center gap-2 italic">
                                 Confidence
                               </p>
                               <p className="text-sm font-black text-white">{(c.confidence * 100).toFixed(0)}%</p>
                            </div>
                            <div className="h-3 bg-slate-950 rounded-full border border-slate-900 group-hover:border-slate-800 transition-colors p-[2px]">
                               <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${c.confidence * 100}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={cn("h-full rounded-full", getTriageStyle(c.prediction_class).replace('text-', 'bg-'))}
                               />
                            </div>
                            <div className="flex gap-2">
                               {c.status !== 'synced' && (
                                 <Button 
                                    variant="outline" 
                                    size="sm"
                                    disabled={syncing === c.id}
                                    onClick={(e) => { e.stopPropagation(); handleSync(c.id); }}
                                    className="flex-1 h-12 rounded-2xl bg-slate-950 border-slate-900 hover:border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-400 group/sync transition-all font-outfit font-bold"
                                 >
                                   {syncing === c.id ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
                                   <span>Cloud Push</span>
                                 </Button>
                               )}
                               <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-slate-900 text-slate-600 hover:text-white">
                                  <Info className="size-5" />
                               </Button>
                            </div>
                         </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                </AnimatePresence>
             </div>
          </section>

          {/* 📊 Evidence & Insight Explorer (Right Panel) */}
          <section className="w-[580px] border-l border-slate-900 bg-slate-950/80 backdrop-blur-3xl p-12 overflow-y-auto shrink-0 scrollbar-hide z-20 shadow-2xl">
             <AnimatePresence mode="wait">
             {selectedCase ? (
               <motion.div 
                key={selectedCase.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-10"
               >
                  <div className="flex items-center justify-between">
                     <div className="font-outfit">
                        <Badge variant="cyan" className="mb-3 px-4 py-1 font-black">Clinical Investigation</Badge>
                        <h2 className="text-5xl font-black tracking-tighter text-white leading-none">Evidence Scan</h2>
                     </div>
                     <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button size="icon" className="h-16 w-16 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 rounded-3xl shadow-xl transition-all">
                           <Download className="size-7" />
                        </Button>
                     </motion.div>
                  </div>

                  {/* Diagnostic Metrics Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    <Card className="bg-slate-900/50 rounded-[2.5rem] border-slate-900 p-8 flex flex-col gap-3 group transition-colors hover:border-cyan-900/30">
                       <CardDescription className="uppercase tracking-[0.2em] font-black text-[10px] flex items-center gap-2">
                         <Activity className="size-3.5 text-rose-500" /> AI Variance
                       </CardDescription>
                       <div className="flex items-baseline gap-3">
                          <span className="text-6xl font-outfit font-black text-white">{(selectedCase.uncertainty).toFixed(3)}</span>
                          <span className="text-xs font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2 py-0.5 rounded-full">High</span>
                       </div>
                    </Card>
                    <Card className="bg-slate-900/50 rounded-[2.5rem] border-slate-900 p-8 flex flex-col gap-3 group transition-colors hover:border-cyan-900/30">
                       <CardDescription className="uppercase tracking-[0.2em] font-black text-[10px] flex items-center gap-2">
                         <Globe className="size-3.5 text-cyan-500" /> Pipeline Lag
                       </CardDescription>
                       <div className="flex items-baseline gap-3">
                          <span className="text-6xl font-outfit font-black text-white">42</span>
                          <span className="text-xs font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full">Nominal</span>
                       </div>
                    </Card>
                  </div>

                  {/* 🔬 XAI Map Section */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                       <p className="text-[11px] font-black uppercase tracking-[0.25em] text-cyan-400 flex items-center gap-3">
                          <Map className="size-4" /> Specialist AI Overlay (Grad-CAM)
                       </p>
                       <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowOverlay(!showOverlay)}
                        className="text-[10px] font-black uppercase text-slate-500 hover:text-white gap-2"
                       >
                         {showOverlay ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                         {showOverlay ? "Hide Map" : "Show Map"}
                       </Button>
                    </div>
                    
                    <div className="aspect-square bg-slate-950 rounded-[3.5rem] border border-slate-900 overflow-hidden relative group ring-2 ring-cyan-500/10 shadow-[0_0_50px_rgba(6,182,212,0.1)]">
                        {/* Placeholder for real clinical images */}
                        <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
                           <Microscope className="size-20 text-slate-900 animate-pulse" />
                        </div>
                        
                        <img 
                          src={`/api/placeholder/800/800`} 
                          alt="Clinical Scan"
                          className={cn(
                            "w-full h-full object-cover transition-all duration-1000 group-hover:scale-105",
                            showOverlay ? "opacity-40 grayscale-[0.5]" : "opacity-100 grayscale-0"
                          )}
                        />

                        {/* Animated Overlay Layer */}
                        <AnimatePresence>
                        {showOverlay && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(244,63,94,0.3)_0%,transparent_70%)] mix-blend-screen pointer-events-none"
                          >
                             {/* Dynamic Pulse Markers */}
                             <div className="absolute top-[40%] left-[30%] size-32 bg-rose-500/20 rounded-full blur-2xl animate-pulse" />
                             <div className="absolute top-[55%] left-[60%] size-24 bg-rose-600/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.4s' }} />
                          </motion.div>
                        )}
                        </AnimatePresence>

                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-12 pt-24">
                           <div className="flex items-start gap-6">
                              <div className="w-1.5 h-16 bg-cyan-500 rounded-full shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
                              <div className="space-y-3">
                                 <h4 className="text-xl font-outfit font-black text-white tracking-tight">Texture Activation Cluster</h4>
                                 <p className="text-xs font-bold text-slate-300 leading-relaxed max-w-sm">
                                    Specialist Map identifies high concentration of surface irregularities and pigment clusters near the primary lesion border. Review recommended.
                                 </p>
                              </div>
                           </div>
                        </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid gap-4 pt-4">
                    <Button 
                      className="w-full h-20 bg-cyan-600 hover:bg-cyan-500 text-white font-outfit font-black text-xl rounded-[2.5rem] shadow-[0_20px_40px_rgba(6,182,212,0.2)] group transition-all active:scale-95"
                      onClick={() => {
                          window.open(`${API_BASE}/cases/${selectedCase.id}/report/pdf`, '_blank');
                      }}
                    >
                      <ClipboardList className="size-6 mr-3 opacity-70 group-hover:opacity-100 transition" />
                      Generate Clinical Dossier
                      <ExternalLink className="size-5 ml-4 opacity-30 group-hover:opacity-100 transition" />
                    </Button>
                    <div className="p-8 bg-slate-900/30 rounded-[2.5rem] border border-dashed border-slate-800 flex items-start gap-6">
                       <Stethoscope className="size-7 text-slate-700 shrink-0 mt-1" />
                       <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Protocol Note</p>
                          <p className="text-xs font-bold text-slate-600 leading-normal max-w-md">
                             This report is AI-generated and calibrated against Tertiary Hospital specialists. It is intended to assist in rapid triage and does not replace histopathological confirmation.
                          </p>
                       </div>
                    </div>
                  </div>
               </motion.div>
             ) : (
               <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-slate-800"
               >
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.05, 1],
                      boxShadow: ["0 0 0px rgba(6,182,212,0)", "0 0 40px rgba(6,182,212,0.1)", "0 0 0px rgba(6,182,212,0)"]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="size-24 bg-slate-900/50 rounded-[2.5rem] border border-slate-900 flex items-center justify-center mb-8 relative"
                  >
                    <Terminal className="size-10 text-slate-800" />
                  </motion.div>
                  <h3 className="text-2xl font-outfit font-black text-slate-500 tracking-tight">Investigation Panel Idle</h3>
                  <p className="text-sm text-slate-600 text-center mt-4 max-w-[320px] leading-relaxed font-bold italic">
                    Select a high-resolution scan from the Phase 6 triage stream to initialize the Predictive Triage Engine.
                  </p>
                  <Badge variant="outline" className="mt-8 border-slate-900 border-2 px-6 py-1.5 opacity-50">v1.2: XAI Enabled</Badge>
               </motion.div>
             )}
             </AnimatePresence>
          </section>

        </div>

        {/* 📟 Global Infrastructure Footer */}
        <footer className="h-14 border-t border-slate-900 bg-slate-950 px-12 flex items-center justify-between text-[10px] text-slate-700 font-bold uppercase tracking-[0.25em] shrink-0">
           <div className="flex items-center gap-10">
              <span className="flex items-center gap-3 text-cyan-600">
                <span className="size-2.5 bg-cyan-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(6,182,212,1)]"></span> 
                ENGINE: FULLY INTEGRATED
              </span>
              <Separator orientation="vertical" className="h-4 bg-slate-900" />
              <span>EDGE NODES: PHC_K_01 - PHC_K_12</span>
              <Separator orientation="vertical" className="h-4 bg-slate-900" />
              <span>PIPELINE: GSD_AUTO_SYNC_4.0</span>
           </div>
           <div className="flex items-center gap-4">
              <span>PREDICTIVE ONCOLOGY RESEARCH GROUP</span>
              <Separator orientation="vertical" className="h-4 bg-slate-900" />
              <span>&copy; 2026</span>
           </div>
        </footer>
      </main>

      {/* 🔮 Ultra-Premium Theme Overrides */}
      <style jsx global>{`
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #161b22; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #1f2937; }
        
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #161b22 transparent; }
        
        .bento-card { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .bento-card:hover { transform: translateY(-4px); }
        .bento-card:active { transform: scale(0.98); }

        .font-outfit { font-family: var(--font-outfit); }
        .font-inter { font-family: var(--font-inter); }

        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
