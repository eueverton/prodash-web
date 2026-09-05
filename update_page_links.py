import re

with open(r'f:\prodash-nextweb\src\app\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the div containing row.piloto with a Link
old_div = '''<div className="font-bold text-white uppercase">{row.piloto}</div>'''
new_div = '''<div className="font-bold text-white uppercase">
                    <Link href={`/piloto/${encodeURIComponent(row.piloto)}`} className="hover:text-primary transition-colors underline decoration-white/20 underline-offset-4">
                      {row.piloto}
                    </Link>
                  </div>'''

content = content.replace(old_div, new_div)

with open(r'f:\prodash-nextweb\src\app\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated page.tsx with Links to Pilot Profiles")
