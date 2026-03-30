'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Download, 
  FileText, 
  Info, 
  Map, 
  RefreshCcw,
  Microscope,
  Stethoscope,
  Terminal,
  Zap,
  Globe,
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

  // Classes sourced from SrivarsanK/oral-cancer (Edge Impulse MobileNetV2)
  const HIGH_RISK = ['oral malignant melanoma', 'squamous cell carcinoma'];
  const MEDIUM_RISK = ['lichen planus'];

  const getTriageStyle = (triage: string) => {
    if (HIGH_RISK.includes(triage.toLowerCase())) return 'text-rose-500';
    if (MEDIUM_RISK.includes(triage.toLowerCase())) return 'text-amber-500';
    return 'text-emerald-500';
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
      
      {/* 📋 Clinical Case Stream */}
      <section className="flex-1 p-6 lg:p-12 overflow-y-auto overflow-x-hidden custom-scrollbar bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.05)_0%,transparent_50%)]">
          <div className="mb-10 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
            <div>
                <h1 className="text-3xl lg:text-4xl font-outfit font-black tracking-tighter text-white">Case Triage</h1>
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <Badge variant="secondary" className="bg-slate-900 border-slate-800">Total: {cases.length}</Badge>
                  {cases.filter(c => HIGH_RISK.includes(c.prediction_class.toLowerCase())).length > 0 && (
                    <Badge variant="destructive" className="font-black">⚠ Urgent: Malignancy Detected</Badge>
                  )}
                  {cases.filter(c => MEDIUM_RISK.includes(c.prediction_class.toLowerCase())).length > 0 && (
                    <Badge variant="secondary" className="font-black bg-amber-900/40 text-amber-400 border-amber-800">Watch: Lichen Planus</Badge>
                  )}
                </div>
            </div>
            <div className="lg:text-right">
                <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest leading-none mb-2">Live Node Feed</p>
                <Button variant="ghost" size="sm" onClick={fetchCases} className="text-xs font-bold text-slate-400 gap-2">
                   <RefreshCcw className={cn("size-3", loading ? "animate-spin" : "")} /> 
                   Refresh
                </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-24">
            <AnimatePresence mode="popLayout">
              {loading && cases.length === 0 ? (
                Array(4).fill(0).map((_, i) => (
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
                        HIGH_RISK.includes(c.prediction_class.toLowerCase()) ? "bg-rose-500/5 border-rose-500/10" :
                        MEDIUM_RISK.includes(c.prediction_class.toLowerCase()) ? "bg-amber-500/5 border-amber-500/10" :
                        "bg-emerald-500/5 border-emerald-500/10"
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
                            className={cn("h-full rounded-full",
                              HIGH_RISK.includes(c.prediction_class.toLowerCase()) ? 'bg-rose-500' :
                              MEDIUM_RISK.includes(c.prediction_class.toLowerCase()) ? 'bg-amber-500' : 'bg-emerald-500'
                            )}
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

      {/* 📊 Evidence Panel */}
      <AnimatePresence>
      {selectedCase && (
        <motion.section 
          initial={{ x: 600 }}
          animate={{ x: 0 }}
          exit={{ x: 600 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full lg:w-[500px] xl:w-[580px] border-l border-slate-900 bg-slate-950/90 backdrop-blur-3xl overflow-y-auto z-40 shadow-2xl custom-scrollbar relative"
        >
          <div className="p-8 lg:p-12 space-y-10 relative">
            <div className="flex items-center justify-between">
                <div className="font-outfit">
                  <Badge variant="cyan" className="mb-3 px-4 font-black">Clinical Deep-Dive</Badge>
                  <h2 className="text-4xl lg:text-5xl font-black tracking-tighter text-white leading-none">Evidence</h2>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" className="h-12 w-12 bg-slate-900 border border-slate-800 text-cyan-400 rounded-2xl">
                    <Download className="size-6" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-12 w-12 text-slate-500 rounded-2xl" onClick={() => setSelectedCase(null)}>
                     <Terminal className="size-6" />
                  </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/40 rounded-[2rem] border-slate-900 p-6 space-y-2">
                  <p className="uppercase tracking-widest font-black text-[9px] text-slate-500">XAI Variance</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-outfit font-black text-white">{(selectedCase.uncertainty).toFixed(3)}</span>
                  </div>
              </div>
              <div className="bg-slate-900/40 rounded-[2rem] border-slate-900 p-6 space-y-2">
                  <p className="uppercase tracking-widest font-black text-[9px] text-slate-500">Engine Score</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-outfit font-black text-emerald-500">A+</span>
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
                    {showOverlay ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </Button>
              </div>
              
              <div className="aspect-square bg-slate-950 rounded-[3rem] border border-slate-900 overflow-hidden relative shadow-2xl">
                  <img 
                    src={`${API_BASE}/cases/${selectedCase.id}/image/enhanced`} 
                    alt="Scan"
                    className={cn(
                      "absolute inset-0 w-full h-full object-cover transition-opacity duration-700",
                      showOverlay ? "opacity-40 grayscale" : "opacity-100 grayscale-0"
                    )}
                  />
                  {showOverlay && (
                    <img 
                      src={`${API_BASE}/cases/${selectedCase.id}/image/heatmap`} 
                      alt="Heatmap"
                      className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-80"
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 p-8 pt-20">
                      <div className="flex items-start gap-4">
                        <div className="w-1 h-12 bg-cyan-600 rounded-full shrink-0" />
                        <p className="text-xs font-bold text-slate-300 leading-relaxed">
                            {HIGH_RISK.includes(selectedCase.prediction_class.toLowerCase())
                              ? "High-risk malignancy signature detected. Immediate specialist review required."
                              : MEDIUM_RISK.includes(selectedCase.prediction_class.toLowerCase())
                              ? "Pre-malignant condition (Lichen Planus) detected. Close monitoring recommended."
                              : "No significant malignant patterns detected in primary specimen."}
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
                Launch Result Hub
              </Button>
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
