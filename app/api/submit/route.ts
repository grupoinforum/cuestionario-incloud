// app/api/submit/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

/* ========= Tipos ========= */
type Answer = { id: string; value: string; score: 1 | 2; extraText?: string };
type Payload = {
  name: string;
  company?: string;
  role?: string;           // <-- NUEVO: Cargo en la empresa
  email: string;
  country?: string;
  phone?: string;
  answers?: { utms?: Record<string, string>; items?: Answer[] } | any;
  score1Count?: number;
  qualifies?: boolean;
  resultText?: string;
};

/* ========= Env ========= */
const PD_DOMAIN = process.env.PIPEDRIVE_DOMAIN!;
const PD_API = process.env.PIPEDRIVE_API_KEY!;
const PD_PERSON_ROLE_FIELD = process.env.PD_PERSON_ROLE_FIELD; // <-- opcional, key del campo custom

const BREVO_USER = process.env.BREVO_SMTP_USER;
const BREVO_PASS = process.env.BREVO_SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || "Inforum <info@inforumsol.com>";

/* ========= Pipedrive: pipelines por país ========= */
const PIPELINES = {
  GT: Number(process.env.PD_PIPELINE_GT ?? 1),
  SV: Number(process.env.PD_PIPELINE_SV ?? 2),
  HN: Number(process.env.PD_PIPELINE_HN ?? 3),
  DO: Number(process.env.PD_PIPELINE_DO ?? 4),
  EC: Number(process.env.PD_PIPELINE_EC ?? 5),
  PA: Number(process.env.PD_PIPELINE_PA ?? 6),
} as const;

/* ========= Pipedrive: Etapa “Capa 1” por país ========= */
const STAGE_CAPA1 = {
  GT: Number(process.env.PD_STAGE_GT_CAPA1 ?? 6),
  SV: Number(process.env.PD_STAGE_SV_CAPA1 ?? 7),
  HN: Number(process.env.PD_STAGE_HN_CAPA1 ?? 13),
  DO: Number(process.env.PD_STAGE_DO_CAPA1 ?? 19),
  EC: Number(process.env.PD_STAGE_EC_CAPA1 ?? 25),
  PA: Number(process.env.PD_STAGE_PA_CAPA1 ?? 31),
} as const;

/* ========= Helpers ========= */
function countryToCode(label?: string): keyof typeof PIPELINES {
  if (!label) return "GT";
  const x = label.trim().toUpperCase();
  if (["GT", "SV", "HN", "DO", "EC", "PA"].includes(x)) return x as any;

  const MAP: Record<string, keyof typeof PIPELINES> = {
    "GUATEMALA": "GT",
    "EL SALVADOR": "SV",
    "HONDURAS": "HN",
    "PANAMÁ": "PA",
    "PANAMA": "PA",
    "REPÚBLICA DOMINICANA": "DO",
    "REPUBLICA DOMINICANA": "DO",
    "ECUADOR": "EC",
  };
  return MAP[x] ?? "GT";
}

async function pd(path: string, init?: RequestInit) {
  const url = `https://${PD_DOMAIN}.pipedrive.com/api/v1${path}${path.includes("?") ? "&" : "?"}api_token=${PD_API}`;
  const res = await fetch(url, init);
  const text = await res.text();
  if (!res.ok) throw new Error(`Pipedrive ${path} → ${res.status} ${text}`);
  try { return JSON.parse(text); } catch { return text as any; }
}

function absoluteOriginFromReq(req: Request) {
  const proto = (req.headers.get("x-forwarded-proto") || "https").split(",")[0].trim();
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(",")[0].trim();
  if (!host) return "https://inforum-diagnostico.vercel.app";
  return `${proto}://${host}`;
}

/* ========= Email (Brevo + Nodemailer) ========= */
const VIDEO_ID = "Eau96xNp3Ds";
const VIDEO_URL = `https://youtu.be/${VIDEO_ID}`;

