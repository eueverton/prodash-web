import os
import re

page_path = r'f:\prodash-nextweb\src\app\piloto\[nome]\page.tsx'

with open(page_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add csv_data to type
type_search = '''type RankingEntry = {
  id: number;
  piloto: string;
  carro: string;
  modalidade: string;
  tempo: number;
};'''
type_replace = '''type RankingEntry = {
  id: number;
  piloto: string;
  carro: string;
  modalidade: string;
  tempo: number;
  csv_data: string | null;
};'''
content = content.replace(type_search, type_replace)

# Add imports for Recharts and Modal icons
import_search = '''import { ArrowLeft, CarFront, Trophy } from "lucide-react";'''
import_replace = '''import { ArrowLeft, CarFront, Trophy, Ghost, X } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";'''
content = content.replace(import_search, import_replace)

# Add state for Modal inside PilotProfilePage
state_search = '''  const [records, setRecords] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);'''
state_replace = '''  const [records, setRecords] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGhost, setSelectedGhost] = useState<RankingEntry | null>(null);'''
content = content.replace(state_search, state_replace)

# Modify RecordCard signature and calls
card_usage_search = '''            <RecordCard 
              title="0 a 100 km/h" 
              record={best0to100} 
              format={(v) => `${v.toFixed(3)}s`} 
            />'''
card_usage_replace = '''            <RecordCard 
              title="0 a 100 km/h" 
              record={best0to100} 
              format={(v) => `${v.toFixed(3)}s`} 
              onViewGhost={setSelectedGhost}
            />'''
content = content.replace(card_usage_search, card_usage_replace)

card_usage_search2 = '''            <RecordCard 
              title="100 a 200 km/h" 
              record={best100to200} 
              format={(v) => `${v.toFixed(3)}s`} 
            />'''
card_usage_replace2 = '''            <RecordCard 
              title="100 a 200 km/h" 
              record={best100to200} 
              format={(v) => `${v.toFixed(3)}s`} 
              onViewGhost={setSelectedGhost}
            />'''
content = content.replace(card_usage_search2, card_usage_replace2)

# RecordCard component
comp_search = '''function RecordCard({ title, record, format, highlight = false }: { title: string, record: RankingEntry | null, format: (v: number) => string, highlight?: boolean }) {
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
}'''
comp_replace = '''function RecordCard({ title, record, format, highlight = false, onViewGhost }: { title: string, record: RankingEntry | null, format: (v: number) => string, highlight?: boolean, onViewGhost?: (r: RankingEntry) => void }) {
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
}'''
content = content.replace(comp_search, comp_replace)

# Add Modal HTML inside PilotProfilePage
modal_html = '''
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
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <p className="text-white/50 text-sm uppercase tracking-widest">Piloto Principal</p>
                  <p className="text-2xl font-bold text-white">{selectedGhost.piloto} <span className="text-primary text-lg">({selectedGhost.tempo}s)</span></p>
                </div>
              </div>
              
              <div className="h-[400px] w-full bg-black/30 rounded-xl p-4 border border-white/5">
                <GhostChart csvData={selectedGhost.csv_data} />
              </div>
            </div>
          </div>
        </div>
      )}
'''

render_search = '''    <div className="min-h-screen p-4 pb-20 relative">'''
render_replace = render_search + modal_html
content = content.replace(render_search, render_replace)

# Add GhostChart component at the end
chart_comp = '''
function GhostChart({ csvData }: { csvData: string }) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (!csvData) return;
    
    // Parse the simple CSV format: time,rpm,speed,tps,map,gear,iat
    const lines = csvData.split("\\n");
    const parsedData = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const cols = lines[i].split(",");
      if (cols.length >= 3) {
        parsedData.push({
          time: parseFloat(cols[0]),
          rpm: parseInt(cols[1]),
          speed: parseInt(cols[2]),
          tps: parseInt(cols[3] || "0"),
          map: parseInt(cols[4] || "0"),
          gear: parseInt(cols[5] || "0"),
        });
      }
    }
    setData(parsedData);
  }, [csvData]);

  if (data.length === 0) return <div className="flex h-full items-center justify-center text-white/50">Carregando Telemetria...</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
        <XAxis 
          dataKey="time" 
          stroke="#ffffff50" 
          tickFormatter={(val) => `${val}s`} 
          tick={{fontSize: 12}}
        />
        <YAxis 
          yAxisId="speed" 
          orientation="left" 
          stroke="#00ffcc" 
          tick={{fontSize: 12}}
          domain={['dataMin', 'dataMax']}
        />
        <YAxis 
          yAxisId="rpm" 
          orientation="right" 
          stroke="#ff0055" 
          tick={{fontSize: 12}} 
          domain={['dataMin', 'dataMax']}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
          labelStyle={{ color: '#fff', fontWeight: 'bold' }}
          labelFormatter={(val) => `Tempo: ${val}s`}
        />
        <Legend />
        <Line yAxisId="speed" type="monotone" dataKey="speed" name="Velocidade (km/h)" stroke="#00ffcc" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
        <Line yAxisId="rpm" type="monotone" dataKey="rpm" name="RPM" stroke="#ff0055" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
'''
content += chart_comp

with open(page_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Web UI modified")
