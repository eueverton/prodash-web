"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, ArrowLeft, Trash2, Cpu } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("ota");
  
  // OTA State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentOtaVersion, setCurrentOtaVersion] = useState<number | null>(null);
  const [otaHistory, setOtaHistory] = useState<any[]>([]);

  // Ranking State
  const [rankingData, setRankingData] = useState<any[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentOta();
      if (activeTab === "ranking") {
        fetchRanking();
      }
    }
  }, [isAuthenticated, activeTab]);

  const fetchCurrentOta = async () => {
    try {
      const { data } = await supabase.from("firmware_updates").select("version").eq("id", 1).single();
      if (data) setCurrentOtaVersion(data.version);
      
      const res = await fetch("/api/ota");
      if (res.ok) {
        const json = await res.json();
        if (json.files) {
          const historyData = json.files.filter((f: any) => f.name !== '.emptyFolderPlaceholder');
          historyData.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
          setOtaHistory(historyData);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRanking = async () => {
    setLoadingRanking(true);
    try {
      const { data } = await supabase.from("ranking").select("*").order("created_at", { ascending: false }).limit(50);
      setRankingData(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRanking(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length > 0) {
      setIsAuthenticated(true);
      setErrorMsg("");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!file || !file.name.endsWith(".bin")) {
      setErrorMsg("Por favor, selecione um arquivo de Firmware (.bin) válido.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("version", version);
    formData.append("notes", notes);
    formData.append("password", password);

    try {
      const res = await fetch("/api/ota", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro desconhecido");

      alert("Atualização lançada com SUCESSO! 🚀");
      setVersion(""); setNotes(""); setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchCurrentOta(); // Reload version
    } catch (err: any) {
      setErrorMsg(err.message || "Erro desconhecido");
      if (err.message && err.message.includes("Senha")) setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (id: number) => {
    if (!confirm("Certeza absoluta que deseja excluir este recorde? Esta ação não pode ser desfeita.")) return;
    
    try {
      const res = await fetch("/api/ranking", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao deletar");
      
      // Update UI
      setRankingData(rankingData.filter(r => r.id !== id));
      alert("Registro excluído!");
    } catch (err: any) {
      alert("Falha: " + err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-16 relative">
      <Link href="/" className="absolute top-6 left-6 text-white/50 hover:text-primary transition-all flex items-center gap-2">
        <ArrowLeft size={20} /> Voltar ao Ranking
      </Link>

      <div className="w-full max-w-4xl">
        {!isAuthenticated ? (
          <div className="glass-panel p-8 max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-primary">CENTRAL ADMIN</h1>
              <p className="text-white/50 text-sm mt-2">Acesso Restrito</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Senha Master</label>
                <input 
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-4 text-white focus:outline-none focus:border-primary transition-all"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-primary/80 text-black font-orbitron font-bold py-4 rounded-lg transition-all shadow-[0_0_20px_rgba(0,255,204,0.3)]">
                ACESSAR SISTEMA
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div className="flex justify-center gap-4 mb-8">
              <button onClick={() => setActiveTab("ota")} className={`tab-btn ${activeTab === "ota" ? "active" : ""}`}>DEPLOY OTA</button>
              <button onClick={() => setActiveTab("ranking")} className={`tab-btn ${activeTab === "ranking" ? "active" : ""}`}>MODERAR RANKING</button>
            </div>

            {activeTab === "ota" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* OTA Status & History Panel */}
                <div className="glass-panel flex flex-col overflow-hidden">
                  <div className="p-8 flex flex-col items-center justify-center text-center border-b border-white/5">
                    <Cpu size={50} className="text-primary/50 mb-4" />
                    <h2 className="text-lg font-orbitron font-bold text-white mb-2">VERSÃO ATUAL (PRODUÇÃO)</h2>
                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-primary">
                      v{currentOtaVersion || "--"}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-black/30 flex-1 overflow-y-auto max-h-[300px]">
                    <h3 className="text-xs uppercase tracking-widest text-white/50 mb-4 text-center">Histórico de Uploads</h3>
                    {otaHistory.length === 0 ? (
                      <div className="text-center text-white/30 text-xs">Nenhum histórico encontrado.</div>
                    ) : (
                      <div className="space-y-2">
                        {otaHistory.map((file, idx) => (
                          <div key={idx} className="bg-white/5 rounded p-3 text-xs flex justify-between items-center">
                            <div>
                              <div className="text-white font-bold">{file.name}</div>
                              <div className="text-white/50 mt-1">{new Date(file.created_at).toLocaleString('pt-BR')}</div>
                            </div>
                            <div className="text-primary/70">{(file.metadata?.size / 1024).toFixed(0)} KB</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* OTA Upload Panel */}
                <div className="glass-panel p-8">
                  <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase text-white/50 mb-1">Nova Versão (Ex: 48.5)</label>
                      <input type="number" step="0.1" value={version} onChange={(e) => setVersion(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded p-2 text-white" required />
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-white/50 mb-1">Notas (Opcional)</label>
                      <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded p-2 text-white" />
                    </div>
                    <div className={`border-2 border-dashed rounded p-4 text-center cursor-pointer ${file ? 'border-primary' : 'border-white/10'}`} onClick={() => fileInputRef.current?.click()}>
                      <UploadCloud size={30} className="mx-auto mb-2 text-white/50" />
                      <span className="text-xs text-white/70">{file ? file.name : "Selecionar .bin"}</span>
                      <input type="file" ref={fileInputRef} accept=".bin" onChange={(e) => { if(e.target.files?.length) setFile(e.target.files[0]); }} className="hidden" required />
                    </div>
                    {errorMsg && <div className="text-red-400 text-sm text-center">{errorMsg}</div>}
                    <button type="submit" disabled={loading} className="w-full bg-primary text-black font-bold py-3 rounded">
                      {loading ? "ENVIANDO..." : "LANÇAR ATUALIZAÇÃO"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === "ranking" && (
              <div className="glass-panel overflow-hidden">
                <div className="table-header grid-cols-[1fr_2fr_2fr_1fr_1fr] p-4 text-sm font-bold bg-white/5">
                  <div>ID</div>
                  <div>PILOTO</div>
                  <div>CARRO</div>
                  <div>MODALIDADE</div>
                  <div className="text-right">AÇÕES</div>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  {loadingRanking ? (
                    <div className="p-8 text-center text-white/50">Carregando...</div>
                  ) : rankingData.map((row) => (
                    <div key={row.id} className="grid grid-cols-[1fr_2fr_2fr_1fr_1fr] gap-4 p-4 border-b border-white/5 items-center hover:bg-white/5">
                      <div className="text-white/30 text-xs">#{row.id}</div>
                      <div className="text-white uppercase font-bold text-sm">{row.piloto}</div>
                      <div className="text-white/70 text-xs uppercase">{row.carro}</div>
                      <div className="text-primary text-xs uppercase font-orbitron">{row.modalidade}</div>
                      <div className="text-right">
                        <button onClick={() => handleDeleteRecord(row.id)} className="p-2 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors" title="Apagar Registro">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
