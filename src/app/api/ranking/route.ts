import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { adminMisconfigured, isAdminConfigured, isAdminRequest, unauthorized } from "@/lib/adminAuth";

export async function DELETE(request: Request) {
  try {
    if (!isAdminConfigured()) return adminMisconfigured();

    const { id, password } = await request.json();

    if (!isAdminRequest(request, password)) {
      return unauthorized();
    }

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error: dbError } = await supabase.from("ranking").delete().eq("id", id);

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
