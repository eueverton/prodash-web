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
    const target = ((formData.get("target") as string | null) || "v46").toLowerCase();

    if (!isAdminRequest(request, password)) {
      return unauthorized();
    }

    if (!file || !version) {
      return NextResponse.json({ error: "Arquivo ou versão faltando." }, { status: 400 });
    }

    const targetId = target === "m150" ? 2 : 1;
    const targetName = target === "m150" ? "M150 (P4)" : "V46 (ESP32)";
    const fileName = target === "m150"
      ? `prodash_m150_v${version}_${Date.now()}.bin`
      : `prodash_v${version}_${Date.now()}.bin`;

    const supabase = getSupabaseAdmin();

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
      .upsert({
        id: targetId,
        version: parseFloat(version),
        file_url: publicUrl,
        release_notes: notes || `Atualização OTA ${targetName}`,
      });

    if (dbError) {
      console.error("DB Error:", dbError);
      return NextResponse.json({ error: "Erro ao atualizar a versão no banco: " + dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `V${version} para ${targetName} implantada com sucesso!` });
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
    const { data: files, error: filesError } = await supabase.storage.from("firmwares").list();
    if (filesError) {
      console.error("Storage list error:", filesError);
      return NextResponse.json({ error: filesError.message }, { status: 500 });
    }

    const { data: firmwareData } = await supabase
      .from("firmware_updates")
      .select("id, version, release_notes");

    return NextResponse.json({ 
      files: files || [],
      firmwares: firmwareData || []
    });
  } catch (err: unknown) {
    console.error("API GET Error:", err);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
