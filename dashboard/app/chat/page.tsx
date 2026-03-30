'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  BrainCircuit, 
  Info, 
  AlertCircle, 
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Brain,
  History,
  Terminal,
  MessageSquare,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const API_BASE = "http://localhost:8000/api/v1";

interface Message {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: Date;
  case_id?: string;
}

interface CaseBrief {
    id: string;
    prediction: string;
    confidence: number;
    patient_id: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      text: "Hello, I am the OralGuard Clinical Assistant. Select a case or ask me about WHO oral cancer protocols.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState<CaseBrief[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRecentCases();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchRecentCases = async () => {
    try {
      const res = await axios.get(`${API_BASE}/cases/`);
      setCases(res.data.slice(0, 10).map((c: any) => ({
        id: c.id,
        prediction: c.prediction_class,
        confidence: c.confidence,
        patient_id: c.patient_id || 'Unknown'
      })));
    } catch {}
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
      case_id: selectedCaseId || undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/assistant/query`, {
        case_id: selectedCaseId,
        message: input
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: res.data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: 'err',
        role: 'assistant',
        text: "I encountered a connection error with the pathology reasoning engine. Please ensure the backend is active.",
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const activeCase = cases.find(c => c.id === selectedCaseId);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.03)_0%,transparent_100%)]">
      
      {/* 🧬 Chat Header */}
      <header className="px-6 lg:px-12 py-6 border-b border-slate-900 bg-slate-950/40 backdrop-blur-3xl flex flex-col md:flex-row items-center justify-between gap-6 z-20">
          <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-cyan-600 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
                  <BrainCircuit className="size-7 text-white" />
              </div>
              <div>
                  <h1 className="text-2xl font-outfit font-black tracking-tighter text-white uppercase">Clinical Assistant</h1>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="size-3 text-cyan-400" /> Powered by Gemini
                  </p>
              </div>
          </div>

          <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-600 font-black uppercase">Active Context:</span>
              <div className="relative group">
                  <select 
                    value={selectedCaseId || ''} 
                    onChange={e => setSelectedCaseId(e.target.value)}
                    className="h-10 pl-4 pr-10 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white appearance-none cursor-pointer hover:border-cyan-500/50 transition-all outline-none"
                  >
                    <option value="">WHO Protocols Mode</option>
                    {cases.map(c => (
                        <option key={c.id} value={c.id}>
                            Case {c.id.substring(0,8)} ({c.prediction})
                        </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
              </div>
          </div>
      </header>

      {/* 💬 Chat Surface */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-8 custom-scrollbar scroll-smooth">
        
        {selectedCaseId && activeCase && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
                <Card className="bg-cyan-500/5 border-cyan-500/20 p-5 rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-900">
                            <ShieldCheck className="size-5 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-black uppercase">Clinician Analyzing</p>
                            <h4 className="text-sm font-outfit font-black text-white">Patient {activeCase.patient_id}</h4>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-slate-500 font-black uppercase">Model Verdict</p>
                        <Badge variant="cyan" className="font-black text-[10px]">{activeCase.prediction}</Badge>
                    </div>
                </Card>
            </motion.div>
        )}

        <div className="max-w-4xl mx-auto space-y-8">
            <AnimatePresence initial={false}>
                {messages.map((msg) => (
                    <motion.div 
                        key={msg.id} 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        className={cn(
                            "flex items-start gap-4",
                            msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                        )}
                    >
                        <div className={cn(
                            "size-10 rounded-2xl shrink-0 flex items-center justify-center border transition-all shadow-sm",
                            msg.role === 'assistant' 
                                ? "bg-cyan-500 text-white border-cyan-400" 
                                : "bg-slate-900 text-slate-400 border-slate-800"
                        )}>
                            {msg.role === 'assistant' ? <Bot className="size-5" /> : <User className="size-5" />}
                        </div>
                        <div className={cn(
                            "max-w-[80%] rounded-[1.75rem] p-6 text-sm leading-relaxed",
                            msg.role === 'assistant' 
                                ? "bg-slate-900/50 border border-slate-800/80 text-slate-200" 
                                : "bg-cyan-600 text-white shadow-xl shadow-cyan-900/10"
                        )}>
                            {msg.text.split('\n').map((line, i) => (
                                <p key={i} className={cn(line.trim() === "" ? "h-3" : "mb-1")}>
                                    {line}
                                </p>
                            ))}
                            <div className="mt-3 text-[9px] font-black uppercase tracking-tight opacity-40">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4">
                    <div className="size-10 rounded-2xl bg-cyan-500 text-white flex items-center justify-center animate-pulse">
                        <Bot className="size-5" />
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-[1.75rem] border border-slate-800 border-dashed">
                        <div className="flex gap-1.5">
                            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                </motion.div>
            )}
            <div ref={scrollRef} />
        </div>
      </div>

      {/* ⌨️ Input Area */}
      <div className="p-6 lg:p-12 bg-slate-950/60 backdrop-blur-2xl border-t border-slate-900 z-30">
        <div className="max-w-4xl mx-auto">
            <div className="relative flex items-center gap-4 group">
                <Input 
                    placeholder="Ask about malignancy interpretation or WHO OPMD protocols..." 
                    className="h-20 pl-8 pr-24 rounded-3xl bg-slate-900/80 border-2 border-slate-800 text-lg font-outfit transition-all focus:border-cyan-500/50 focus:ring-0 focus:bg-slate-900"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <Button 
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="absolute right-4 h-12 px-8 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-outfit font-black gap-3 shadow-xl active:scale-95 transition-all"
                >
                    {loading ? <Terminal className="size-5 animate-spin" /> : <Send className="size-5" />}
                    <span>Send</span>
                </Button>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-2">
                {[
                    "Interpret Case Confidence",
                    "WHO Protocol for OPMD",
                    "Explain Entropy Threshold",
                    "Summarize Recent Diagnosis"
                ].map(suggest => (
                    <button 
                        key={suggest} 
                        onClick={() => setInput(suggest)}
                        className="px-4 py-2 rounded-full border border-slate-800 bg-slate-900/40 text-[10px] font-black uppercase text-slate-500 hover:border-cyan-500/30 hover:text-cyan-400 transition-all"
                    >
                        {suggest}
                    </button>
                ))}
            </div>
        </div>
      </div>

      <style jsx global>{`
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #0f172a; border-radius: 10px; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #0f172a transparent; }
      `}</style>
    </div>
  );
}
