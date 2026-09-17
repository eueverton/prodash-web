import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { adminMisconfigured, isAdminConfigured, isAdminRequest, unauthorized } from "@/lib/adminAuth";

export async function POST(request: Request) {
  try {
    if (!isAdminConfigured()) return adminMisconfigured();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const version = formData.get("version") as string | null;
    const notes = (formData.get("notes") as string | null) || "";
    const password = formData.get("password") as string | null;

    if (!isAdminRequest(request, password)) {
      return unauthorized();
    }

    if (!file || !version) {
      return NextResponse.json({ error: "Arquivo ou versão faltando." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const fileName = `prodash_v${version}_${Date.now()}.bin`;

    const { error: uploadError } = await supabase.storage.from("firmwares").upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (uploadError) {
      console.error("Storage Error:", uploadError);
      return NextResponse.json({ error: "Erro ao subir o arquivo: " + uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from("firmwares").getPublicUrl(fileName);
    const publicUrl = publicUrlData.publicUrl;

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

export async function GET(request: Request) {
  try {
    if (!isAdminConfigured()) return adminMisconfigured();
    if (!isAdminRequest(request)) return unauthorized();

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage.from("firmwares").list();
    if (error) {
      console.error("Storage list error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ files: data || [] });
  } catch (err: unknown) {
    console.error("API GET Error:", err);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
