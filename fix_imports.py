import re

# Fix page.tsx
page_path = r'f:\prodash-nextweb\src\app\page.tsx'
with open(page_path, 'r', encoding='utf-8') as f:
    page_content = f.read()

# Add imports to top if they don't exist
if 'import Link from "next/link";' not in page_content:
    page_content = 'import Link from "next/link";\n' + page_content
if 'import { Settings } from "lucide-react";' not in page_content:
    page_content = 'import { Settings } from "lucide-react";\n' + page_content

with open(page_path, 'w', encoding='utf-8') as f:
    f.write(page_content)

# Fix piloto/[nome]/page.tsx
piloto_path = r'f:\prodash-nextweb\src\app\piloto\[nome]\page.tsx'
with open(piloto_path, 'r', encoding='utf-8') as f:
    piloto_content = f.read()

if 'import Link from "next/link";' not in piloto_content:
    piloto_content = 'import Link from "next/link";\n' + piloto_content
if 'import { ArrowLeft, CarFront, Trophy } from "lucide-react";' not in piloto_content:
    piloto_content = 'import { ArrowLeft, CarFront, Trophy } from "lucide-react";\n' + piloto_content
if 'import { use } from "react";' not in piloto_content:
    piloto_content = 'import { use } from "react";\n' + piloto_content

with open(piloto_path, 'w', encoding='utf-8') as f:
    f.write(piloto_content)

print("Imports restored!")
