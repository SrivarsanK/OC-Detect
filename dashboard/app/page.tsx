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
  ClipboardList,
  Menu,
  X,
  Plus
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

// 🔍 Utility: Responsive Size Detection
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    ...windowSize,
    isMobile: windowSize.width < 768,
    isTablet: windowSize.width >= 768 && windowSize.width < 1024,
    isDesktop: windowSize.width >= 1024,
    isLargeDesktop: windowSize.width >= 1440,
  };
}

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const size = useWindowSize();

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

  // 📐 Dynamic Layout Configuration
  const layoutStyle = {
    flexDirection: size.isMobile ? 'column' : 'row' as any,
    sidebarWidth: size.isMobile ? '100%' : (size.isTablet ? '80px' : '280px'),
    panelWidth: size.isLargeDesktop ? '580px' : (size.isDesktop ? '480px' : '100%'),
  };

  return (
    <div 
      className="flex bg-background text-foreground font-sans selection:bg-cyan-500/30 overflow-hidden min-h-screen"
      style={{ flexDirection: layoutStyle.flexDirection }}
    >
      
      {/* 🚀 Adaptive Sidebar Navigation */}
      <AnimatePresence>
        {(size.isDesktop || sidebarOpen) && (
          <motion.aside 
            initial={size.isMobile ? { x: -300 } : { opacity: 0 }}
            animate={size.isMobile ? { x: 0 } : { opacity: 1 }}
            exit={size.isMobile ? { x: -300 } : { opacity: 0 }}
            className={cn(
              "border-r border-slate-900 bg-slate-950/50 backdrop-blur-3xl flex flex-col items-center lg:items-stretch group/sidebar z-[100] transition-all",
              size.isMobile ? "fixed inset-y-0 left-0 w-72 shadow-2xl" : "h-screen shrink-0"
            )}
            style={{ width: size.isMobile ? '280px' : layoutStyle.sidebarWidth }}
          >
            <div className="px-6 py-8 mb-4 lg:mb-12 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-600 rounded-xl shadow-lg shadow-cyan-500/20 flex-shrink-0">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                {!size.isTablet && (
                  <div className="block overflow-hidden whitespace-nowrap">
                    <span className="text-xl font-outfit font-black tracking-tight text-white leading-none">OralGuard</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1 block">Specialist Portal</span>
                  </div>
                )}
              </div>
              {size.isMobile && (
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="text-slate-500">
                  <X className="size-6" />
                </Button>
              )}
            </div>

            <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
               <Button variant="ghost" className={cn("w-full justify-start gap-4 px-4 py-6 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20")}>
                  <LayoutDashboard className="size-6 shrink-0" />
                  {!size.isTablet && <span>Triage Stream</span>}
               </Button>
               <Button variant="ghost" className="w-full justify-start gap-4 px-4 py-6 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-900">
                  <History className="size-6 text-slate-500 shrink-0" />
                  {!size.isTablet && <span>Clinical Archive</span>}
               </Button>
               <Button variant="ghost" className="w-full justify-start gap-4 px-4 py-6 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-900">
                  <Microscope className="size-6 text-slate-500 shrink-0" />
                  {!size.isTablet && <span>AI Analytics</span>}
               </Button>
               <Button variant="ghost" className="w-full justify-start gap-4 px-4 py-6 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-900">
                  <Globe className="size-6 text-slate-500 shrink-0" />
                  {!size.isTablet && <span>Node Settings</span>}
               </Button>
            </nav>

            <div className="px-4 py-8 space-y-4">
              <Separator className="my-4 bg-slate-900" />
              <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-[2rem] border border-slate-800">
                 <div className="w-10 h-10 bg-cyan-500/20 rounded-full border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-black shrink-0">
                   DS
                 </div>
                 {!size.isTablet && (
                   <div className="flex-1 overflow-hidden font-outfit">
                      <p className="text-sm font-black truncate text-white leading-tight">Dr. Specialist</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase truncate tracking-widest mt-0.5">Oncology</p>
                   </div>
                 )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* 🖥️ Main Workspace */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Top Control Bar */}
        <header className="h-20 border-b border-slate-900 bg-slate-950/50 backdrop-blur-xl px-6 lg:px-12 flex items-center justify-between z-10 shrink-0 gap-4">
          <div className="flex items-center gap-4">
            {size.isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="text-white">
                <Menu className="size-6" />
              </Button>
            )}
            <div className={cn(
              "flex items-center gap-4 bg-slate-900/40 px-5 py-2.5 rounded-[1.5rem] border border-slate-800/50 transition-all focus-within:border-cyan-500/50",
              size.isMobile ? "w-auto" : "w-[400px]"
            )}>
              <Search className="size-4 text-slate-500" />
              <input 
                type="text" 
                placeholder={size.isMobile ? "Scan ID..." : "Search by Patient ID or Findings..."}
                className="bg-transparent border-none outline-none text-xs font-medium w-full text-slate-200 placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
             {!size.isMobile && (
               <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                 <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Sync: Connected</span>
               </div>
             )}
             <div className="flex items-center gap-2 lg:gap-4">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                   <Bell className="size-5" />
                </Button>
                <Button 
                  onClick={fetchCases}
                  disabled={loading}
                  className="px-4 lg:px-6 h-10 lg:h-12 bg-white text-slate-950 hover:bg-cyan-50 font-outfit font-black rounded-2xl gap-3"
                >
                  <RefreshCcw className={cn("size-4", loading ? "animate-spin" : "")} />
                  <span className="hidden sm:inline">Sync Stream</span>
                </Button>
             </div>
          </div>
        </header>

        <div className={cn(
          "flex-1 flex overflow-hidden",
          size.isDesktop ? "flex-row" : "flex-col"
        )}>
          
          {/* 📋 Clinical Case Stream */}
          <section className="flex-1 p-6 lg:p-12 overflow-y-auto overflow-x-hidden custom-scrollbar bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.05)_0%,transparent_50%)]">
             <div className="mb-10 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
                <div>
                   <h1 className="text-3xl lg:text-4xl font-outfit font-black tracking-tighter text-white">Case Triage</h1>
                   <div className="flex flex-wrap items-center gap-3 mt-4">
                     <Badge variant="secondary" className="bg-slate-900 border-slate-800">Total: {cases.length}</Badge>
                     {cases.filter(c => ['Malignant', 'Pre-malignant'].includes(c.prediction_class)).length > 0 && (
                       <Badge variant="destructive" className="font-black">Urgent Focus Needed</Badge>
                     )}
                   </div>
                </div>
                <div className="lg:text-right">
                   <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest leading-none mb-2">Live Node Feed</p>
                   <p className="text-xs font-bold text-slate-400 italic">Auto-refresh active</p>
                </div>
             </div>

             <div className={cn(
                "grid gap-6 pb-24",
                size.isLargeDesktop ? "grid-cols-2" : "grid-cols-1"
             )}>
                <AnimatePresence mode="popLayout">
                  {loading && cases.length === 0 ? (
                    Array(3).fill(0).map((_, i) => (
                      <div key={i} className="h-[220px] rounded-[2.5rem] bg-slate-900/30 border border-slate-900 animate-pulse" />
                    ))
                  ) : cases.map((c, index) => (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      onClick={() => setSelectedCase(c)}
                      className={cn(
                        "group transition-all cursor-pointer relative bento-card border-[1.5px] overflow-hidden",
                        selectedCase?.id === c.id 
                        ? 'border-cyan-500 bg-slate-900 shadow-2xl' 
                        : 'border-slate-800/60 bg-slate-900/20 hover:border-cyan-500/30'
                      )}
                    >
                      <CardHeader className="flex flex-row items-center justify-between pb-6 pt-8 px-8">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "size-12 rounded-xl flex items-center justify-center border transition-all duration-300",
                            selectedCase?.id === c.id ? "bg-cyan-500 border-cyan-400 shadow-lg shadow-cyan-500/30" : "bg-slate-950 border-slate-800"
                          )}>
                             <FileText className={cn("size-6", selectedCase?.id === c.id ? "text-white" : "text-slate-600")} />
                          </div>
                          <div>
                             <CardDescription className="text-[10px] uppercase tracking-widest font-black opacity-50">NODE_{c.timestamp.split('T')[1].substring(0,5)}</CardDescription>
                             <CardTitle className="text-lg">Case {c.id.substring(0, 8)}</CardTitle>
                          </div>
                        </div>
                        <Badge variant={getStatusVariant(c.status)}>{c.status}</Badge>
                      </CardHeader>

                      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center px-8 pb-8">
                         <div className={cn(
                            "p-5 rounded-3xl border",
                            ['Malignant', 'Pre-malignant'].includes(c.prediction_class) ? "bg-rose-500/5 border-rose-500/10" : "bg-emerald-500/5 border-emerald-500/10"
                         )}>
                            <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Verdict</p>
                            <p className={cn("text-2xl font-outfit font-black tracking-tight", getTriageStyle(c.prediction_class))}>{c.prediction_class}</p>
                         </div>
                         <div className="space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-600">
                               <span>Confidence</span>
                               <span className="text-white">{(c.confidence * 100).toFixed(0)}%</span>
                            </div>
                            <div className="h-2 bg-slate-950 rounded-full overflow-hidden p-[1px] border border-slate-900">
                               <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${c.confidence * 100}%` }}
                                className={cn("h-full rounded-full", getTriageStyle(c.prediction_class).replace('text-', 'bg-'))}
                               />
                            </div>
                         </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                </AnimatePresence>
             </div>
          </section>

          {/* 📊 Evidence Panel (Now Responsive Drawer/Panel) */}
          <AnimatePresence>
          {selectedCase && (
            <motion.section 
              initial={size.isDesktop ? { x: 600 } : { y: 600 }}
              animate={size.isDesktop ? { x: 0 } : { y: 0 }}
              exit={size.isDesktop ? { x: 600 } : { y: 600 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "border-slate-900 bg-slate-950/90 backdrop-blur-3xl overflow-y-auto z-40 shadow-2xl custom-scrollbar",
                size.isDesktop ? "w-[500px] xl:w-[580px] border-l h-full" : "fixed inset-x-0 bottom-0 h-[80vh] border-t rounded-t-[3rem]"
              )}
            >
              <div className="p-8 lg:p-12 space-y-10 relative">
                {/* Close Button for Tablet/Mobile */}
                {!size.isDesktop && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-800 rounded-full cursor-pointer" onClick={() => setSelectedCase(null)} />
                )}
                
                <div className="flex items-center justify-between pt-4 lg:pt-0">
                   <div className="font-outfit">
                      <Badge variant="cyan" className="mb-3 px-4 font-black">Clinical Deep-Dive</Badge>
                      <h2 className="text-4xl lg:text-5xl font-black tracking-tighter text-white leading-none">Evidence</h2>
                   </div>
                   <div className="flex gap-2">
                     <Button size="icon" className="h-12 w-12 bg-slate-900 border border-slate-800 text-cyan-400 rounded-2xl">
                        <Download className="size-6" />
                     </Button>
                     {!size.isDesktop && (
                       <Button size="icon" variant="ghost" className="h-12 w-12 text-slate-500 rounded-2xl" onClick={() => setSelectedCase(null)}>
                         <X className="size-6" />
                       </Button>
                     )}
                   </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4 lg:gap-6">
                  <div className="bg-slate-900/40 rounded-[2rem] border-slate-900 p-6 lg:p-8 space-y-2">
                     <p className="uppercase tracking-widest font-black text-[9px] text-slate-500">XAI Variance</p>
                     <div className="flex items-baseline gap-2">
                        <span className="text-4xl lg:text-5xl font-outfit font-black text-white">{(selectedCase.uncertainty).toFixed(3)}</span>
                        <span className="text-[10px] font-black text-rose-500">Alert</span>
                     </div>
                  </div>
                  <div className="bg-slate-900/40 rounded-[2rem] border-slate-900 p-6 lg:p-8 space-y-2">
                     <p className="uppercase tracking-widest font-black text-[9px] text-slate-500">Node Sync</p>
                     <div className="flex items-baseline gap-2">
                        <span className="text-4xl lg:text-5xl font-outfit font-black text-white">12</span>
                        <span className="text-[10px] font-black text-emerald-500">ms</span>
                     </div>
                  </div>
                </div>

                {/* Scan Overlay */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 inline-flex items-center gap-2">
                        <Map className="size-4" /> AI Grad-CAM Overlay
                     </p>
                     <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowOverlay(!showOverlay)}
                      className="text-[9px] font-black uppercase text-slate-500 hover:text-white"
                     >
                       {showOverlay ? "Hide Map" : "Show Map"}
                     </Button>
                  </div>
                  
                  <div className="aspect-square bg-slate-950 rounded-[3rem] border border-slate-900 overflow-hidden relative shadow-2xl">
                      <img 
                        src={`/api/placeholder/800/800`} 
                        alt="Scan"
                        className={cn(
                          "w-full h-full object-cover transition-opacity duration-700",
                          showOverlay ? "opacity-30 grayscale" : "opacity-100 grayscale-0"
                        )}
                      />
                      {showOverlay && (
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(244,63,94,0.3)_0%,transparent_70%)] mix-blend-screen pointer-events-none">
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-40 bg-rose-500/10 rounded-full blur-3xl animate-pulse" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 p-8 pt-20">
                         <div className="flex items-start gap-4">
                            <div className="w-1 h-12 bg-cyan-600 rounded-full shrink-0" />
                            <p className="text-xs font-bold text-slate-300 leading-relaxed">
                               AI detects focal divergence in cellular patterns. Specialist intervention advised if lesion persists over 14 days.
                            </p>
                         </div>
                      </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <Button 
                    className="w-full h-16 bg-cyan-600 hover:bg-cyan-500 text-white font-outfit font-black text-lg rounded-[2.5rem] shadow-xl shadow-cyan-900/10"
                    onClick={() => window.open(`${API_BASE}/cases/${selectedCase.id}/report/pdf`, '_blank')}
                  >
                    Download Dossier
                    <ExternalLink className="size-5 ml-3 opacity-50" />
                  </Button>
                  <Button variant="ghost" className="w-full h-16 border-2 border-slate-900 rounded-[2.5rem] font-outfit font-black text-slate-600 hover:text-white hover:bg-slate-900">
                     Request Specialist Re-Scan
                  </Button>
                </div>

                <div className="p-6 bg-slate-900/30 rounded-3xl border border-dotted border-slate-800 flex items-start gap-4">
                   <Info className="size-5 text-slate-700 shrink-0 mt-0.5" />
                   <p className="text-[10px] font-bold text-slate-600 leading-normal">
                      This diagnostic tool is calibrated for high-sensitivity screening. Positive findings must be correlated with clinical history and biographic data.
                   </p>
                </div>
              </div>
            </motion.section>
          )}
          </AnimatePresence>
        </div>

        {/* 📟 Footer */}
        <footer className="h-12 border-t border-slate-900 bg-slate-950 px-6 lg:px-12 flex items-center justify-between text-[9px] lg:text-[10px] text-slate-700 font-bold uppercase tracking-[0.2em] shrink-0">
           {!size.isMobile ? (
             <div className="flex items-center gap-8">
                <span className="flex items-center gap-2 text-cyan-600">
                  <span className="size-2 bg-cyan-600 rounded-full animate-pulse"></span> INFRASTRUCTURE: NOMINAL
                </span>
                <span>ACTIVE NODES: 12</span>
                <span className="hidden lg:inline">SYNC LATENCY: 12MS</span>
             </div>
           ) : <span className="text-cyan-600">SYS_NOMINAL_EN_12</span>}
           <div>ORALGUARD &copy; 2026</div>
        </footer>
      </main>

      <style jsx global>{`
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #0f172a; border-radius: 10px; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #0f172a transparent; }
        .bento-card { transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}
