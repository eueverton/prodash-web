import os
import re

page_path = r'f:\prodash-nextweb\src\app\piloto\[nome]\page.tsx'

with open(page_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add states for compare
state_search = '''  const [selectedGhost, setSelectedGhost] = useState<RankingEntry | null>(null);'''
state_replace = '''  const [selectedGhost, setSelectedGhost] = useState<RankingEntry | null>(null);
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
  }, [selectedGhost]);'''
content = content.replace(state_search, state_replace)

# Modify HTML for dropdown
html_search = '''              <div className="mb-6 flex justify-between items-end">
                <div>
                  <p className="text-white/50 text-sm uppercase tracking-widest">Piloto Principal</p>
                  <p className="text-2xl font-bold text-white">{selectedGhost.piloto} <span className="text-primary text-lg">({selectedGhost.tempo}s)</span></p>
                </div>
              </div>'''
html_replace = '''              <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
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
              </div>'''
content = content.replace(html_search, html_replace)

# Modify GhostChart usage
usage_search = '''<GhostChart csvData={selectedGhost.csv_data} />'''
usage_replace = '''<GhostChart csvData={selectedGhost.csv_data} compareCsvData={selectedCompare?.csv_data || undefined} compareName={selectedCompare?.piloto} />'''
content = content.replace(usage_search, usage_replace)

# Modify GhostChart Component Signature
comp_search = '''function GhostChart({ csvData }: { csvData: string }) {'''
comp_replace = '''function GhostChart({ csvData, compareCsvData, compareName }: { csvData: string, compareCsvData?: string, compareName?: string }) {'''
content = content.replace(comp_search, comp_replace)

# Modify GhostChart Data Parse Logic
parse_search = '''    for (let i = 1; i < lines.length; i++) {
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
  }, [csvData]);'''
parse_replace = '''    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cols = lines[i].split(",");
      if (cols.length >= 3) {
        parsedData.push({
          time: parseFloat(cols[0]),
          rpm: parseInt(cols[1]),
          speed: parseInt(cols[2]),
        });
      }
    }

    if (compareCsvData) {
      const cLines = compareCsvData.split("\\n");
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
    setData(parsedData);
  }, [csvData, compareCsvData]);'''
content = content.replace(parse_search, parse_replace)

# Add Lines to Chart
chart_lines_search = '''        <Line yAxisId="speed" type="monotone" dataKey="speed" name="Velocidade (km/h)" stroke="#00ffcc" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
        <Line yAxisId="rpm" type="monotone" dataKey="rpm" name="RPM" stroke="#ff0055" strokeWidth={2} dot={false} />'''
chart_lines_replace = '''        <Line yAxisId="speed" type="monotone" dataKey="speed" name="Velocidade (km/h)" stroke="#00ffcc" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
        <Line yAxisId="rpm" type="monotone" dataKey="rpm" name="RPM" stroke="#ff0055" strokeWidth={2} dot={false} />
        {compareCsvData && (
          <>
             <Line yAxisId="speed" type="monotone" dataKey="compareSpeed" name={`Vel ${compareName}`} stroke="#00aa88" strokeDasharray="5 5" strokeWidth={2} dot={false} />
             <Line yAxisId="rpm" type="monotone" dataKey="compareRpm" name={`RPM ${compareName}`} stroke="#aa0033" strokeDasharray="5 5" strokeWidth={2} dot={false} />
          </>
        )}'''
content = content.replace(chart_lines_search, chart_lines_replace)


with open(page_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Compare feature added")