function buildEmailBodies(data: Payload, origin: string) {
  const qualifies = !!data.qualifies;

  const subject = qualifies
    ? "Tu diagnóstico califica – Grupo Inforum"
    : "Gracias por tu diagnóstico – Grupo Inforum";

  const lead = qualifies
    ? "¡Felicidades! Estás a 1 paso de obtener tu asesoría sin costo. Rita Muralles se estará comunicando contigo para agendar una sesión corta de 30min para presentarnos y realizar unas últimas dudas para guiarte de mejor manera."
    : "¡Gracias por llenar el cuestionario! Por el momento nuestro equipo se encuentra con cupo lleno. Te estaremos contactando al liberar espacio. Por lo pronto te invitamos a conocer más de Inforum.";

  const SITE_URL = "https://www.grupoinforum.com";
  const THUMB_URL = `${origin}/video.png`;

  const text = `${lead}

Mira el video: ${VIDEO_URL}

Visita nuestro website: ${SITE_URL}`.trim();

  const html = `
<div style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;line-height:1.55;color:#111">
  <p style="margin:0 0 14px">${lead}</p>

  <a href="${VIDEO_URL}" target="_blank" rel="noopener" style="text-decoration:none;border:0;display:inline-block;margin:6px 0 18px">
    <img src="${THUMB_URL}" width="560" style="max-width:100%;height:auto;border:0;display:block;border-radius:12px" alt="Ver video en YouTube" />
  </a>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0">
    <tr>
      <td bgcolor="#1D4ED8" style="border-radius:10px">
        <a href="${SITE_URL}" target="_blank" rel="noopener"
           style="font-size:16px;line-height:16px;font-weight:600;color:#ffffff;text-decoration:none;padding:12px 18px;display:inline-block">
          Visita nuestro website
        </a>
      </td>
    </tr>
  </table>
</div>
`.trim();

  return { subject, text, html };
}

async function sendEmailConfirmation(data: Payload, req: Request) {
  if (!BREVO_USER || !BREVO_PASS) {
    console.warn("Brevo SMTP no configurado. No se envía correo.");
    return;
  }
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    auth: { user: BREVO_USER, pass: BREVO_PASS },
  });

  const { subject, text, html } = buildEmailBodies(data, absoluteOriginFromReq(req));

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: data.email,
    subject,
    text,
    html,
  });
  console.log(`✅ Email enviado a ${data.email}`);
}

/* ========= Persona en Pipedrive (crear/actualizar con phone + role) ========= */
async function upsertPersonWithPhoneAndRole(data: Payload) {
  const email = data.email;
  const phone = data.phone?.trim();
  const role = (data.role || "").trim();

  // 1) Buscar por email
  let personId: number | null = null;
  try {
    const search = await pd(`/persons/search?term=${encodeURIComponent(email)}&fields=email&exact_match=true`);
    const item = (search as any)?.data?.items?.[0];
    if (item?.item?.id) personId = item.item.id;
  } catch (e) {
    console.error("[persons/search]", (e as Error).message);
  }

  // Helper: construir cuerpo con campos opcionales
  const buildBody = () => {
    const body: any = { name: data.name };
    if (phone) body.phone = [{ value: phone, primary: true, label: "work" }];
    // Guardar cargo en campo custom si está configurado
    if (PD_PERSON_ROLE_FIELD && role) body[PD_PERSON_ROLE_FIELD] = role;
    return body;
  };

  // 2) Si existe → actualizar
  if (personId) {
    try {
      await pd(`/persons/${personId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody()),
      });
    } catch (e) {
      console.error("[persons PUT]", (e as Error).message);
    }
    return personId;
  }

  // 3) Si no existe → crear
  try {
    const createBody: any = {
      name: data.name,
      email: [{ value: email, primary: true, label: "work" }],
    };
    if (phone) createBody.phone = [{ value: phone, primary: true, label: "work" }];
    if (PD_PERSON_ROLE_FIELD && role) createBody[PD_PERSON_ROLE_FIELD] = role;

    const created = await pd(`/persons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createBody),
    });
    return (created as any)?.data?.id as number | null;
  } catch (e) {
    console.error("[persons POST]", (e as Error).message);
    return null;
  }
}

