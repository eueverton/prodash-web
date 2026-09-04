import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Usamos a chave SECRETA (Service Role) aqui no backend. Nunca vai para o navegador.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vnwpornmtqnevjlibwsw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 

const supabase = createClient(supabaseUrl, supabaseServiceKey as string);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const version = formData.get("version") as string;
    const notes = formData.get("notes") as string;
    const password = formData.get("password") as string;

    // 1. CHECAGEM DE SEGURANÇA (Senha Master salva no painel da Vercel)
    const masterPassword = process.env.ADMIN_PASSWORD || "prodash123";
    
    if (password !== masterPassword) {
      return NextResponse.json({ error: "Senha de Administrador Incorreta!" }, { status: 401 });
    }

    if (!file || !version) {
      return NextResponse.json({ error: "Arquivo ou versão faltando." }, { status: 400 });
    }

    // 2. UPLOAD PRO STORAGE
    const fileName = `prodash_v${version}_${Date.now()}.bin`;
    
    const { error: uploadError } = await supabase.storage
      .from("firmwares")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage Error:", uploadError);
      return NextResponse.json({ error: "Erro ao subir o arquivo: " + uploadError.message }, { status: 500 });
    }

    // 3. PEGAR A URL PÚBLICA
    const { data: publicUrlData } = supabase.storage
      .from("firmwares")
      .getPublicUrl(fileName);
      
    const publicUrl = publicUrlData.publicUrl;

    // 4. ATUALIZAR O BANCO DE DADOS PARA A DASH VER
    const { error: dbError } = await supabase
      .from("firmware_updates")
      .update({
        version: parseFloat(version),
        file_url: publicUrl,
        release_notes: notes || "Atualização OTA",
      })
      .eq("id", 1);

    if (dbError) {
      console.error("DB Error:", dbError);
      return NextResponse.json({ error: "Erro ao atualizar a versão no banco." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `V${version} implantada com sucesso!` });

  } catch (err: unknown) {
    console.error("API Error:", err);
    return NextResponse.json({ error: "Erro interno no servidor Vercel." }, { status: 500 });
  }
}
