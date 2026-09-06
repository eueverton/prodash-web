import os

# 1. Update route.ts
route_path = r'f:\prodash-nextweb\src\app\api\ota\route.ts'
with open(route_path, 'r', encoding='utf-8') as f:
    route_content = f.read()

get_method = '''
export async function GET() {
  try {
    const { data, error } = await supabase.storage.from("firmwares").list();
    if (error) {
      console.error("Storage list error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ files: data || [] });
  } catch (err: any) {
    console.error("API GET Error:", err);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
'''
if 'export async function GET()' not in route_content:
    route_content += get_method
    with open(route_path, 'w', encoding='utf-8') as f:
        f.write(route_content)

# 2. Update page.tsx
page_path = r'f:\prodash-nextweb\src\app\admin\page.tsx'
with open(page_path, 'r', encoding='utf-8') as f:
    page_content = f.read()

search_fetch = '''      const { data: historyData } = await supabase.storage.from("firmwares").list();
      if (historyData) {
        historyData.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        setOtaHistory(historyData);
      }'''

replace_fetch = '''      const res = await fetch("/api/ota");
      if (res.ok) {
        const json = await res.json();
        if (json.files) {
          const historyData = json.files.filter((f: any) => f.name !== '.emptyFolderPlaceholder');
          historyData.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
          setOtaHistory(historyData);
        }
      }'''
      
page_content = page_content.replace(search_fetch, replace_fetch)

with open(page_path, 'w', encoding='utf-8') as f:
    f.write(page_content)

print("Fix applied")
