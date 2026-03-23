'use client';

import React from 'react';
import { Settings as SettingsIcon, Globe, Shield, Terminal, Zap, ShieldCheck } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="flex-1 p-6 lg:p-12 overflow-y-auto custom-scrollbar bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.03)_0%,transparent_80%)]">
      <div className="max-w-4xl mx-auto space-y-12 pb-20">
        <div>
           <Badge variant="cyan" className="mb-4 px-4 font-black">Node Config</Badge>
           <h1 className="text-5xl font-outfit font-black tracking-tighter text-white">Settings</h1>
        </div>

        <section className="space-y-6">
           <Card className="bg-slate-900/30 border-slate-800 rounded-[3rem] p-10 space-y-10 shadow-2xl">
              <div>
                 <h3 className="text-xl font-outfit font-black text-white mb-6 flex items-center gap-3">
                    <Globe className="size-5 text-cyan-500" /> Infrastructure Node
                 </h3>
                 <div className="flex items-center justify-between p-6 bg-slate-950 rounded-3xl border border-slate-900 border-dashed">
                    <div className="flex-1">
                       <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Local Edge ID</p>
                       <p className="text-sm font-bold text-white">PHC_K_00129_SPECIAL_TERTIARY</p>
                    </div>
                    <Button variant="outline" className="h-12 px-6 rounded-2xl border-emerald-500/20 text-emerald-500 font-black text-[10px] uppercase">Connected</Button>
                 </div>
              </div>

              <Separator className="bg-slate-900" />

              <div>
                 <h3 className="text-xl font-outfit font-black text-white mb-6 flex items-center gap-3">
                    <Shield className="size-5 text-rose-500" /> Security Protocol
                 </h3>
                 <div className="flex items-center justify-between p-6 bg-slate-950 rounded-3xl border border-slate-900 border-dashed">
                    <div className="flex-1">
                       <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Encryption Mode</p>
                       <p className="text-sm font-bold text-white">AES-256 CLI-GATEWAY</p>
                    </div>
                    <Button variant="ghost" className="h-12 px-6 rounded-2xl bg-cyan-500/10 text-cyan-400 font-black text-[10px] uppercase">Secure</Button>
                 </div>
              </div>

              <Separator className="bg-slate-900" />

              <div className="flex items-center justify-between pt-4">
                 <p className="text-xs font-bold text-slate-500 italic">Advanced engine settings are restricted to administrator clinical roles.</p>
                 <Button className="h-16 px-8 rounded-2xl bg-slate-800 text-white font-outfit font-black border border-slate-700">Audit Logs</Button>
              </div>
           </Card>
        </section>
      </div>
    </div>
  );
}
