'use client';

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowLeft,
  ShieldCheck,
  RefreshCcw,
  Zap,
  Maximize2,
  Minimize2,
  Trash2,
  FileText
} from 'lucide-react';
import Link from 'next/link';

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
import { Separator } from "@/components/ui/separator";

const API_BASE = "http://localhost:8000/api/v1";

export default function ScanPage() {
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 📷 Camera Logic
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
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access failed", err);
      setError("Unable to access camera. Please check permissions.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      setIsCapturing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setImage(dataUrl);
        
        // Convert to File object for upload
        fetch(dataUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setFile(file);
          });
      }
      setIsCapturing(false);
      stopCamera();
    }
  };

  // 📁 Upload Logic
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(uploadedFile);
    }
  };

  // 🚀 Submit Logic
  const handleSubmit = async () => {
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE}/ingest/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setResult(response.data);
      if (response.data.quality === 'fail') {
        setError(response.data.message);
      }
    } catch (err: any) {
      console.error("Upload failed", err);
      setError(err.response?.data?.detail || "System ingestion failure. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setFile(null);
    setResult(null);
    setError(null);
    if (mode === 'camera') startCamera();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden selection:bg-cyan-500/30">
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] size-[500px] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] size-[500px] bg-rose-500/5 blur-[120px] rounded-full" />
      </div>

      <main className="max-w-4xl mx-auto px-6 py-12 lg:py-20 relative z-10">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-16">
           <Link href="/" className="group flex items-center gap-3 text-slate-400 hover:text-white transition-colors font-outfit font-black uppercase tracking-widest text-xs">
              <div className="size-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 transition group-hover:bg-slate-800">
                <ArrowLeft className="size-5" />
              </div>
              Back to Portal
           </Link>
           <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <ShieldCheck className="size-5 text-emerald-400" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Status</p>
                 <p className="text-xs font-bold text-white mt-1">Specialist Secure</p>
              </div>
           </div>
        </div>

        {/* Hero Title */}
        <div className="mb-12">
           <Badge variant="cyan" className="mb-4 px-4 py-1 font-black">Clinical Intake</Badge>
           <h1 className="text-5xl lg:text-7xl font-outfit font-black tracking-tighter text-white leading-tight">
             Tissue Engine<br />
             <span className="text-slate-600">Calibration</span>
           </h1>
        </div>

        {/* Phase Selector */}
        <div className="grid grid-cols-2 gap-4 mb-10 p-2 bg-slate-900/50 rounded-[2rem] border border-slate-800/60">
           <Button 
            variant="ghost" 
            onClick={() => { setMode('camera'); reset(); }}
            className={cn(
              "h-16 rounded-[1.5rem] font-outfit font-black text-lg gap-3 transition-all",
              mode === 'camera' ? "bg-white text-slate-950 shadow-xl" : "text-slate-400 hover:text-white"
            )}
           >
             <Camera className="size-6" />
             AI Camera
           </Button>
           <Button 
            variant="ghost" 
            onClick={() => { setMode('upload'); reset(); }}
            className={cn(
              "h-16 rounded-[1.5rem] font-outfit font-black text-lg gap-3 transition-all",
              mode === 'upload' ? "bg-white text-slate-950 shadow-xl" : "text-slate-400 hover:text-white"
            )}
           >
             <Upload className="size-6" />
             Dossier Upload
           </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Action Area */}
          <section className="lg:col-span-12">
             <Card className="bg-slate-900/30 border-slate-800 rounded-[3rem] overflow-hidden backdrop-blur-3xl shadow-2xl relative">
                <CardContent className="p-0">
                   <div className="aspect-video lg:aspect-[16/9] relative bg-slate-950 flex items-center justify-center overflow-hidden">
                      
                      {/* Interaction States */}
                      <AnimatePresence mode="wait">
                        {image ? (
                          <motion.div 
                            key="preview"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full h-full relative"
                          >
                            <img src={image} className="w-full h-full object-contain" alt="Scan Preview" />
                            {!result && !isLoading && (
                              <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center group">
                                 <Button 
                                  variant="destructive" 
                                  size="icon" 
                                  onClick={reset}
                                  className="h-16 w-16 rounded-full shadow-2xl transition hover:scale-110"
                                >
                                   <Trash2 className="size-8" />
                                 </Button>
                              </div>
                            )}
                          </motion.div>
                        ) : mode === 'camera' ? (
                          <motion.div key="camera" className="w-full h-full relative">
                             <video 
                              ref={videoRef} 
                              autoPlay 
                              playsInline 
                              className="w-full h-full object-cover grayscale-[0.2]"
                             />
                             <div className="absolute inset-0 border-[60px] border-slate-950/20 pointer-events-none">
                                <div className="w-full h-full border-2 border-dashed border-cyan-500/30 rounded-[2rem] relative">
                                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-20 border-2 border-cyan-400/50 rounded-full" />
                                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-1 bg-cyan-400 rounded-full shadow-[0_0_10px_cyan]" />
                                </div>
                             </div>
                             <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
                                <Button 
                                  onClick={capturePhoto}
                                  disabled={!isCameraActive}
                                  className="h-20 w-20 rounded-full bg-white text-slate-950 shadow-[0_0_40px_rgba(255,255,255,0.4)] transition hover:scale-105 active:scale-95 border-[6px] border-slate-900"
                                >
                                  <div className="size-14 rounded-full border-2 border-slate-950 border-dashed animate-[spin_10s_linear_infinite] flex items-center justify-center">
                                    <div className="size-2 bg-slate-950 rounded-full" />
                                  </div>
                                </Button>
                             </div>
                          </motion.div>
                        ) : (
                          <motion.div key="upload-zone" className="p-20 text-center flex flex-col items-center">
                             <div className="size-24 rounded-full bg-slate-900 flex items-center justify-center border-2 border-dashed border-slate-800 mb-8 transition-colors hover:border-cyan-500/50">
                                <Upload className="size-10 text-slate-600" />
                             </div>
                             <h4 className="text-2xl font-outfit font-black text-white">Select Patient Specimen</h4>
                             <p className="text-slate-500 text-sm mt-3 max-w-[280px]">Drag files or click to initiate clinical ingestion.</p>
                             <input 
                                type="file" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                accept="image/*"
                                onChange={handleFileUpload}
                             />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Processing Overlay */}
                      {isLoading && (
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
                           <Loader2 className="size-16 text-cyan-400 animate-spin mb-8" />
                           <p className="text-3xl font-outfit font-black tracking-tighter text-white">AI Neural Analysis...</p>
                           <p className="text-slate-500 text-sm mt-4 tracking-widest uppercase font-bold">Scanning pixel textures • Calibrating XAI maps</p>
                        </div>
                      )}
                   </div>

                   {/* Post-Capture Actions */}
                   {image && !result && !isLoading && (
                      <div className="p-8 lg:p-12 bg-slate-900/50 flex flex-col lg:flex-row items-center justify-between gap-8 border-t border-slate-800 animate-in slide-in-from-bottom-4">
                         <div className="font-outfit">
                            <h4 className="text-2xl font-black text-white">Ingestion Pending</h4>
                            <p className="text-sm text-slate-500 mt-1">Review resolution and focus before specialist push.</p>
                         </div>
                         <div className="flex gap-4 w-full lg:w-auto">
                            <Button 
                              variant="ghost" 
                              onClick={reset}
                              className="h-16 flex-1 lg:px-8 rounded-2xl font-outfit font-black text-slate-400 border-2 border-slate-800 hover:bg-slate-800 transition"
                            >
                              Retake Specimen
                            </Button>
                            <Button 
                              onClick={handleSubmit}
                              className="h-16 flex-1 lg:px-12 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-outfit font-black text-lg gap-3 shadow-xl shadow-cyan-900/20 active:scale-95 transition"
                            >
                              <Zap className="size-5" />
                              Push to AI Engine
                            </Button>
                         </div>
                      </div>
                   )}
                </CardContent>
             </Card>
          </section>

          {/* Result Section */}
          <AnimatePresence>
            {result && (
              <motion.section 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-12 mt-12"
              >
                {result.quality === 'fail' ? (
                  <Card className="bg-rose-500/10 border-rose-500/20 rounded-[2.5rem] p-10 flex flex-col lg:flex-row items-center gap-10">
                     <div className="size-20 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                        <AlertCircle className="size-10 text-rose-500" />
                     </div>
                     <div className="flex-1 text-center lg:text-left">
                        <h4 className="text-3xl font-outfit font-black text-white tracking-tight">Calibration Failed</h4>
                        <p className="text-rose-200/60 mt-2 text-lg leading-relaxed">{result.message}</p>
                        <Button 
                          onClick={reset} 
                          className="mt-8 h-14 px-8 rounded-2xl bg-rose-600 text-white font-outfit font-black hover:bg-rose-500"
                        >
                          Retry Scan
                        </Button>
                     </div>
                  </Card>
                ) : (
                  <Card className="bg-slate-900 rounded-[3rem] border-slate-800 p-12 lg:p-16 relative overflow-hidden group">
                     {/* Result Sparkle */}
                     <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CheckCircle2 className="size-60 text-emerald-500" />
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
                        <div className="space-y-8">
                           <div>
                              <Badge variant="success" className="mb-4 px-6 py-1.5 font-black text-sm uppercase tracking-widest">Diagnostic Complete</Badge>
                              <h3 className="text-6xl font-outfit font-black text-white tracking-tighter">
                                Triage Result
                              </h3>
                           </div>

                           <div className="p-8 bg-slate-950/50 rounded-[2.5rem] border border-slate-800 shadow-2xl">
                              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-3">Neural Classification</p>
                              <div className="flex items-center justify-between">
                                 <p className={cn(
                                   "text-5xl font-outfit font-black",
                                   ['Malignant', 'Pre-malignant'].includes(result.prediction) ? "text-rose-500" : "text-emerald-500"
                                 )}>
                                   {result.prediction}
                                 </p>
                                 <div className="text-right">
                                    <p className="text-2xl font-outfit font-black text-slate-300">{(result.confidence * 100).toFixed(0)}%</p>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Confidence</p>
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-4">
                              <div className="flex items-start gap-4 p-6 bg-slate-950/30 rounded-3xl border border-slate-800">
                                 <div className="size-10 bg-cyan-500/10 rounded-xl flex items-center justify-center shrink-0">
                                    <FileText className="size-6 text-cyan-400" />
                                 </div>
                                 <div className="flex-1">
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Case ID</p>
                                    <p className="text-sm font-bold text-slate-200 mt-1">{result.id}</p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="flex flex-col justify-end gap-6">
                           <div className="p-8 bg-slate-950/30 rounded-3xl border border-dashed border-slate-800">
                              <h5 className="text-sm font-outfit font-black text-white mb-2 uppercase tracking-widest">Next Actions</h5>
                              <p className="text-xs text-slate-500 leading-relaxed font-bold italic">
                                Specimen processed and synced with local database. Clinical report generated with Grad-CAM activation maps. Proceed to portal for deep-dive.
                              </p>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <Button 
                                className="h-20 rounded-[2rem] bg-slate-800 hover:bg-slate-700 text-white font-outfit font-black shadow-xl"
                                onClick={() => window.open(`${API_BASE}/cases/${result.id}/report/pdf`, '_blank')}
                               >
                                View PDF
                              </Button>
                              <Link href="/" className="h-full">
                                <Button className="w-full h-20 rounded-[2rem] bg-cyan-600 hover:bg-cyan-500 text-white font-outfit font-black shadow-xl shadow-cyan-900/20">
                                  Return Home
                                </Button>
                              </Link>
                           </div>
                        </div>
                     </div>
                  </Card>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-20 flex items-center justify-center gap-10 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
           <Separator className="flex-1 bg-slate-800" />
           <p className="text-[9px] font-black uppercase tracking-[0.5em] whitespace-nowrap">Clinical Diagnostic Engine v1.2</p>
           <Separator className="flex-1 bg-slate-800" />
        </div>
      </main>

      <canvas ref={canvasRef} className="hidden" />

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
