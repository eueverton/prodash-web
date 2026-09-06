"use client";
import { use } from "react";
import { ArrowLeft, CarFront, Trophy } from "lucide-react";
import Link from "next/link";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type RankingEntry = {
  id: number;
  piloto: string;
  carro: string;
  modalidade: string;
  tempo: number;
};

export default function PilotProfilePage({ params }: { params: Promise<{ nome: string }> }) {
  const unwrappedParams = use(params);
  const pilotoNome = decodeURIComponent(unwrappedParams.nome);
  
  const [records, setRecords] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPilotData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("ranking")
          .select("*")
          .ilike("piloto", pilotoNome) // case-insensitive match
          .order("tempo", { ascending: true }); // We'll manually sort top speed later

        if (error) throw error;
        setRecords(data || []);
      } catch (err) {
        console.error("Erro ao buscar dados do piloto:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPilotData();
  }, [pilotoNome]);

  // Função para pegar o melhor recorde do piloto em uma modalidade
  const getBestRecord = (modalidade: string) => {
    const mods = records.filter(r => r.modalidade === modalidade);
    if (mods.length === 0) return null;
    
    if (modalidade === "top_speed") {
      // Maior velocidade ganha
      return mods.reduce((prev, current) => (prev.tempo > current.tempo) ? prev : current);
    } else {
      // Menor tempo ganha
      return mods.reduce((prev, current) => (prev.tempo < current.tempo) ? prev : current);
    }
  };

  const best0to100 = getBestRecord("0-100");
  const best100to200 = getBestRecord("100-200");
  const best201m = getBestRecord("201m");
  const bestTopSpeed = getBestRecord("top_speed");

  const carroPrincipal = records.length > 0 ? records[0].carro : "Desconhecido";

  return (
    <div className="min-h-screen p-4 pb-20 relative">
      <Link href="/" className="absolute top-6 left-6 text-white/50 hover:text-primary transition-all flex items-center gap-2">
        <ArrowLeft size={20} /> Voltar ao Ranking
      </Link>

      <div className="max-w-4xl mx-auto pt-20">
        
        {/* Header do Perfil */}
        <div className="glass-panel p-8 mb-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          
          <div className="w-32 h-32 bg-black/50 border-2 border-primary/50 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,255,204,0.2)]">
            <Trophy size={50} className="text-primary" />
          </div>
          
          <div className="text-center md:text-left z-10">
            <h1 className="text-4xl md:text-5xl font-orbitron font-black text-white uppercase tracking-wider">{pilotoNome}</h1>
            <div className="flex items-center justify-center md:justify-start gap-2 text-white/70 mt-2 uppercase">
              <CarFront size={18} className="text-primary" />
              <span className="font-bold tracking-widest">{carroPrincipal}</span>
            </div>
          </div>
        </div>

        {/* Cards de Recordes */}
        <h2 className="text-xl font-orbitron font-bold text-white mb-6 border-b border-white/10 pb-4">GARAGEM VIRTUAL / RECORDES</h2>
        
        {loading ? (
           <div className="flex justify-center items-center h-40">
             <div className="spinner"></div>
           </div>
        ) : records.length === 0 ? (
          <div className="text-center text-white/30 pt-12">Nenhum recorde encontrado para este piloto.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <RecordCard 
              title="0 a 100 km/h" 
              record={best0to100} 
              format={(v) => `${v.toFixed(3)}s`} 
            />
            
            <RecordCard 
              title="100 a 200 km/h" 
              record={best100to200} 
              format={(v) => `${v.toFixed(3)}s`} 
            />
            
            <RecordCard 
              title="Arrancada 201m" 
              record={best201m} 
              format={(v) => `${v.toFixed(3)}s`} 
            />
            
            <RecordCard 
              title="Top Speed Máximo" 
              record={bestTopSpeed} 
              format={(v) => `${v.toFixed(0)} km/h`} 
              highlight={true}
            />

          </div>
        )}
      </div>
    </div>
  );
}

function RecordCard({ title, record, format, highlight = false }: { title: string, record: RankingEntry | null, format: (v: number) => string, highlight?: boolean }) {
  if (!record) return null;
  
  return (
    <div className={`p-6 rounded-xl border ${highlight ? 'bg-primary/5 border-primary/30' : 'bg-white/5 border-white/10'} hover:bg-white/10 transition-all flex justify-between items-center`}>
      <div>
        <p className="text-xs text-white/50 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-sm text-white/80 uppercase">{record.carro}</p>
      </div>
      <div className={`text-3xl font-orbitron font-bold ${highlight ? 'text-primary' : 'text-white'}`}>
        {format(record.tempo)}
      </div>
    </div>
  );
}
