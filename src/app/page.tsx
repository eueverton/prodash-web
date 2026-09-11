"use client";
import { Settings } from "lucide-react";
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

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState("0-100");
  const [data, setData] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRanking = async (modalidade: string) => {
    setLoading(true);
    try {
      const { data: rankingData, error } = await supabase
        .from("ranking")
        .select("*")
        .eq("modalidade", modalidade)
        .order("tempo", { ascending: modalidade !== "top_speed" })
        .limit(100);

      if (error) throw error;

      const uniquePilots = new Map();
      const filteredData = [];
      
      for (const entry of (rankingData || [])) {
          const pilotLower = entry.piloto.toLowerCase();
          if (!uniquePilots.has(pilotLower)) {
              uniquePilots.set(pilotLower, true);
              filteredData.push(entry);
              if (filteredData.length >= 10) break;
          }
      }
      
      setData(filteredData);
    } catch (err) {
      console.error("Erro ao buscar ranking:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanking(activeTab);
  }, [activeTab]);

  return (
    <>
      <header className="flex flex-col items-center pt-16 pb-8 relative">
        <Link 
          href="/admin" 
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-primary/20 text-white/50 hover:text-primary transition-all cursor-pointer border border-white/10 hover:border-primary/50"
          title="Configurações (Admin)"
        >
          <Settings size={20} />
        </Link>

        <div className="text-4xl font-black font-orbitron tracking-widest flex items-center">
          <span className="text-white">PRO</span>
          <span className="text-primary">DASH</span>
          <span className="ml-2 px-2 py-1 bg-white/10 rounded text-xs font-bold tracking-widest text-white/70">CLOUD</span>
        </div>
        <p className="text-white/50 tracking-[0.2em] mt-2 text-sm">GLOBAL LEADERBOARD</p>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-20">
        <div className="flex justify-center gap-4 mb-8">
          {["0-100", "100-200", "201m", "top_speed"].map((mod) => (
            <button
              key={mod}
              onClick={() => setActiveTab(mod)}
              className={`tab-btn ${activeTab === mod ? "active" : ""}`}
            >
              {mod === "201m" ? "201 METROS" : mod === "top_speed" ? "TOP SPEED" : `${mod} KM/H`}
            </button>
          ))}
        </div>

        <div className="glass-panel">
          <div className="table-header">
            <div>#</div>
            <div>PILOTO</div>
            <div>CARRO</div>
            <div className="text-right">{activeTab === "top_speed" ? "VELOCIDADE" : "TEMPO"}</div>
          </div>
          
          <div className="min-h-[400px]">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="spinner"></div>
              </div>
            ) : data.length === 0 ? (
              <div className="text-center text-white/30 pt-12">Nenhum registro encontrado.</div>
            ) : (
              data.map((row, index) => (
                <div key={row.id} className={`table-row rank-${index + 1}`}>
                  <div className="rank-num font-orbitron font-bold">{(index + 1).toString().padStart(2, '0')}</div>
                  <div className="font-bold text-white uppercase">
                    <Link href={`/piloto/${encodeURIComponent(row.piloto)}`} className="hover:text-primary transition-colors underline decoration-white/20 underline-offset-4">
                      {row.piloto}
                    </Link>
                  </div>
                  <div className="text-white/70 text-sm uppercase">{row.carro}</div>
                  <div className="time-val text-right">
                    {activeTab === "top_speed" 
                      ? `${row.tempo.toFixed(0)} km/h` 
                      : `${row.tempo.toFixed(3)}s`}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <footer className="text-center text-white/30 text-xs py-8">
        <p>ProDash Performance Electronics &copy; {new Date().getFullYear()}. Tempos registrados via hardware oficial.</p>
      </footer>
    </>
  );
}
