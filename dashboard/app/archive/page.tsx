'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { History, FileText, Download, Microscope, Search } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ArchivePage() {
  return (
    <div className="flex-1 p-6 lg:p-12 overflow-y-auto custom-scrollbar bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.03)_0%,transparent_80%)]">
      <div className="max-w-6xl mx-auto space-y-12 pb-20">
        <div className="flex items-end justify-between">
           <div>
              <Badge variant="cyan" className="mb-4 px-4 font-black">Clinical Records</Badge>
              <h1 className="text-5xl font-outfit font-black tracking-tighter text-white">Archive</h1>
           </div>
           <div className="flex items-center gap-4 bg-slate-900/40 px-6 py-3 rounded-2xl border border-slate-800 w-80">
              <Search className="size-4 text-slate-500" />
              <input type="text" placeholder="Search archive..." className="bg-transparent border-none outline-none text-xs text-slate-200" />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[...Array(6)].map((_, i) => (
             <motion.div key={i} whileHover={{ y: -4 }}>
                <Card className="bg-slate-900/30 border-slate-800 rounded-[2.5rem] overflow-hidden group">
                   <CardHeader className="pb-4">
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">MAR 2026</span>
                         <Badge variant="outline" className="text-slate-500 text-[9px]">ID: K-90X21</Badge>
                      </div>
                      <CardTitle className="text-xl">Case {1024 + i}</CardTitle>
                      <CardDescription className="font-bold flex items-center gap-2">
                         <History className="size-3 text-cyan-500" /> Specialist Validated
                      </CardDescription>
                   </CardHeader>
                   <CardContent className="pt-0 space-y-4">
                      <div className="h-40 bg-slate-950 rounded-2xl border border-slate-900 group-hover:border-cyan-500/20 transition flex items-center justify-center opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-60">
                         <Microscope className="size-10 text-slate-800" />
                      </div>
                      <div className="flex gap-2">
                         <Button variant="ghost" className="flex-1 h-12 rounded-xl bg-slate-900 border border-slate-800 text-xs font-black uppercase">
                            View
                         </Button>
                         <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800">
                            <Download className="size-4 text-slate-400" />
                         </Button>
                      </div>
                   </CardContent>
                </Card>
             </motion.div>
           ))}
        </div>
      </div>
    </div>
  );
}
