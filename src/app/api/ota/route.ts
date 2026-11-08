import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { adminMisconfigured, isAdminConfigured, isAdminRequest, unauthorized } from "@/lib/adminAuth";

export async function POST(request: Request) {
  try {
    if (!isAdminConfigured()) return adminMisconfigured();

    const contentType = request.headers.get("content-type") || "";

    // MODO 1: UPLOAD DIRETO ASSINADO (SUPABASE DIRECT UPLOAD) - BYPASS LIMITE 4.5MB DA VERCEL
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const { action } = body;

      if (!isAdminRequest(request, body.password)) {
        return unauthorized();
      }

      const supabase = getSupabaseAdmin();

      if (action === "prepare") {
        const { target, version } = body;
        if (!target || !version) {
          return NextResponse.json({ error: "Alvo e versão são obrigatórios." }, { status: 400 });
        }
        const isApk = target === "apk" || target === "app";
        const ext = isApk ? "apk" : "bin";
        const prefix = isApk ? "prodash_app" : target === "m150" ? "prodash_m150" : "prodash";
        const fileName = `${prefix}_v${version}_${Date.now()}.${ext}`;

        const { data, error } = await supabase.storage.from("firmwares").createSignedUploadUrl(fileName);
        if (error || !data) {
          return NextResponse.json({ error: error?.message || "Erro ao criar URL assinada." }, { status: 500 });
        }

        const { data: publicUrlData } = supabase.storage.from("firmwares").getPublicUrl(fileName);

        return NextResponse.json({
          token: data.token,
          path: data.path,
          signedUrl: data.signedUrl,
          publicUrl: publicUrlData.publicUrl,
          fileName,
        });
      }

      if (action === "complete") {
        const { target, version, notes, publicUrl } = body;
        if (!target || !version || !publicUrl) {
          return NextResponse.json({ error: "Dados incompletos para finalização." }, { status: 400 });
        }

        let targetId = 1;
        let targetName = "V46 (ESP32)";
        if (target === "m150") {
          targetId = 2;
          targetName = "M150 (P4)";
        } else if (target === "apk" || target === "app") {
          targetId = 3;
          targetName = "App Android (APK)";
        }

        const { error: dbError } = await supabase.from("firmware_updates").upsert({
          id: targetId,
          version: parseFloat(version),
          file_url: publicUrl,
          release_notes: notes || `Atualização ${targetName}`,
        });

        if (dbError) {
          return NextResponse.json({ error: "Erro no banco: " + dbError.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: `Atualização v${version} para ${targetName} salva com sucesso!`,
        });
      }

      return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
    }

    // MODO 2: FORM DATA CLÁSSICO (FALLBACK)
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

    let targetId = 1;
    let targetName = "V46 (ESP32)";
    let fileName = `prodash_v${version}_${Date.now()}.bin`;

    if (target === "m150") {
      targetId = 2;
      targetName = "M150 (P4)";
      fileName = `prodash_m150_v${version}_${Date.now()}.bin`;
    } else if (target === "apk" || target === "app") {
      targetId = 3;
      targetName = "App Android (APK)";
      fileName = `prodash_app_v${version}_${Date.now()}.apk`;
    }

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
