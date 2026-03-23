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
  FileText 
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

export default function ScanPage() {
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (mode === 'camera' && !image) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode, image]);

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1210 } } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setError("Camera access blocked by specialist protocol.");
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
           setFile(new File([blob], `tissue_${Date.now()}.jpg`, { type: 'image/jpeg' }));
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
    } catch (err) {
      setError("Cloud ingestion failure.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => { setImage(null); setFile(null); setResult(null); setError(null); if (mode === 'camera') startCamera(); };

  return (
    <div className="flex-1 p-6 lg:p-12 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.02)_0%,transparent_100%)]">
      <div className="max-w-4xl mx-auto space-y-12 pb-20">
        
        <div>
           <Badge variant="cyan" className="mb-4 px-4 font-black">Clinical Intake</Badge>
           <h1 className="text-5xl font-outfit font-black tracking-tighter text-white">Specimen Scan</h1>
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
                          <img src={image} className="w-full h-full object-contain" alt="Specimen" />
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
                           <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale-[0.2]" />
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
                        <motion.div key="up" className="p-20 text-center flex flex-col items-center">
                           <Upload className="size-12 text-slate-700 mb-6" />
                           <p className="text-xl font-outfit font-black text-white">Drop Clinical Specimen</p>
                           <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {isLoading && (
                      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center">
                         <Loader2 className="size-16 text-cyan-400 animate-spin mb-6" />
                         <p className="text-3xl font-outfit font-black text-white tracking-tighter">AI Processing...</p>
                      </div>
                    )}
                 </div>

                 {image && !result && !isLoading && (
                    <div className="p-10 flex flex-col lg:flex-row items-center justify-between gap-8 border-t border-slate-800">
                       <div className="font-outfit">
                          <h4 className="text-2xl font-black text-white">Review Required</h4>
                          <p className="text-sm text-slate-500">Confirm scan clarity before engine push.</p>
                       </div>
                       <Button onClick={handleSubmit} className="h-16 px-12 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-outfit font-black text-lg gap-3 shadow-xl shadow-cyan-900/20 active:scale-95 transition">
                          <Zap className="size-5" /> Push to AI
                       </Button>
                    </div>
                 )}
              </CardContent>
           </Card>
        </section>

        {result && (
           <motion.section initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              {result.quality === 'fail' ? (
                <div className="p-10 rounded-[2.5rem] bg-rose-500/10 border border-rose-500/20 flex flex-col items-center gap-6">
                   <AlertCircle className="size-12 text-rose-500" />
                   <p className="text-xl font-outfit font-black text-white text-center">{result.message}</p>
                   <Button onClick={reset} className="h-14 px-8 rounded-2xl bg-rose-600 text-white hover:bg-rose-500">Retry Specimen</Button>
                </div>
              ) : (
                <Card className="bg-slate-900 rounded-[3rem] border-slate-800 p-12 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-10">
                      <CheckCircle2 className="size-40 text-emerald-500" />
                   </div>
                   <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div className="space-y-6">
                         <h3 className="text-5xl font-outfit font-black text-white tracking-tighter">Triage Success</h3>
                         <div className="p-8 bg-slate-950 rounded-[2.5rem] border border-slate-800">
                            <p className="text-[10px] text-slate-500 font-black uppercase mb-3">AI Verdict</p>
                            <p className={cn("text-4xl font-black font-outfit", ['Malignant', 'Pre-malignant'].includes(result.prediction) ? "text-rose-500" : "text-emerald-500")}>{result.prediction}</p>
                         </div>
                      </div>
                      <div className="flex flex-col justify-end gap-4">
                         <Button className="h-16 rounded-[2rem] bg-slate-800 text-white font-outfit font-black border-slate-700" onClick={() => window.open(`${API_BASE}/cases/${result.id}/report/pdf`, '_blank')}>View PDF</Button>
                         <Link href="/" className="h-full"><Button className="w-full h-16 rounded-[2rem] bg-cyan-600 text-white font-outfit font-black">Finalize & Return</Button></Link>
                      </div>
                   </div>
                </Card>
              )}
           </motion.section>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
