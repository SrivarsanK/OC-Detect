'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  ArrowRight, 
  Brain, 
  Activity, 
  Microscope, 
  FileText, 
  Globe, 
  Terminal,
  Layers,
  Zap,
  Target
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-cyan-500/30 overflow-x-hidden">
      
      {/* 🌌 Atmospheric Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 blur-[180px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* 🧭 Navbar */}
      <nav className="fixed top-0 inset-x-0 h-20 z-50 px-6 lg:px-12 flex items-center justify-between border-b border-white/5 backdrop-blur-xl bg-slate-950/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-600 rounded-lg shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="size-6 text-white" />
          </div>
          <span className="text-xl font-outfit font-black tracking-tight text-white uppercase italic">OralGuard</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-widest text-slate-400">
           <a href="#tech" className="hover:text-cyan-400 transition-colors">Neural Architecture</a>
           <a href="#workflow" className="hover:text-cyan-400 transition-colors">Workflow</a>
           <a href="#about" className="hover:text-cyan-400 transition-colors">Clinical Standards</a>
        </div>
        <Link href="/triage">
          <Button variant="outline" className="rounded-full px-8 bg-white/5 border-white/10 hover:bg-white/10 text-[11px] font-black uppercase tracking-widest h-11">
             Enter Workstation <ArrowRight className="ml-2 size-3" />
          </Button>
        </Link>
      </nav>

      {/* 🚀 Hero Section */}
      <section className="relative pt-40 pb-24 px-6 lg:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
          <Badge variant="cyan" className="mb-6 px-4 py-1.5 rounded-full border-cyan-500/20 bg-cyan-500/10 text-cyan-400 font-bold tracking-widest uppercase text-[10px]">
             Accelerating Oncology Diagnostics
          </Badge>
        </motion.div>
        
        <motion.h1 
          className="text-6xl md:text-8xl lg:text-9xl font-outfit font-black tracking-tighter text-white leading-[0.9] mb-8"
          {...fadeInUp}
        >
          AI-Driven Oral <br />
          <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-500 bg-clip-text text-transparent">Cancer Triage.</span>
        </motion.h1>

        <motion.p 
          className="text-slate-400 text-lg md:text-xl max-w-2xl leading-relaxed mb-12 font-medium"
          {...fadeInUp}
          transition={{ delay: 0.2 }}
        >
          Specialist-grade malignancy detection powered by EfficientNet-B4 and Grad-CAM explainable AI. Clinical registration, tissue analysis, and pathology reporting—all in one unified pipeline.
        </motion.p>

        <motion.div 
          className="flex flex-col sm:flex-row gap-6"
          {...fadeInUp}
          transition={{ delay: 0.3 }}
        >
          <Link href="/scan">
            <Button className="h-16 px-10 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-outfit font-black text-xl shadow-2xl shadow-cyan-900/40 gap-4 group">
               Launch New Scan <Zap className="size-5 group-hover:scale-125 transition-transform" />
            </Button>
          </Link>
          <Link href="/triage">
            <Button variant="ghost" className="h-16 px-10 rounded-2xl border border-white/10 hover:bg-white/5 text-white font-outfit font-black text-xl gap-4">
               Active Triage Portal <Activity className="size-5" />
            </Button>
          </Link>
        </motion.div>

        {/* Hero Visual */}
        <motion.div 
          className="mt-24 w-full aspect-[21/9] rounded-[3rem] border border-white/10 bg-slate-900/20 backdrop-blur-3xl overflow-hidden relative group"
          initial={{ opacity: 0, scale: 0.95, y: 100 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
           <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
           <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
           
           <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full p-12 lg:p-24 flex flex-col items-center justify-center">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-5xl relative z-20">
                    {[
                      { icon: Brain, label: 'EfficientNet-B4', desc: 'SOTA convolutional architecture fine-tuned for small-sample oncology datasets.' },
                      { icon: Microscope, label: 'LRP Explainability', desc: 'Layer-wise Relevance Propagation and Grad-CAM for visual clinical verification.' },
                      { icon: FileText, label: 'Clinical-Grade', desc: 'Fully compliant ABHA patient registry and pathologic reporting standards.' }
                    ].map((item, i) => (
                      <motion.div key={i} className="text-left space-y-4">
                         <div className="size-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                           <item.icon className="size-6" />
                         </div>
                         <h3 className="text-2xl font-outfit font-black text-white">{item.label}</h3>
                         <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                      </motion.div>
                    ))}
                 </div>
              </div>
           </div>
        </motion.div>
      </section>

      {/* 🧬 Tech Architecture Section */}
      <section id="tech" className="py-32 px-6 lg:px-12 max-w-7xl mx-auto space-y-24">
        <div className="flex flex-col items-center text-center">
           <Badge className="mb-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">The Diagnostic Engine</Badge>
           <h2 className="text-4xl md:text-5xl font-outfit font-black tracking-tight text-white italic uppercase">Bespoke Pathologic Intelligence</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {/* Card 1: Dropout */}
           <motion.div 
             className="p-10 rounded-[2.5rem] bg-slate-900/30 border border-white/5 backdrop-blur-3xl hover:border-cyan-500/30 transition-all group"
             whileHover={{ y: -5 }}
           >
              <div className="p-3 bg-cyan-600 rounded-xl w-fit mb-6 shadow-xl shadow-cyan-900/20 group-hover:scale-110 transition-transform">
                <Target className="size-6 text-white" />
              </div>
              <h4 className="text-2xl font-outfit font-black text-white mb-4">MC Dropout Stability</h4>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">Running 20 parallel inference passes to calculate Bayesian uncertainty. If the AI is unsure, the specialist is notified immediately with a high-uncertainty flag.</p>
           </motion.div>

           {/* Card 2: Feature Engineering */}
           <motion.div 
             className="p-10 rounded-[2.5rem] bg-slate-900/30 border border-white/5 backdrop-blur-3xl hover:border-cyan-500/30 transition-all group"
             whileHover={{ y: -5 }}
           >
              <div className="p-3 bg-cyan-600 rounded-xl w-fit mb-6 shadow-xl shadow-cyan-900/20 group-hover:scale-110 transition-transform">
                <Layers className="size-6 text-white" />
              </div>
              <h4 className="text-2xl font-outfit font-black text-white mb-4">Pathologic Reconciliation</h4>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">Unique clinical gating layer. Reconciles raw AI predictions with handcrafted pathological features like Red/White patch ratios to reduce false positives.</p>
           </motion.div>

           {/* Card 3: Mobile Sync */}
           <motion.div 
             className="p-10 rounded-[2.5rem] bg-slate-900/30 border border-white/5 backdrop-blur-3xl hover:border-cyan-500/30 transition-all group"
             whileHover={{ y: -5 }}
           >
              <div className="p-3 bg-cyan-600 rounded-xl w-fit mb-6 shadow-xl shadow-cyan-900/20 group-hover:scale-110 transition-transform">
                <Globe className="size-6 text-white" />
              </div>
              <h4 className="text-2xl font-outfit font-black text-white mb-4">Edge-to-Cloud Pipeline</h4>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">Local-first inference for sub-second results at the Point-of-Care, with automated cloud synchronization for longitudinal patient records.</p>
           </motion.div>
        </div>
      </section>

      {/* 🧭 Workflow Section */}
      <section id="workflow" className="py-32 bg-slate-900/20 border-y border-white/5 px-6 lg:px-12">
         <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-8">
               <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Unified Pipeline</Badge>
               <h2 className="text-5xl font-outfit font-black text-white tracking-tighter leading-none">From Registration <br />to Triage Reporting.</h2>
               <div className="space-y-6">
                  {[
                    { step: '01', title: 'Clinical Enrollment', desc: 'Securely register patient biographics, ABHA identifiers, and anatomical scan sites.' },
                    { step: '02', title: 'Multi-Modal Scan', desc: 'High-resolution image capture with real-time CLAHE enhancement for clinical clarity.' },
                    { step: '03', title: 'Deep Neural Triage', desc: 'Bayesian-stabilized inference determines malignancy probability with visual heatmaps.' },
                    { step: '04', title: 'Pathology Report', desc: 'Automated generation of specialist-grade reports with ICD-compliance and diagnostic reasoning.' }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-6 items-start group cursor-default">
                       <span className="text-4xl font-outfit font-black text-slate-800 group-hover:text-cyan-500 transition-colors uppercase">{item.step}</span>
                       <div className="space-y-1">
                          <h4 className="text-xl font-outfit font-black text-white">{item.title}</h4>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
            <div className="relative aspect-square">
                <div className="absolute inset-0 bg-cyan-600/20 blur-[100px] rounded-full" />
                <div className="relative h-full w-full rounded-[4rem] border-2 border-cyan-500/20 bg-slate-950 overflow-hidden shadow-2xl p-4">
                   <div className="h-full w-full bg-slate-900/50 rounded-[3.5rem] border border-white/5 flex flex-col p-10 justify-between">
                      <div className="flex justify-between items-start">
                         <div className="space-y-2">
                           <p className="text-[10px] text-cyan-500 font-black uppercase tracking-widest">Case ID: OG-20240328-912</p>
                           <h4 className="text-3xl font-outfit font-black text-white">Diagnostic Results</h4>
                         </div>
                         <Badge variant="destructive" className="animate-pulse">Referral Indicated</Badge>
                      </div>
                      
                      <div className="aspect-video bg-black rounded-3xl border border-white/5 relative overflow-hidden">
                         <div className="absolute top-4 left-4 p-2 bg-rose-500/20 backdrop-blur-md rounded-lg text-rose-500 font-black text-[10px] uppercase border border-rose-500/30">Malignancy Hotspot</div>
                         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.3)_0%,transparent_60%)]" />
                      </div>

                      <div className="space-y-4">
                         <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                           <span>Malignancy Confidence</span>
                           <span className="text-rose-500">97.4%</span>
                         </div>
                         <div className="h-2 bg-slate-950 rounded-full overflow-hidden p-[1px] border border-slate-800">
                           <div className="h-full w-[97%] bg-rose-500 rounded-full" />
                         </div>
                      </div>
                   </div>
                </div>
            </div>
         </div>
      </section>

      {/* 🏁 CTA Section */}
      <section className="py-40 px-6 text-center max-w-4xl mx-auto space-y-12">
         <h2 className="text-5xl md:text-7xl font-outfit font-black text-white tracking-tighter italic uppercase animate-glitch">Ready for Clinical <br />Specialist Deployment.</h2>
         <p className="text-slate-400 text-lg font-medium leading-relaxed">OralGuard integrates seamlessly into oncology clinics, public health centers, and diagnostic labs. Start your first clinical session now.</p>
         <Link href="/triage">
           <Button className="h-20 px-16 rounded-[2.5rem] bg-white text-slate-950 hover:bg-slate-200 font-outfit font-black text-2xl shadow-2xl shadow-cyan-500/20 gap-6 transition-all active:scale-95 group">
              Get Started <ArrowRight className="size-6 group-hover:translate-x-3 transition-transform" />
           </Button>
         </Link>
      </section>

      {/* 📟 Footer */}
      <footer className="py-20 border-t border-white/5 px-6 lg:px-12 bg-slate-950">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-slate-800 rounded-lg">
                   <ShieldCheck className="size-5 text-white" />
                 </div>
                 <span className="text-xl font-outfit font-black text-white tracking-tight uppercase">OralGuard</span>
               </div>
               <p className="text-sm text-slate-500 font-medium max-w-xs leading-relaxed italic">The next-generation diagnostic interface for early oral oncology detection and clinical triage.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
               <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white">Technology</p>
                  <ul className="space-y-2 text-sm text-slate-500 font-medium">
                     <li className="hover:text-cyan-400 transition-colors cursor-pointer">Inference Pipeline</li>
                     <li className="hover:text-cyan-400 transition-colors cursor-pointer">Bayesian Uncertainty</li>
                     <li className="hover:text-cyan-400 transition-colors cursor-pointer">XAI Explainability</li>
                  </ul>
               </div>
               <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white">Clinical</p>
                  <ul className="space-y-2 text-sm text-slate-500 font-medium">
                     <li className="hover:text-cyan-400 transition-colors cursor-pointer">Reporting Standards</li>
                     <li className="hover:text-cyan-400 transition-colors cursor-pointer">Pathology Logic</li>
                     <li className="hover:text-cyan-400 transition-colors cursor-pointer">ABHA Integration</li>
                  </ul>
               </div>
               <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white">System</p>
                  <ul className="space-y-2 text-sm text-slate-500 font-medium">
                     <li className="hover:text-cyan-400 transition-colors cursor-pointer">Local Node</li>
                     <li className="hover:text-cyan-400 transition-colors cursor-pointer">Cloud Sync</li>
                     <li className="hover:text-cyan-400 transition-colors cursor-pointer">Developer API</li>
                  </ul>
               </div>
            </div>
         </div>
         <div className="max-w-7xl mx-auto pt-20 mt-20 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-700">
            <span>&copy; 2026 ORALGUARD AI PROJECT</span>
            <div className="flex items-center gap-6">
               <span className="flex items-center gap-2"><Terminal className="size-3" /> PIPELINE_STABLE</span>
            </div>
         </div>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;400;700;900&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif; }
        
        .animate-glitch {
           animation: glitch 5s infinite;
        }

        @keyframes glitch {
          0% { text-shadow: none; }
          20% { text-shadow: 2px 0 0 rgba(6, 182, 212, 0.4), -2px 0 0 rgba(244, 63, 94, 0.4); }
          21% { text-shadow: none; }
          100% { text-shadow: none; }
        }
      `}</style>
    </div>
  );
}
