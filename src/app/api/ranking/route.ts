import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vnwpornmtqnevjlibwsw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 

const supabase = createClient(supabaseUrl, supabaseServiceKey as string);

export async function DELETE(request: Request) {
  try {
    const { id, password } = await request.json();

    const masterPassword = process.env.ADMIN_PASSWORD || "prodash123";
    
    if (password !== masterPassword) {
      return NextResponse.json({ error: "Senha de Administrador Incorreta!" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido." }, { status: 400 });
    }

    const { error: dbError } = await supabase
      .from("ranking")
      .delete()
      .eq("id", id);

    if (dbError) {
      console.error("DB Error:", dbError);
      return NextResponse.json({ error: "Erro ao deletar registro." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Registro apagado com sucesso!" });

  } catch (err: unknown) {
    console.error("API Error:", err);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