/* ========= Util: resumen breve de respuestas ========= */
function briefAnswersSummary(answers?: Payload["answers"]) {
  try {
    const items: Answer[] | undefined = answers?.items;
    if (!Array.isArray(items) || !items.length) return "";
    const mapLabel: Record<string, string> = {
      industria: "Industria",
      erp: "ERP",
      busca: "Búsqueda",
      personas: "Personas",
      satisfaccion: "Satisfacción",
    };
    const lines = items.map((a) => {
      const k = mapLabel[a.id] || a.id;
      const extra = a.extraText ? ` (${a.extraText})` : "";
      return `- ${k}: ${a.value}${extra} [score=${a.score}]`;
    });
    return lines.join("\n");
  } catch {
    return "";
  }
}

/* ========= API ========= */
export async function POST(req: Request) {
  try {
    const data = (await req.json()) as Payload;
    if (!data?.name || !data?.email) {
      return NextResponse.json({ ok: false, error: "Faltan nombre o email" }, { status: 400 });
    }

    const cc = countryToCode(data.country);
    const pipeline_id = PIPELINES[cc];
    const stage_id = STAGE_CAPA1[cc];

    // 1) Persona (buscar o crear) con phone + role
    const personId = await upsertPersonWithPhoneAndRole(data);

    // 2) Organización (opcional)
    let orgId: number | undefined;
    if (data.company) {
      try {
        const s = await pd(`/organizations/search?term=${encodeURIComponent(data.company)}&exact_match=true`);
        const it = (s as any)?.data?.items?.[0];
        orgId = it?.item?.id;
      } catch {}
      if (!orgId) {
        try {
          const o = await pd(`/organizations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: data.company }),
          });
          orgId = (o as any)?.data?.id;
        } catch (e) {
          console.error("[organizations POST]", (e as Error).message);
        }
      }
    }

    // 3) Deal
    console.log(`[Deals] Creando deal → cc=${cc} pipeline=${pipeline_id} stage=${stage_id}`);
    const deal = await pd(`/deals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Diagnóstico – ${data.name}`,
        person_id: personId!,
        org_id: orgId,
        pipeline_id,
        stage_id,
        value: 0,
        currency: "GTQ",
      }),
    });
    const dealId = (deal as any)?.data?.id;
    console.log(`🟢 Deal #${dealId} creado en pipeline ${pipeline_id}, stage ${stage_id}`);

    // 4) Nota con contexto (incluye teléfono, cargo y evaluación)
    try {
      let score2Count: number | undefined;
      try {
        if (Array.isArray(data.answers?.items)) {
          score2Count = (data.answers.items as Answer[]).filter((a) => a.score === 2).length;
        }
      } catch {}

      const answersBrief = briefAnswersSummary(data.answers);

      const content =
        `Formulario diagnóstico\n` +
        `• Nombre: ${data.name}\n` +
        (data.company ? `• Empresa: ${data.company}\n` : "") +
        (data.role ? `• Cargo: ${data.role}\n` : "") +            // <-- agregado
        `• Email: ${data.email}\n` +
        (data.country ? `• País: ${data.country}\n` : "") +
        (data.phone ? `• Teléfono: ${data.phone}\n` : "") +
        (typeof data.qualifies !== "undefined"
          ? `• Resultado: ${data.qualifies ? "✅ Sí califica" : "❌ No califica"}\n`
          : "") +
        (typeof data.resultText !== "undefined"
          ? `• Evaluación: ${data.resultText}\n`
          : "") +
        (typeof data.score1Count !== "undefined"
          ? `• # de respuestas score=1: ${data.score1Count}\n`
          : "") +
        (typeof score2Count !== "undefined"
          ? `• # de respuestas score=2: ${score2Count}\n`
          : "") +
        (answersBrief ? `\nResumen:\n${answersBrief}\n` : "") +
        (data.answers ? `\nRespuestas (JSON):\n${JSON.stringify(data.answers, null, 2)}` : "");

      await pd(`/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, deal_id: dealId, person_id: personId!, org_id: orgId }),
      });
    } catch (e) {
      console.error("[notes POST]", (e as Error).message);
    }

    // 5) Email (no bloqueante)
    try { await sendEmailConfirmation(data, req); } catch (e) { console.error("[email]", (e as Error).message); }

    return NextResponse.json({ ok: true, message: "Deal creado, persona actualizada, nota agregada y correo enviado" });
  } catch (e: any) {
    console.error("[/api/submit] Error:", e?.message || e);
    return NextResponse.json({ ok: false, error: e?.message || "No se logró enviar" }, { status: 500 });
  }
}
