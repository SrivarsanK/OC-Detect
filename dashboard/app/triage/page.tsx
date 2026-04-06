'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Download, 
  FileText, 
  Map, 
  RefreshCcw,
  Terminal,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Brain
} from 'lucide-react';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API_BASE = "http://localhost:8000/api/v1";

interface Case {
  id: string;
  prediction_class: string;
  confidence: number;
  uncertainty: number;
  timestamp: string;
  status: string;
  report_pdf_path?: string;
  patient_id?: string;
  accession_no?: string;
  location?: string;
  gross_description?: string;
  microscopic_description?: string;
  cpt_code?: string;
}

export default function TriagePage() {
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

  const isCancer = (cls: string) => cls.toUpperCase() === 'CANCER';
  const getTriageStyle = (triage: string) => isCancer(triage) ? 'text-rose-500' : 'text-emerald-500';
  const getTriageBg = (triage: string) => isCancer(triage) ? 'bg-rose-500/5 border-rose-500/10' : 'bg-emerald-500/5 border-emerald-500/10';
  const getBarColor = (triage: string) => isCancer(triage) ? 'bg-rose-500' : 'bg-emerald-500';

  const cancerCount = cases.filter(c => isCancer(c.prediction_class)).length;
  const normalCount = cases.filter(c => !isCancer(c.prediction_class)).length;

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
      <section className="flex-1 p-4 sm:p-6 lg:p-12 overflow-y-auto overflow-x-hidden custom-scrollbar bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.05)_0%,transparent_50%)]">
          <div className="mb-8 lg:mb-10 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
            <div className="space-y-4">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-outfit font-black tracking-tighter text-white">Case Triage</h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Badge variant="secondary" className="bg-slate-900 border-slate-800 text-[10px] sm:text-xs">Total: {cases.length}</Badge>
                  {cancerCount > 0 && <Badge variant="destructive" className="font-black text-[10px] sm:text-xs">⚠ {cancerCount} Cancer</Badge>}
                  {normalCount > 0 && <Badge variant="secondary" className="font-black bg-emerald-900/40 text-emerald-400 border-emerald-800 text-[10px] sm:text-xs">✓ {normalCount} Normal</Badge>}
                </div>
            </div>
            <div className="w-full lg:w-auto flex lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-2">
                <p className="hidden lg:block text-[10px] text-slate-600 font-black uppercase tracking-widest leading-none mb-2">EfficientNet-B4 Pipeline</p>
                <Button variant="ghost" size="sm" onClick={fetchCases} className="text-xs font-bold text-slate-400 gap-2 h-10 px-4 rounded-xl border border-slate-900 lg:border-none">
                   <RefreshCcw className={cn("size-3", loading ? "animate-spin" : "")} /> Refresh
                </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 pb-24">
            <AnimatePresence mode="popLayout">
              {loading && cases.length === 0 ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-[200px] sm:h-[220px] rounded-[2rem] sm:rounded-[2.5rem] bg-slate-900/30 border border-slate-900 animate-pulse" />
                ))
              ) : cases.map((c, index) => (
              <motion.div key={c.id} layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}>
                <Card onClick={() => setSelectedCase(c)} className={cn("group transition-all cursor-pointer relative bento-card border-[1.5px] overflow-hidden", selectedCase?.id === c.id ? 'border-cyan-500 bg-slate-900 shadow-2xl scale-[1.02] z-10' : 'border-slate-800/60 bg-slate-900/20 hover:border-cyan-500/30')}>
                  <CardHeader className="flex flex-row items-center justify-between pb-4 sm:pb-6 pt-6 sm:pt-8 px-6 sm:px-8">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={cn("size-10 sm:size-12 rounded-xl flex items-center justify-center border transition-all duration-300", isCancer(c.prediction_class) ? "bg-rose-500/10 border-rose-500/30 text-rose-500" : "bg-slate-950 border-slate-800 text-slate-600")}>
                          {isCancer(c.prediction_class) ? <AlertTriangle className="size-5 sm:size-6" /> : <FileText className="size-5 sm:size-6" />}
                      </div>
                      <div>
                          <CardDescription className="text-[9px] sm:text-[10px] uppercase tracking-widest font-black opacity-50">{c.timestamp ? `NODE_${c.timestamp.split('T')[1]?.substring(0,5)}` : 'SCAN'}</CardDescription>
                          <CardTitle className="text-base sm:text-lg">Case {c.id.substring(0, 8)}</CardTitle>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(c.status)} className="text-[10px]">{c.status}</Badge>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-center px-6 sm:px-8 pb-6 sm:pb-8">
                      <div className={cn("p-4 sm:p-5 rounded-2xl sm:rounded-3xl border", getTriageBg(c.prediction_class))}>
                        <p className="text-[8px] sm:text-[10px] text-slate-500 font-black uppercase mb-1">AI Verdict</p>
                        <p className={cn("text-xl sm:text-2xl font-outfit font-black tracking-tight", getTriageStyle(c.prediction_class))}>{c.prediction_class}</p>
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-black uppercase text-slate-600">
                            <span>Confidence</span>
                            <span className="text-white">{(c.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 sm:h-2 bg-slate-950 rounded-full overflow-hidden p-[1px] border border-slate-900">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${c.confidence * 100}%` }} className={cn("h-full rounded-full", getBarColor(c.prediction_class))} />
                        </div>
                      </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
      </section>

      <AnimatePresence>
      {selectedCase && (
        <motion.section 
          initial={{ x: '100%' }} 
          animate={{ x: 0 }} 
          exit={{ x: '100%' }} 
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }} 
          className="fixed inset-0 lg:relative lg:inset-auto w-full lg:w-[450px] xl:w-[500px] border-l border-slate-900 bg-slate-950/95 lg:bg-slate-950/90 backdrop-blur-3xl overflow-y-auto z-[110] lg:z-40 shadow-2xl custom-scrollbar"
        >
          <div className="p-6 sm:p-8 lg:p-10 space-y-8 sm:space-y-10 relative">
            <div className="flex items-center justify-between">
                <div className="font-outfit">
                  <Badge variant="cyan" className="mb-3 px-4 font-black">Clinical Evidence</Badge>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-white leading-none">Analysis</h2>
                </div>
                <Button size="icon" variant="ghost" className="h-12 w-12 text-slate-500 rounded-2xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800" onClick={() => setSelectedCase(null)}><Terminal className="size-6" /></Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="bg-slate-900/40 rounded-3xl border border-slate-900/60 p-5 sm:p-6 space-y-2">
                   <p className="uppercase tracking-widest font-black text-[8px] sm:text-[9px] text-slate-500">Accession No</p>
                   <p className="text-lg sm:text-xl font-outfit font-black text-white">{selectedCase.accession_no || 'NOT_SET'}</p>
               </div>
               <div className="bg-slate-900/40 rounded-3xl border border-slate-900/60 p-5 sm:p-6 space-y-2">
                   <p className="uppercase tracking-widest font-black text-[8px] sm:text-[9px] text-slate-500">Patient ID</p>
                   <p className="text-lg sm:text-xl font-outfit font-black text-white">{selectedCase.patient_id?.substring(0, 10) || 'ANON_SCAN'}</p>
               </div>
               <div className="md:col-span-2 bg-slate-900/40 rounded-3xl border border-slate-900/60 p-5 sm:p-6 space-y-2">
                   <p className="uppercase tracking-widest font-black text-[8px] sm:text-[9px] text-slate-500">Primary Location</p>
                   <p className="text-lg sm:text-xl font-outfit font-black text-white">{selectedCase.location || 'Oral Cavity (General)'}</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/40 rounded-3xl border border-slate-900/60 p-5 sm:p-6 space-y-2">
                  <p className="uppercase tracking-widest font-black text-[8px] sm:text-[9px] text-slate-500">Uncertainty</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-outfit font-black text-white">{selectedCase.uncertainty.toFixed(3)}</p>
              </div>
              <div className="bg-slate-900/40 rounded-3xl border border-slate-900/60 p-5 sm:p-6 space-y-2">
                  <p className="uppercase tracking-widest font-black text-[8px] sm:text-[9px] text-slate-500">Confidence</p>
                  <p className={cn("text-2xl sm:text-3xl lg:text-4xl font-outfit font-black", getTriageStyle(selectedCase.prediction_class))}>{(selectedCase.confidence * 100).toFixed(0)}%</p>
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between px-2">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 flex items-center gap-2"><Map className="size-4" /> AI Heatmap Overlay</p>
                   <Button variant="ghost" size="sm" onClick={() => setShowOverlay(!showOverlay)} className="text-[9px] font-black uppercase text-slate-500">{showOverlay ? <Eye className="size-4" /> : <EyeOff className="size-4" />}</Button>
               </div>
               <div className="aspect-square bg-slate-950 rounded-[2.5rem] sm:rounded-[3rem] border border-slate-900 overflow-hidden relative shadow-2xl">
                   <img src={`${API_BASE}/cases/${selectedCase.id}/image/enhanced`} alt="Scan" className={cn("absolute inset-0 w-full h-full object-cover transition-opacity duration-700", showOverlay ? "opacity-40 grayscale" : "opacity-100 grayscale-0")} />
                   {showOverlay && <img src={`${API_BASE}/cases/${selectedCase.id}/image/heatmap`} alt="Heatmap" className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-80" />}
                   <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 p-6 sm:p-8 pt-16 sm:pt-20">
                       <div className="flex items-start gap-3 sm:gap-4">
                         <div className={cn("w-0.5 sm:w-1 h-10 sm:h-12 rounded-full shrink-0", isCancer(selectedCase.prediction_class) ? "bg-rose-600" : "bg-cyan-600")} />
                         <p className="text-xs font-bold text-slate-300 leading-relaxed">{isCancer(selectedCase.prediction_class) ? "Malignant patterns detected. Immediate specialist referral recommended." : "No significant malignant patterns detected."}</p>
                       </div>
                   </div>
               </div>
            </div>

            <div className="bg-slate-900/40 rounded-3xl border border-slate-900/60 p-6 sm:p-8 space-y-4">
               <p className="uppercase tracking-widest font-black text-[8px] sm:text-[9px] text-cyan-500 mb-2">Clinical Observations</p>
               <p className="text-sm font-bold text-slate-300 leading-relaxed italic border-l-2 border-cyan-800 pl-4 py-1">"{selectedCase.gross_description || 'No clinical observations provided.'}"</p>
            </div>

            <div className="flex flex-col gap-3 sm:gap-4 pb-12">
              <Button className="w-full h-14 sm:h-16 bg-cyan-600 hover:bg-cyan-500 text-white font-outfit font-black text-lg rounded-[1.5rem] sm:rounded-[2.5rem] shadow-xl shadow-cyan-900/20 transition-all active:scale-95" onClick={() => window.open(`${API_BASE}/cases/${selectedCase.id}/report/pdf`, '_blank')}>View Specialist Report</Button>
              <Button variant="ghost" className="w-full h-12 text-slate-500 font-bold hover:text-white" onClick={() => setSelectedCase(null)}>Close Analysis</Button>
            </div>
          </div>
        </motion.section>
      )}
      </AnimatePresence>

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
