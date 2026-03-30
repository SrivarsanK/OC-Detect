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
  Sparkles,
  User,
  Fingerprint,
  Calendar,
  Contact2
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  // Navigation State
  const [step, setStep] = useState<'registration' | 'scan' | 'results'>('registration');
  
  // Registration State
  const [patientData, setPatientData] = useState({
    name: '',
    age: '',
    gender: 'M',
    abha: '',
    case_id: ''
  });

  // Scan State
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IngestResponse | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [clinicalInfo, setClinicalInfo] = useState({
    location: 'Right Soft Palate',
    gross_description: '',
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadingSteps = [
    { icon: Scan, text: 'Preprocessing & CLAHE enhancement...' },
    { icon: Brain, text: 'EfficientNet-B4 inference running...' },
    { icon: Sparkles, text: 'Extracting texture & color features...' },
    { icon: Activity, text: 'MC Dropout uncertainty analysis...' },
    { icon: ShieldCheck, text: 'Generating clinical report...' },
  ];

  // Helper: Classification styles
  const isCancer = (cls: string) => cls.toUpperCase() === 'CANCER';
  const getVerdictColor = (cls: string) => isCancer(cls) ? 'text-rose-500' : 'text-emerald-500';
  const getVerdictBg = (cls: string) => isCancer(cls) ? 'bg-rose-500/5 border-rose-500/20' : 'bg-emerald-500/5 border-emerald-500/20';

  useEffect(() => {
    if (step === 'scan' && mode === 'camera' && !image) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode, image, step]);

  useEffect(() => {
    if (!isLoading) { setLoadingStep(0); return; }
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 1200);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleRegister = () => {
    if (!patientData.name || !patientData.age) {
        setError("Please provide patient name and age.");
        return;
    }
    // Generate unique clinical Case ID
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generatedId = `OG-${dateStr}-${randomSuffix}`;
    
    setPatientData(prev => ({ ...prev, case_id: generatedId }));
    setError(null);
    setStep('scan');
  };

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
           setFile(new File([blob], `scan_${patientData.case_id}.jpg`, { type: 'image/jpeg' }));
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
    fd.append('patient_id', patientData.abha || patientData.name);
    fd.append('accession_no', patientData.case_id);
    fd.append('location', clinicalInfo.location);
    fd.append('gross_description', clinicalInfo.gross_description);
    
    try {
      const res = await axios.post(`${API_BASE}/ingest/upload`, fd);
      setResult(res.data);
      if (res.data.quality === 'fail') setError(res.data.message);
      else setStep('results');
    } catch {
      setError("Inference pipeline error. Check server connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setFile(null);
    setResult(null);
    setError(null);
    setLoadingStep(0);
    setStep('registration');
    setPatientData({ name: '', age: '', gender: 'M', abha: '', case_id: '' });
  };

  return (
    <div className="flex-1 p-6 lg:p-12 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.02)_0%,transparent_100%)]">
      <div className="max-w-4xl mx-auto space-y-10 pb-20">
        
        {/* Header */}
        <div className="flex items-center justify-between">
            <div>
               <Badge variant="cyan" className="mb-4 px-4 font-black">AI Oral Triage</Badge>
               <h1 className="text-5xl font-outfit font-black tracking-tighter text-white uppercase leading-none">
                  {step === 'registration' ? 'Patient Registry' : step === 'scan' ? 'Tissue Scan' : 'Diagnostic Results'}
               </h1>
            </div>
            {patientData.case_id && (
                <div className="text-right">
                    <p className="text-[10px] text-slate-500 font-black uppercase">Case ID</p>
                    <p className="text-xl font-outfit font-black text-cyan-400">{patientData.case_id}</p>
                </div>
            )}
        </div>

        <AnimatePresence mode="wait">
            {step === 'registration' && (
                <motion.div 
                   key="reg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                   className="space-y-8"
                >
                    <Card className="bg-slate-900/40 border-slate-800/60 rounded-[3rem] p-10 backdrop-blur-2xl border-2 relative overflow-hidden group">
                        {/* Background subtle glow */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 blur-[100px] rounded-full group-hover:bg-cyan-500/15 transition-all duration-700" />
                        
                        <div className="relative z-10 space-y-12">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-outfit font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                        <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                                            <Contact2 className="size-6 text-cyan-400" />
                                        </div>
                                        Clinical Enrollment
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium pl-14">Initialize a new pathologic triage session</p>
                                </div>
                                <Badge variant="outline" className="h-10 px-4 rounded-xl border-slate-700 bg-slate-950/50 text-slate-400 font-bold gap-2">
                                    <div className="size-2 rounded-full bg-amber-500 animate-pulse" /> Pending Registration
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                               {/* Name Field - Spans 8 */}
                               <div className="md:col-span-12 lg:col-span-8 space-y-4">
                                 <label className="text-[11px] text-slate-400 font-black uppercase tracking-widest px-1 flex items-center gap-2">
                                     <User className="size-3 text-cyan-500" /> Full Patient Name
                                 </label>
                                 <Input 
                                    placeholder="Enter full name..." 
                                    className="h-16 px-6 text-lg font-outfit border-slate-800 bg-slate-950/40 focus:bg-slate-950/80 transition-all rounded-[1.25rem]"
                                    value={patientData.name} 
                                    onChange={e => setPatientData({...patientData, name: e.target.value})} 
                                 />
                               </div>

                               {/* Age Field - Spans 4 */}
                               <div className="md:col-span-6 lg:col-span-4 space-y-4">
                                 <label className="text-[11px] text-slate-400 font-black uppercase tracking-widest px-1 flex items-center gap-2">
                                     <Calendar className="size-3 text-cyan-500" /> Age
                                 </label>
                                 <Input 
                                    type="number" 
                                    placeholder="Years" 
                                    className="h-16 px-6 text-lg font-outfit border-slate-800 bg-slate-950/40 focus:bg-slate-950/80 transition-all rounded-[1.25rem]"
                                    value={patientData.age} 
                                    onChange={e => setPatientData({...patientData, age: e.target.value})} 
                                 />
                               </div>

                               {/* Gender - Spans 6 */}
                               <div className="md:col-span-6 lg:col-span-6 space-y-4">
                                 <label className="text-[11px] text-slate-400 font-black uppercase tracking-widest px-1 flex items-center gap-2">
                                     <Activity className="size-3 text-cyan-500" /> Biologic Gender
                                 </label>
                                 <div className="grid grid-cols-3 gap-3 p-1.5 bg-slate-950/60 rounded-[1.5rem] border border-slate-800/80">
                                    {[
                                        { id: 'M', label: 'Male' },
                                        { id: 'F', label: 'Female' },
                                        { id: 'O', label: 'Other' }
                                    ].map(g => (
                                        <Button 
                                            key={g.id} 
                                            variant="ghost" 
                                            onClick={() => setPatientData({...patientData, gender: g.id})} 
                                            className={cn(
                                                "rounded-xl h-12 font-outfit font-black transition-all",
                                                patientData.gender === g.id 
                                                ? "bg-white text-slate-950 shadow-lg" 
                                                : "text-slate-500 hover:text-white"
                                            )}
                                        >
                                            {g.label}
                                        </Button>
                                    ))}
                                 </div>
                               </div>

                               {/* ABHA - Spans 6 */}
                               <div className="md:col-span-12 lg:col-span-6 space-y-4">
                                 <label className="text-[11px] text-slate-400 font-black uppercase tracking-widest px-1 flex items-center gap-2">
                                     <Fingerprint className="size-3 text-cyan-500" /> ABHA Address
                                 </label>
                                 <div className="relative">
                                    <Input 
                                        placeholder="user@abha (optional)" 
                                        className="h-16 pl-6 pr-14 text-lg font-outfit border-slate-800 bg-slate-950/40 focus:bg-slate-950/80 transition-all rounded-[1.25rem]"
                                        value={patientData.abha} 
                                        onChange={e => setPatientData({...patientData, abha: e.target.value})} 
                                    />
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                                        <ShieldCheck className="size-4" />
                                    </div>
                                 </div>
                               </div>
                            </div>

                            <div className="pt-10 mt-10 border-t border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-tight flex items-center gap-2">
                                        <AlertCircle className="size-3 text-amber-500" /> Privacy Notice
                                    </p>
                                    <p className="text-[10px] text-slate-600 max-w-xs leading-relaxed">All clinical data is encrypted and linked locally. No PHI is transmitted during initial triage.</p>
                                </div>
                                <Button 
                                    onClick={handleRegister} 
                                    className="h-20 px-12 rounded-[2rem] bg-cyan-600 hover:bg-cyan-500 text-white font-outfit font-black text-2xl gap-6 group shadow-2xl shadow-cyan-900/40 active:scale-95 transition-all"
                                >
                                    Initialize Diagnostic Case <ArrowRight className="size-6 group-hover:translate-x-2 transition-transform duration-300" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}

            {step === 'scan' && (
                <motion.div 
                    key="scan" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                    className="space-y-8"
                >
                    <div className="grid grid-cols-2 gap-4 p-2 bg-slate-900/50 rounded-[2.5rem] border border-slate-800/60">
                        <Button variant="ghost" onClick={() => { setMode('camera'); setImage(null); setFile(null); }} className={cn("h-16 rounded-[2rem] font-outfit font-black text-lg gap-3 transition-all", mode === 'camera' ? "bg-white text-slate-950" : "text-slate-400 hover:text-white")}>
                            <Camera className="size-6" /> Camera
                        </Button>
                        <Button variant="ghost" onClick={() => { setMode('upload'); setImage(null); setFile(null); }} className={cn("h-16 rounded-[2rem] font-outfit font-black text-lg gap-3 transition-all", mode === 'upload' ? "bg-white text-slate-950" : "text-slate-400 hover:text-white")}>
                            <Upload className="size-6" /> Upload
                        </Button>
                    </div>

                    <Card className="bg-slate-900/30 border-slate-800 rounded-[3rem] overflow-hidden backdrop-blur-3xl shadow-2xl relative border-2">
                        <CardContent className="p-0">
                            <div className="aspect-video relative bg-slate-950 flex items-center justify-center overflow-hidden">
                                {image ? (
                                    <div className="w-full h-full relative">
                                        <img src={image} className="w-full h-full object-contain" alt="Scan" />
                                        {!isLoading && (
                                            <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                                                <Button variant="destructive" size="icon" onClick={() => { setImage(null); setFile(null); if (mode === 'camera') startCamera(); }} className="h-14 w-14 rounded-full">
                                                    <Trash2 className="size-6" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : mode === 'camera' ? (
                                    <div className="w-full h-full relative">
                                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 border-[40px] border-slate-950/40 pointer-events-none">
                                            <div className="w-full h-full border-2 border-dashed border-cyan-500/20 rounded-[2rem]" />
                                        </div>
                                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                                            <Button onClick={capturePhoto} disabled={!isCameraActive} className="h-20 w-20 rounded-full bg-white text-slate-950 shadow-2xl border-[6px] border-slate-900 group">
                                                <Zap className="size-8 group-hover:scale-110 transition" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-20 text-center flex flex-col items-center relative">
                                        <Upload className="size-12 text-slate-700 mb-6" />
                                        <p className="text-xl font-outfit font-black text-white">Select Oral Image</p>
                                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
                                    </div>
                                )}

                                {isLoading && (
                                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center">
                                        <Loader2 className="size-16 text-cyan-400 animate-spin mb-8" />
                                        <div className="space-y-4 w-full max-w-sm">
                                            {loadingSteps.map((step, i) => {
                                                const Icon = step.icon;
                                                const isActive = i === loadingStep;
                                                const isDone = i < loadingStep;
                                                return (
                                                    <div key={i} className={cn("flex items-center gap-3 transition-opacity", isActive ? "opacity-100" : isDone ? "opacity-50" : "opacity-20")}>
                                                        {isDone ? <CheckCircle2 className="size-5 text-emerald-500" /> : <Icon className={cn("size-5", isActive ? "text-cyan-400" : "text-slate-700")} />}
                                                        <span className={cn("text-sm font-outfit font-bold", isActive ? "text-white" : "text-slate-400")}>{step.text}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {image && !isLoading && (
                                <div className="p-10 border-t border-slate-800 space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <p className="text-[10px] text-slate-500 font-black uppercase px-2">Primary Anatomical Location</p>
                                            <Input placeholder="Anatomical site..." value={clinicalInfo.location} onChange={e => setClinicalInfo({...clinicalInfo, location: e.target.value})} />
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-[10px] text-slate-500 font-black uppercase px-2">Gross Description</p>
                                            <Textarea placeholder="Clinical observations..." value={clinicalInfo.gross_description} onChange={e => setClinicalInfo({...clinicalInfo, gross_description: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-8 border-t border-slate-800/50">
                                        <Button variant="ghost" onClick={() => setStep('registration')} className="text-slate-500 font-bold">Back to Registry</Button>
                                        <Button onClick={handleSubmit} className="h-16 px-12 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-outfit font-black text-xl gap-4 shadow-2xl">
                                            <Brain className="size-6" /> Analyze Tissue
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {step === 'results' && result && (
                <motion.div 
                    key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                     {/* Patient Information Summary */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                        <Card className="md:col-span-1 bg-slate-900/40 border-slate-800 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 backdrop-blur-xl">
                            <p className="text-[9px] sm:text-[10px] text-slate-500 font-black uppercase mb-3 sm:mb-4 tracking-widest">Patient Context</p>
                            <div className="space-y-3 sm:space-y-4">
                                <div>
                                    <h4 className="text-lg sm:text-xl font-outfit font-black text-white truncate">{patientData.name}</h4>
                                    <p className="text-[10px] sm:text-xs text-cyan-400 font-bold uppercase">{patientData.gender} · {patientData.age} Years</p>
                                </div>
                                <div className="pt-3 sm:pt-4 border-t border-slate-800">
                                    <p className="text-[9px] sm:text-[10px] text-slate-600 font-black uppercase mb-1">Anatomical Site</p>
                                    <p className="text-sm text-slate-300 font-medium">{clinicalInfo.location}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="md:col-span-2 bg-slate-900/40 border-slate-800 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 backdrop-blur-xl">
                            <p className="text-[9px] sm:text-[10px] text-slate-500 font-black uppercase mb-3 sm:mb-4 tracking-widest">Clinical Observations</p>
                            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed italic">
                                {clinicalInfo.gross_description || "No gross observations recorded for this case."}
                            </p>
                        </Card>
                     </div>

                     <Card className={cn("rounded-[2rem] sm:rounded-[3rem] border-2 p-6 sm:p-10 relative overflow-hidden shadow-2xl", getVerdictBg(result.prediction))}>
                        <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-5">
                            {isCancer(result.prediction) ? <AlertTriangle className="size-40 sm:size-60 text-rose-500" /> : <CheckCircle2 className="size-40 sm:size-60 text-emerald-500" />}
                        </div>
                        <div className="relative z-10 text-center sm:text-left">
                            <Badge variant={isCancer(result.prediction) ? "destructive" : "secondary"} className="mb-4 sm:mb-6 font-black sm:scale-110 sm:origin-left px-4 sm:px-5">
                                {isCancer(result.prediction) ? '⚠ CANCER DETECTED' : '✓ NON-CANCEROUS'}
                            </Badge>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12 mt-2 sm:mt-4">
                                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                                    <p className={cn("text-5xl sm:text-7xl font-outfit font-black tracking-tighter leading-none", getVerdictColor(result.prediction))}>
                                        {result.prediction}
                                    </p>
                                    <p className="text-base sm:text-lg text-slate-400 font-outfit max-w-xl mx-auto sm:mx-0">
                                        {isCancer(result.prediction)
                                          ? 'High-risk malignant patterns detected. Immediate specialist referral and biopsy protocol recommended.'
                                          : 'No malignant signatures identified. Routine follow-up recommended.'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 lg:flex lg:flex-col gap-4">
                                    <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-slate-950/50 border border-slate-800">
                                        <p className="text-[8px] sm:text-[10px] text-slate-500 font-black uppercase mb-1">Confidence</p>
                                        <p className="text-2xl sm:text-4xl font-outfit font-black text-white">{(result.confidence * 100).toFixed(1)}%</p>
                                    </div>
                                    <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-slate-950/50 border border-slate-800">
                                        <p className="text-[8px] sm:text-[10px] text-slate-500 font-black uppercase mb-1">Uncertainty</p>
                                        <p className="text-2xl sm:text-4xl font-outfit font-black text-white">{result.uncertainty.toFixed(3)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                     </Card>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <Button className="h-16 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] bg-slate-800 hover:bg-slate-700 text-white font-outfit font-black text-base sm:text-xl gap-3 sm:gap-4 transition" onClick={() => window.open(`${API_BASE}/cases/${result.id}/report/pdf`, '_blank')}>
                            <FileText className="size-5 sm:size-6 text-cyan-400" /> View Specialist PDF
                        </Button>
                        <Button className="h-16 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] bg-cyan-600 hover:bg-cyan-500 text-white font-outfit font-black text-base sm:text-xl gap-3 sm:gap-4 shadow-2xl transition" onClick={reset}>
                            <ArrowRight className="size-5 sm:size-6" /> New Analysis
                        </Button>
                     </div>
                </motion.div>
            )}
        </AnimatePresence>

        {error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-[2rem] bg-rose-500/10 border-2 border-rose-500/20 flex items-center gap-4">
                <AlertCircle className="size-6 text-rose-500 shrink-0" />
                <p className="text-sm font-outfit font-bold text-rose-400">{error}</p>
            </motion.div>
        )}

      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
