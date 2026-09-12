"use client";
import { use } from "react";
import { ArrowLeft, CarFront, Trophy, Ghost, X } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Link from "next/link";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type RankingEntry = {
  id: number;
  piloto: string;
  carro: string;
  modalidade: string;
  tempo: number;
  csv_data: string | null;
  created_at: string;
};

export default function PilotProfilePage({ params }: { params: Promise<{ nome: string }> }) {
  const unwrappedParams = use(params);
  const pilotoNome = decodeURIComponent(unwrappedParams.nome);
  
  const [records, setRecords] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGhost, setSelectedGhost] = useState<RankingEntry | null>(null);
  const [compareList, setCompareList] = useState<RankingEntry[]>([]);
  const [selectedCompare, setSelectedCompare] = useState<RankingEntry | null>(null);

  useEffect(() => {
    if (!selectedGhost) {
      setCompareList([]);
      setSelectedCompare(null);
      return;
    }
    const fetchCompare = async () => {
      const { data } = await supabase
        .from("ranking")
        .select("*")
        .eq("modalidade", selectedGhost.modalidade)
        .neq("id", selectedGhost.id)
        .not("csv_data", "is", null)
        .order("tempo", { ascending: selectedGhost.modalidade !== "top_speed" })
        .limit(10);
      setCompareList(data || []);
    };
    fetchCompare();
  }, [selectedGhost]);

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
      {/* Ghost Modal */}
      {selectedGhost && selectedGhost.csv_data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl shadow-primary/20">
            
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/50">
              <div className="flex items-center gap-3">
                <Ghost className="text-primary" size={24} />
                <h3 className="text-lg font-orbitron font-bold text-white uppercase">Telemetria Ghost - {selectedGhost.modalidade}</h3>
              </div>
              <button onClick={() => setSelectedGhost(null)} className="text-white/50 hover:text-white transition-colors p-2">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <p className="text-white/50 text-sm uppercase tracking-widest">Piloto Principal</p>
                  <p className="text-2xl font-bold text-white">{selectedGhost.piloto} <span className="text-primary text-lg">({selectedGhost.tempo}s)</span></p>
                </div>
                {compareList.length > 0 && (
                  <div className="bg-black/40 p-3 rounded-lg border border-white/10 w-full md:w-auto">
                    <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Comparar com (Ghost Secundário)</p>
                    <select 
                      className="bg-gray-800 text-white border border-white/20 rounded p-2 text-sm w-full outline-none focus:border-primary"
                      onChange={(e) => {
                        const targetId = parseInt(e.target.value);
                        const match = compareList.find(c => c.id === targetId);
                        setSelectedCompare(match || null);
                      }}
                    >
                      <option value="">Nenhum (Visualização Solo)</option>
                      {compareList.map(c => (
                         <option key={c.id} value={c.id}>{c.piloto} - {c.carro} ({c.tempo}s)</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="h-[400px] w-full bg-black/30 rounded-xl p-4 border border-white/5">
                <GhostChart csvData={selectedGhost.csv_data} compareCsvData={selectedCompare?.csv_data || undefined} compareName={selectedCompare?.piloto} />
              </div>
            </div>
          </div>
        </div>
      )}

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
              onViewGhost={setSelectedGhost}
            />
            
            <RecordCard 
              title="100 a 200 km/h" 
              record={best100to200} 
              format={(v) => `${v.toFixed(3)}s`} 
              onViewGhost={setSelectedGhost}
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

        {/* Histórico Completo de Puxadas */}
        {records.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-orbitron font-bold text-white mb-6 border-b border-white/10 pb-4">HISTÓRICO COMPLETO (GHOSTS)</h2>
            <div className="flex flex-col gap-3">
              {records.map((r) => (
                <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/10 transition-colors">
                  <div>
                    <span className="text-primary font-bold mr-3">{r.modalidade}</span>
                    <span className="text-white/80 text-sm">
                      {new Date(r.created_at).toLocaleString('pt-BR')}
                    </span>
                    <p className="text-sm text-white/50 mt-1">{r.carro}</p>
                  </div>
                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <span className="text-2xl font-orbitron font-bold text-white">
                      {r.modalidade === "top_speed" ? `${r.tempo} km/h` : `${r.tempo}s`}
                    </span>
                    {r.csv_data && (
                      <button 
                        onClick={() => setSelectedGhost(r)}
                        className="flex items-center gap-2 text-xs font-bold text-black bg-primary hover:bg-primary/80 px-4 py-2 rounded-full transition-all whitespace-nowrap"
                      >
                        <Ghost size={14} /> VER TELEMETRIA
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function RecordCard({ title, record, format, highlight = false, onViewGhost }: { title: string, record: RankingEntry | null, format: (v: number) => string, highlight?: boolean, onViewGhost?: (r: RankingEntry) => void }) {
  if (!record) return null;
  
  return (
    <div className={`p-6 rounded-xl border ${highlight ? 'bg-primary/5 border-primary/30' : 'bg-white/5 border-white/10'} hover:bg-white/10 transition-all flex justify-between items-center`}>
      <div>
        <p className="text-xs text-white/50 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-sm text-white/80 uppercase">{record.carro}</p>
        {record.csv_data && onViewGhost && (
          <button 
            onClick={() => onViewGhost(record)}
            className="mt-3 flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 px-3 py-1.5 rounded-full transition-all"
          >
            <Ghost size={14} /> GHOST TELEMETRY
          </button>
        )}
      </div>
      <div className={`text-3xl font-orbitron font-bold ${highlight ? 'text-primary' : 'text-white'}`}>
        {format(record.tempo)}
      </div>
    </div>
  );
}

function GhostChart({ csvData, compareCsvData, compareName }: { csvData: string, compareCsvData?: string, compareName?: string }) {
  const [data, setData] = useState<any[]>([]);
  const [visible, setVisible] = useState<Record<string, boolean>>({
    speed: true, rpm: true, map: false, advance: false, iat: false, volt: false, gear: false
  });

  const toggleLine = (key: string) => setVisible(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    if (!csvData) return;
    
    // Parse the simple CSV format: time,rpm,speed,tps,map,gear,iat
    const lines = csvData.split("\n");
    const parsedData = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cols = lines[i].split(",");
      if (cols.length >= 8) {
        parsedData.push({
          time: parseFloat(cols[0]),
          rpm: parseInt(cols[1]),
          speed: parseInt(cols[2]),
          iat: parseInt(cols[3]),
          advance: parseInt(cols[4]),
          map: parseInt(cols[5]),
          volt: parseFloat(cols[6]),
          gear: parseInt(cols[7])
        });
      } else if (cols.length >= 3) {
        parsedData.push({
          time: parseFloat(cols[0]),
          rpm: parseInt(cols[1]),
          speed: parseInt(cols[2]),
        });
      }
    }

    if (compareCsvData) {
      const cLines = compareCsvData.split("\n");
      for (let i = 1; i < cLines.length; i++) {
        if (!cLines[i].trim()) continue;
        const cols = cLines[i].split(",");
        if (cols.length >= 3) {
          const t = parseFloat(cols[0]);
          const match = parsedData.find(p => Math.abs(p.time - t) < 0.05);
          if (match) {
            match.compareSpeed = parseInt(cols[2]);
            match.compareRpm = parseInt(cols[1]);
          } else {
            parsedData.push({
              time: t,
              compareSpeed: parseInt(cols[2]),
              compareRpm: parseInt(cols[1]),
            });
          }
        }
      }
      parsedData.sort((a, b) => a.time - b.time);
    }
    
    // Filter out rows where all extended values are -99 (unconnected sensors) so they don't break the chart
    setData(parsedData.map(d => ({
      ...d,
      iat: d.iat === -99 ? null : d.iat,
      advance: d.advance === -99 ? null : d.advance,
      map: d.map === -1 ? null : d.map
    })));
  }, [csvData, compareCsvData]);

  if (data.length === 0) return <div className="flex h-full items-center justify-center text-white/50">Carregando Telemetria...</div>;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {Object.keys(visible).map(key => (
          <button 
            key={key} 
            onClick={() => toggleLine(key)}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${visible[key] ? 'bg-primary text-black border-primary' : 'bg-transparent text-white/50 border-white/20 hover:border-white/50'}`}
          >
            {key.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
            <XAxis dataKey="time" stroke="#ffffff50" tickFormatter={(val) => `${val}s`} tick={{fontSize: 12}} />
            
            <YAxis yAxisId="speed" orientation="left" stroke="#00ffcc" tick={{fontSize: 12}} domain={['dataMin', 'dataMax']} />
            <YAxis yAxisId="rpm" orientation="right" stroke="#ff0055" tick={{fontSize: 12}} domain={['dataMin', 'dataMax']} />
            
            <Tooltip content={<CustomTooltip />} />
            
            {visible.speed && <Line yAxisId="speed" type="monotone" dataKey="speed" name="Velocidade" stroke="#00ffcc" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />}
            {visible.rpm && <Line yAxisId="rpm" type="monotone" dataKey="rpm" name="RPM" stroke="#ff0055" strokeWidth={2} dot={false} />}
            {visible.map && <Line yAxisId="speed" type="monotone" dataKey="map" name="MAP" stroke="#ffaa00" strokeWidth={2} dot={false} />}
            {visible.advance && <Line yAxisId="speed" type="monotone" dataKey="advance" name="Ponto" stroke="#aa00ff" strokeWidth={2} dot={false} />}
            {visible.iat && <Line yAxisId="speed" type="monotone" dataKey="iat" name="IAT" stroke="#ff00aa" strokeWidth={2} dot={false} />}
            {visible.volt && <Line yAxisId="speed" type="monotone" dataKey="volt" name="Bateria" stroke="#ffff00" strokeWidth={2} dot={false} />}
            {visible.gear && <Line yAxisId="speed" type="stepAfter" dataKey="gear" name="Marcha" stroke="#ffffff" strokeWidth={2} dot={false} />}
            
            {compareCsvData && visible.speed && <Line yAxisId="speed" type="monotone" dataKey="compareSpeed" name={`Vel ${compareName}`} stroke="#00aa88" strokeDasharray="5 5" strokeWidth={2} dot={false} />}
            {compareCsvData && visible.rpm && <Line yAxisId="rpm" type="monotone" dataKey="compareRpm" name={`RPM ${compareName}`} stroke="#aa0033" strokeDasharray="5 5" strokeWidth={2} dot={false} />}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-900 border border-white/20 p-3 rounded-lg shadow-xl text-sm">
        <p className="text-white font-bold mb-2 border-b border-white/10 pb-1">Tempo: {label}s</p>
        <p style={{ color: '#00ffcc' }}>Velocidade: {data.speed} km/h</p>
        <p style={{ color: '#ff0055' }}>RPM: {data.rpm}</p>
        
        {data.gear !== undefined && <p className="text-white/80 mt-1">Marcha: {data.gear}</p>}
        {data.iat !== undefined && data.iat !== -99 && <p className="text-white/80">Temp Ar (IAT): {data.iat} °C</p>}
        {data.advance !== undefined && data.advance !== -99 && <p className="text-white/80">Ponto (Avanço): {data.advance}°</p>}
        {data.map !== undefined && data.map !== -1 && <p className="text-white/80">Pressão MAP: {data.map} kPa</p>}
        {data.volt !== undefined && <p className="text-white/80">Bateria: {data.volt} V</p>}
        
        {data.compareSpeed !== undefined && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <p className="text-white/50 text-xs mb-1">GHOST COMPARATIVO</p>
            <p style={{ color: '#00aa88' }}>Velocidade: {data.compareSpeed} km/h</p>
            <p style={{ color: '#aa0033' }}>RPM: {data.compareRpm}</p>
          </div>
        )}
      </div>
    );
  }
  return null;
};
