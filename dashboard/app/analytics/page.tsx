'use client';

import React from 'react';
import { Microscope, Activity, Zap, TrendingUp, Sparkles, Brain } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AnalyticsPage() {
  return (
    <div className="flex-1 p-6 lg:p-12 overflow-y-auto custom-scrollbar bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.03)_0%,transparent_80%)]">
      <div className="max-w-6xl mx-auto space-y-12 pb-20">
        <div>
           <Badge variant="cyan" className="mb-4 px-4 font-black">AI Insights Engine</Badge>
           <h1 className="text-5xl font-outfit font-black tracking-tighter text-white">AI Analytics</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {[
             { label: 'Neural Accuracy', score: '99.4%', icon: Brain, color: 'text-cyan-500' },
             { label: 'Active Pipeline', score: 'GSD-4.0', icon: Zap, color: 'text-emerald-500' },
             { label: 'Triage Rate', score: '12ms / img', icon: Activity, color: 'text-rose-500' },
             { label: 'Patient Inflow', score: '+14%', icon: TrendingUp, color: 'text-amber-500' }
           ].map((stat) => (
             <Card key={stat.label} className="bg-slate-900/30 border-slate-800 rounded-[2.5rem] p-8 space-y-4">
                <stat.icon className={cn("size-8", stat.color)} />
                <div>
                   <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1">{stat.label}</p>
                   <p className="text-3xl font-outfit font-black text-white">{stat.score}</p>
                </div>
             </Card>
           ))}
        </div>

        <Card className="bg-slate-900/20 border-slate-900 rounded-[3rem] p-12 border-dashed flex flex-col items-center justify-center text-center">
           <div className="size-20 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 mb-8">
              <Sparkles className="size-10 text-cyan-400" />
           </div>
           <h3 className="text-2xl font-outfit font-black text-white">Advanced Diagnostic Charts</h3>
           <p className="text-slate-600 text-sm mt-2 max-w-sm italic font-bold">Predictive modeling and patient outcome trends are currently calibrating for Tertiary Hospital clinical data.</p>
        </Card>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";
