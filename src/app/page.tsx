"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Settings } from "lucide-react";
import Link from "next/link";

// Usamos chaves públicas do Supabase para o front-end
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vnwpornmtqnevjlibwsw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZud3Bvcm5tdHFuZXZqbGlid3N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzOTcxNDYsImV4cCI6MjEwMzk3MzE0Nn0.BzGUUeoB7hCH0c8JVuY3U0JxQUi_pyrXr2rEZ6K7iqM';
const supabase = createClient(supabaseUrl, supabaseKey);

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

  useEffect(() => {
    fetchRanking(activeTab);
  }, [activeTab]);

  async function fetchRanking(modalidade: string) {
    setLoading(true);
    try {
      const { data: rankingData, error } = await supabase
        .from("ranking")
        .select("*")
        .eq("modalidade", modalidade)
        .order("tempo", { ascending: true })
        .limit(10);

      if (error) throw error;
      setData(rankingData || []);
    } catch (err) {
      console.error("Erro ao buscar ranking:", err);
    } finally {
      setLoading(false);
    }
  }

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
          {["0-100", "100-200", "201m"].map((mod) => (
            <button
              key={mod}
              onClick={() => setActiveTab(mod)}
              className={`tab-btn ${activeTab === mod ? "active" : ""}`}
            >
              {mod === "201m" ? "201 METROS" : `${mod} KM/H`}
            </button>
          ))}
        </div>

        <div className="glass-panel">
          <div className="table-header">
            <div>#</div>
            <div>PILOTO</div>
            <div>CARRO</div>
            <div className="text-right">TEMPO</div>
          </div>
          
          <div className="min-h-[400px]">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="spinner"></div>
              </div>
            ) : data.length === 0 ? (
              <div className="text-center text-white/30 pt-12">Nenhum tempo registrado ainda.</div>
            ) : (
              data.map((row, index) => (
                <div key={row.id} className={`table-row rank-${index + 1}`}>
                  <div className="rank-num font-orbitron font-bold">{(index + 1).toString().padStart(2, '0')}</div>
                  <div className="font-bold text-white uppercase">{row.piloto}</div>
                  <div className="text-white/70 text-sm uppercase">{row.carro}</div>
                  <div className="time-val text-right">{row.tempo.toFixed(3)}s</div>
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
