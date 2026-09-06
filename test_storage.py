import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(r'f:\prodash-nextweb\.env.local')

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not key:
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

res = supabase.storage.from_('firmwares').list()
print(res)
