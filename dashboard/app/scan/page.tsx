'use client';

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Upload, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  Zap, 
  Trash2, 
  CheckCircle2, 
  FileText,
  Activity,
  Brain,
  Scan,
  AlertTriangle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API_BASE = "http://localhost:8000/api/v1";

interface FeaturesSummary {
  red_ratio: number;
  white_patch_ratio: number;
  red_patch_ratio: number;
  glcm_contrast: number;
  glcm_homogeneity: number;
  edge_density: number;
  lbp_entropy: number;
  feature_vector_length: number;
}

interface IngestResponse {
  id: string;
  filename: string;
  quality: 'pass' | 'fail';
  blur_score: number;
  prediction: string;
  confidence: number;
  uncertainty: number;
  entropy: number;
  referral: boolean;
  heatmap_path?: string;
  report_pdf_path?: string;
  features_summary?: FeaturesSummary;
  message: string;
}

export default function ScanPage() {
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IngestResponse | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const isCancer = (cls: string) => cls.toUpperCase() === 'CANCER';
  const getVerdictColor = (cls: string) =>
    isCancer(cls) ? 'text-rose-500' : 'text-emerald-500';
  const getVerdictBg = (cls: string) =>
    isCancer(cls) ? 'bg-rose-500/5 border-rose-500/20' : 'bg-emerald-500/5 border-emerald-500/20';

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadingSteps = [
    { icon: Scan, text: 'Preprocessing & CLAHE enhancement...' },
    { icon: Brain, text: 'EfficientNet-B4 inference running...' },
    { icon: Sparkles, text: 'Extracting texture & color features...' },
    { icon: Activity, text: 'MC Dropout uncertainty analysis...' },
    { icon: ShieldCheck, text: 'Generating clinical report...' },
  ];

  useEffect(() => {
    if (mode === 'camera' && !image) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode, image]);

  useEffect(() => {
    if (!isLoading) { setLoadingStep(0); return; }
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 1200);
    return () => clearInterval(interval);
  }, [isLoading]);

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 } } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setError("Camera access blocked.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setImage(dataUrl);
        fetch(dataUrl).then(res => res.blob()).then(blob => {
           setFile(new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' }));
        });
      }
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const r = new FileReader();
      r.onloadend = () => setImage(r.result as string);
      r.readAsDataURL(f);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await axios.post(`${API_BASE}/ingest/upload`, fd);
      setResult(res.data);
      if (res.data.quality === 'fail') setError(res.data.message);
    } catch {
      setError("Inference pipeline error. Check server connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => { setImage(null); setFile(null); setResult(null); setError(null); setLoadingStep(0); if (mode === 'camera') startCamera(); };

  const getRiskLevel = (feats?: FeaturesSummary) => {
    if (!feats) return null;
    const risks: string[] = [];
    if (feats.white_patch_ratio > 0.15) risks.push('Leukoplakia (white patches)');
    else if (feats.white_patch_ratio > 0.05) risks.push('Mild white patches');
    if (feats.red_patch_ratio > 0.20) risks.push('Erythroplakia (red plaques)');
    else if (feats.red_patch_ratio > 0.08) risks.push('Mild redness');
    if (feats.glcm_contrast > 50) risks.push('Irregular texture');
    if (feats.edge_density > 0.15) risks.push('Irregular borders');
    return risks;
  };

  return (
    <div className="flex-1 p-6 lg:p-12 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.02)_0%,transparent_100%)]">
      <div className="max-w-4xl mx-auto space-y-10 pb-20">
        
        <div>
           <Badge variant="cyan" className="mb-4 px-4 font-black">Oral Cancer Screening</Badge>
           <h1 className="text-5xl font-outfit font-black tracking-tighter text-white">AI Scan</h1>
           <p className="text-sm text-slate-500 mt-2">EfficientNet-B4 · MC Dropout · Grad-CAM · Feature Engineering</p>
        </div>

        <div className="grid grid-cols-2 gap-4 p-2 bg-slate-900/50 rounded-[2.5rem] border border-slate-800/60">
           <Button variant="ghost" onClick={() => { setMode('camera'); reset(); }} className={cn("h-16 rounded-[2rem] font-outfit font-black text-lg gap-3 transition-all", mode === 'camera' ? "bg-white text-slate-950" : "text-slate-400 hover:text-white")}>
             <Camera className="size-6" /> Camera
           </Button>
           <Button variant="ghost" onClick={() => { setMode('upload'); reset(); }} className={cn("h-16 rounded-[2rem] font-outfit font-black text-lg gap-3 transition-all", mode === 'upload' ? "bg-white text-slate-950" : "text-slate-400 hover:text-white")}>
             <Upload className="size-6" /> Upload
           </Button>
        </div>

        <section>
           <Card className="bg-slate-900/30 border-slate-800 rounded-[3rem] overflow-hidden backdrop-blur-3xl shadow-2xl relative">
              <CardContent className="p-0">
                 <div className="aspect-video relative bg-slate-950 flex items-center justify-center overflow-hidden">
                    <AnimatePresence mode="wait">
                      {image ? (
                        <motion.div key="pre" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full relative">
                          <img src={image} className="w-full h-full object-contain" alt="Scan" />
                          {!result && !isLoading && (
                            <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                               <Button variant="destructive" size="icon" onClick={reset} className="h-14 w-14 rounded-full shadow-2xl">
                                 <Trash2 className="size-6" />
                               </Button>
                            </div>
                          )}
                        </motion.div>
                      ) : mode === 'camera' ? (
                        <motion.div key="cam" className="w-full h-full relative">
                           <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                           <div className="absolute inset-0 border-[40px] border-slate-950/40 pointer-events-none">
                              <div className="w-full h-full border-2 border-dashed border-cyan-500/20 rounded-[2rem]" />
                           </div>
                           <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                              <Button onClick={capturePhoto} disabled={!isCameraActive} className="h-20 w-20 rounded-full bg-white text-slate-950 shadow-2xl border-[6px] border-slate-900 group">
                                <Zap className="size-8 group-hover:scale-110 transition" />
                              </Button>
                           </div>
                        </motion.div>
                      ) : (
                        <motion.div key="up" className="p-20 text-center flex flex-col items-center relative">
                           <Upload className="size-12 text-slate-700 mb-6" />
                           <p className="text-xl font-outfit font-black text-white">Drop Oral Image</p>
                           <p className="text-xs text-slate-600 mt-2">JPG, PNG — tongue, floor of mouth</p>
                           <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {isLoading && (
                      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center">
                         <Loader2 className="size-16 text-cyan-400 animate-spin mb-8" />
                         <div className="space-y-4 w-full max-w-sm">
                           {loadingSteps.map((step, i) => {
                             const Icon = step.icon;
                             const isActive = i === loadingStep;
                             const isDone = i < loadingStep;
                             return (
                               <motion.div
                                 key={i}
                                 initial={{ opacity: 0.3 }}
                                 animate={{ opacity: isDone ? 0.5 : isActive ? 1 : 0.3 }}
                                 className="flex items-center gap-3"
                               >
                                 {isDone ? (
                                   <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                                 ) : (
                                   <Icon className={cn("size-5 shrink-0", isActive ? "text-cyan-400" : "text-slate-700")} />
                                 )}
                                 <span className={cn("text-sm font-outfit font-bold", isActive ? "text-white" : isDone ? "text-slate-500" : "text-slate-700")}>{step.text}</span>
                               </motion.div>
                             );
                           })}
                         </div>
                      </div>
                    )}
                 </div>

                 {image && !result && !isLoading && (
                    <div className="p-10 flex flex-col lg:flex-row items-center justify-between gap-8 border-t border-slate-800">
                       <div className="font-outfit">
                          <h4 className="text-2xl font-black text-white">Ready for Analysis</h4>
                          <p className="text-sm text-slate-500">Image will be processed through the AI pipeline.</p>
                       </div>
                       <Button onClick={handleSubmit} className="h-16 px-12 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-outfit font-black text-lg gap-3 shadow-xl shadow-cyan-900/20 active:scale-95 transition">
                          <Brain className="size-5" /> Analyze
                       </Button>
                    </div>
                 )}
              </CardContent>
           </Card>
        </section>

        {error && !result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-4">
            <AlertCircle className="size-6 text-rose-500 shrink-0" />
            <p className="text-sm font-outfit font-bold text-rose-400">{error}</p>
          </motion.div>
        )}

        {result && (
           <motion.section initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
              {result.quality === 'fail' ? (
                <div className="p-10 rounded-[2.5rem] bg-rose-500/10 border border-rose-500/20 flex flex-col items-center gap-6">
                   <AlertCircle className="size-12 text-rose-500" />
                   <p className="text-xl font-outfit font-black text-white text-center">{result.message}</p>
                   <Button onClick={reset} className="h-14 px-8 rounded-2xl bg-rose-600 text-white hover:bg-rose-500">Retry</Button>
                </div>
              ) : (
                <>
                  {/* Primary Result Card */}
                  <Card className={cn("rounded-[3rem] border-2 p-10 relative overflow-hidden", getVerdictBg(result.prediction))}>
                     <div className="absolute top-0 right-0 p-8 opacity-5">
                        {isCancer(result.prediction) ? (
                          <AlertTriangle className="size-40 text-rose-500" />
                        ) : (
                          <CheckCircle2 className="size-40 text-emerald-500" />
                        )}
                     </div>
                     <div className="relative z-10">
                        <Badge variant={isCancer(result.prediction) ? "destructive" : "secondary"} className="mb-4 font-black">
                          {isCancer(result.prediction) ? '⚠ CANCER DETECTED' : '✓ NON-CANCEROUS'}
                        </Badge>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                           <div className="lg:col-span-2 space-y-4">
                              <p className={cn("text-5xl font-outfit font-black tracking-tighter", getVerdictColor(result.prediction))}>
                                {result.prediction}
                              </p>
                              <p className="text-sm text-slate-400 font-outfit">
                                {isCancer(result.prediction)
                                  ? 'AI has detected potential malignant patterns. Immediate specialist referral recommended for biopsy confirmation.'
                                  : 'No significant malignant patterns detected. Continue routine monitoring schedule.'}
                              </p>
                              {result.referral && (
                                <div className="flex items-center gap-3 mt-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                                  <AlertTriangle className="size-5 text-rose-500 shrink-0" />
                                  <p className="text-sm font-bold text-rose-400">Referral flagged — specialist review required</p>
                                </div>
                              )}
                           </div>
                           <div className="space-y-3">
                              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                                <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Confidence</p>
                                <p className="text-3xl font-outfit font-black text-white">{(result.confidence * 100).toFixed(1)}%</p>
                              </div>
                              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                                <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Uncertainty</p>
                                <p className="text-3xl font-outfit font-black text-white">{result.uncertainty.toFixed(4)}</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </Card>

                  {/* Feature Engineering Results */}
                  {result.features_summary && (
                    <Card className="bg-slate-900/30 border-slate-800 rounded-[3rem] p-8">
                       <div className="flex items-center gap-3 mb-6">
                         <Sparkles className="size-5 text-cyan-400" />
                         <h3 className="text-xl font-outfit font-black text-white">Feature Analysis</h3>
                       </div>
                       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                         {[
                           { label: 'Red Ratio', value: result.features_summary.red_ratio, format: (v: number) => (v * 100).toFixed(1) + '%', warn: result.features_summary.red_ratio > 0.4 },
                           { label: 'White Patches', value: result.features_summary.white_patch_ratio, format: (v: number) => (v * 100).toFixed(1) + '%', warn: result.features_summary.white_patch_ratio > 0.05 },
                           { label: 'Red Patches', value: result.features_summary.red_patch_ratio, format: (v: number) => (v * 100).toFixed(1) + '%', warn: result.features_summary.red_patch_ratio > 0.08 },
                           { label: 'GLCM Contrast', value: result.features_summary.glcm_contrast, format: (v: number) => v.toFixed(2), warn: result.features_summary.glcm_contrast > 50 },
                           { label: 'Homogeneity', value: result.features_summary.glcm_homogeneity, format: (v: number) => v.toFixed(3), warn: false },
                           { label: 'Edge Density', value: result.features_summary.edge_density, format: (v: number) => (v * 100).toFixed(1) + '%', warn: result.features_summary.edge_density > 0.15 },
                           { label: 'LBP Entropy', value: result.features_summary.lbp_entropy, format: (v: number) => v.toFixed(2), warn: false },
                           { label: 'Features', value: result.features_summary.feature_vector_length, format: (v: number) => v + ' dims', warn: false },
                         ].map((feat, i) => (
                           <div key={i} className={cn(
                             "p-4 rounded-2xl border",
                             feat.warn ? "bg-amber-500/5 border-amber-500/20" : "bg-slate-950/50 border-slate-800"
                           )}>
                             <p className="text-[10px] text-slate-500 font-black uppercase mb-1">{feat.label}</p>
                             <p className={cn("text-xl font-outfit font-black", feat.warn ? "text-amber-400" : "text-white")}>
                               {feat.format(feat.value)}
                             </p>
                           </div>
                         ))}
                       </div>

                       {/* Risk Indicators */}
                       {getRiskLevel(result.features_summary)?.length ? (
                         <div className="mt-6 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                           <p className="text-[10px] text-amber-400 font-black uppercase mb-2">Clinical Indicators</p>
                           <div className="flex flex-wrap gap-2">
                             {getRiskLevel(result.features_summary)?.map((risk, i) => (
                               <Badge key={i} className="bg-amber-900/30 text-amber-400 border-amber-800 font-bold">{risk}</Badge>
                             ))}
                           </div>
                         </div>
                       ) : null}
                    </Card>
                  )}

                  {/* Actions */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                     <Button 
                       className="h-16 rounded-[2rem] bg-slate-800 text-white font-outfit font-black border-slate-700 gap-3" 
                       onClick={() => window.open(`${API_BASE}/cases/${result.id}/report/pdf`, '_blank')}
                     >
                       <FileText className="size-5" /> View Clinical Report
                     </Button>
                     <Button 
                       className="h-16 rounded-[2rem] bg-cyan-600 text-white font-outfit font-black gap-3"
                       onClick={reset}
                     >
                       <ArrowRight className="size-5" /> New Scan
                     </Button>
                  </div>
                </>
              )}
           </motion.section>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
