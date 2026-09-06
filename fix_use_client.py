import os

files = [
    r'f:\prodash-nextweb\src\app\page.tsx',
    r'f:\prodash-nextweb\src\app\piloto\[nome]\page.tsx'
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    use_client_idx = -1
    for i, line in enumerate(lines):
        if '"use client"' in line or "'use client'" in line:
            use_client_idx = i
            break
            
    if use_client_idx > 0:
        use_client_line = lines.pop(use_client_idx)
        lines.insert(0, use_client_line)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(lines)
            
print("Moved 'use client' to top")
