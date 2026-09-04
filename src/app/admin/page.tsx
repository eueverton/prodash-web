"use client";

import { useState, useRef } from "react";
import { UploadCloud, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    formData.append("password", password); // Envia a senha para o backend verificar

    try {
      const res = await fetch("/api/ota", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro desconhecido");
      }

      alert("Atualização lançada com SUCESSO! 🚀\nO painel fará o download na próxima inicialização.");
      setVersion("");
      setNotes("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
        if (err.message.includes("Senha")) setIsAuthenticated(false);
      } else {
        setErrorMsg("Erro desconhecido");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <Link href="/" className="absolute top-6 left-6 text-white/50 hover:text-primary transition-all flex items-center gap-2">
        <ArrowLeft size={20} /> Voltar ao Ranking
      </Link>

      <div className="w-full max-w-md">
        {!isAuthenticated ? (
          <div className="glass-panel p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-primary">CENTRAL OTA</h1>
              <p className="text-white/50 text-sm mt-2">Acesso Restrito</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Senha Master</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
          <div className="glass-panel p-8">
             <div className="text-center mb-8">
              <h1 className="text-3xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-primary">OTA DEPLOY</h1>
              <p className="text-white/50 text-sm mt-2">Envio de Firmware</p>
            </div>

            <form onSubmit={handleUpload} className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Nova Versão (Ex: 47.0)</label>
                <input 
                  type="number" step="0.1"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Notas (Opcional)</label>
                <input 
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Novo Layout Motec"
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <div 
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${file ? 'border-primary bg-primary/5' : 'border-white/10 hover:border-primary/50'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud size={40} className={file ? "text-primary mb-2" : "text-white/30 mb-2"} />
                <span className="text-sm text-white/70">
                  {file ? file.name : "Clique para selecionar o arquivo .bin"}
                </span>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".bin"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) setFile(e.target.files[0]);
                  }}
                  className="hidden"
                  required
                />
              </div>

              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
                  {errorMsg}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-black font-orbitron font-bold py-4 rounded-lg transition-all shadow-[0_0_20px_rgba(0,255,204,0.3)] flex justify-center items-center gap-2"
              >
                {loading ? <span className="spinner w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span> : "LANÇAR ATUALIZAÇÃO"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
