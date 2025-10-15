// app/diagnostico/diagnostico-content.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

/* =========================
   Tipos de preguntas
   ========================= */
type Choice = { value: string; label: string; score: 1 | 2; requiresText?: boolean };
type QuestionSingle = {
  id: string;
  label: string;
  type: "single";
  required?: boolean;
  options: Choice[];
};
type QuestionMulti = {
  id: string;
  label: string;
  type: "multi";
  required?: boolean;
  maxSelections: number;
  options: Choice[];
};
type Question = QuestionSingle | QuestionMulti;

type Answer = { id: string; value: string; score: 1 | 2; extraText?: string };

/* =========================
   PREGUNTAS
   ========================= */
const QUESTIONS: readonly Question[] = [
  {
    id: "usa_sapb1",
    label: "¿Actualmente su empresa utiliza SAP Business One?",
    type: "single",
    required: true,
    options: [
      { value: "onprem", label: "Sí, en servidores locales", score: 2 },
      { value: "cloud", label: "Sí, pero alojado en la nube", score: 1 },
      { value: "plan_implementar", label: "No, pero planeamos implementarlo pronto", score: 2 },
      { value: "otro_erp", label: "No, usamos otro ERP (especificar cuál)", score: 1, requiresText: true },
      { value: "sin_erp", label: "No usamos ERP", score: 1 },
    ],
  },
  {
    id: "admin_servidores",
    label: "¿Quién administra actualmente sus servidores?",
    type: "single",
    required: true,
    options: [
      { value: "ti_interno", label: "Internamente con equipo de TI propio", score: 2 },
      { value: "proveedor_externo", label: "Proveedor externo", score: 1 },
      { value: "partner_sapb1", label: "Partner SAP Business One", score: 1 },
    ],
  },
  {
    id: "problemas_infra",
    label: "¿Qué problemas han experimentado con su infraestructura actual? (Puedes seleccionar hasta 2 opciones)",
    type: "multi",
    required: true,
    maxSelections: 2,
    options: [
      { value: "lentitud_caidas", label: "Lentitud o caídas del sistema", score: 2 },
      { value: "capacidad_rendimiento", label: "Falta de capacidad o rendimiento", score: 2 },
      { value: "riesgo_datos_respaldo", label: "Riesgo de pérdida de datos o falta de respaldo", score: 2 },
      { value: "costos_altos", label: "Costos altos de mantenimiento o licencias", score: 2 },
      { value: "ninguno", label: "Ninguno por ahora", score: 1 },
      { value: "otro", label: "Otro (especificar)", score: 2, requiresText: true },
    ],
  },
  {
    id: "donde_erp",
    label: "¿Dónde se encuentra actualmente alojado su ERP?",
    type: "single",
    required: true,
    options: [
      { value: "onprem_fisico", label: "En un servidor físico dentro de la empresa", score: 2 },
      { value: "dc_local", label: "En un servidor virtual o data center local", score: 2 },
      { value: "nube", label: "En servidores nube", score: 1 },
    ],
  },
  {
    id: "objetivo_iaas",
    label: "¿Qué busca su empresa lograr con una posible migración a IaaS para su ERP?",
    type: "single",
    required: true,
    options: [
      { value: "estabilidad_rendimiento", label: "Mayor estabilidad y rendimiento del sistema", score: 2 },
      { value: "seguridad_respaldo", label: "Seguridad y respaldo continuo de la información", score: 2 },
      { value: "optimizar_costos", label: "Optimización de costos de infraestructura", score: 2 },
      { value: "delegar_admin", label: "Delegar la administración técnica a expertos", score: 2 },
      { value: "solo_ver_opciones", label: "Solo quiero ver diferentes opciones", score: 1 },
    ],
  },
] as const;

/* =========================
   Países / Teléfono
   ========================= */
const COUNTRIES = [
  { value: "GT", label: "Guatemala" },
  { value: "SV", label: "El Salvador" },
  { value: "HN", label: "Honduras" },
  { value: "PA", label: "Panamá" },
  { value: "DO", label: "República Dominicana" },
  { value: "EC", label: "Ecuador" },
] as const;
type CountryValue = typeof COUNTRIES[number]["value"];

const COUNTRY_PREFIX: Record<CountryValue, string> = {
  GT: "+502",
  SV: "+503",
  HN: "+504",
  PA: "+507",
  DO: "+1",
  EC: "+593",
};
const COUNTRY_PHONE_RULES: Record<CountryValue, { min: number; max?: number; note?: string }> = {
  GT: { min: 8 },
  SV: { min: 8 },
  HN: { min: 8 },
  PA: { min: 8 },
  DO: { min: 10 },
  EC: { min: 9, note: "Usa tu número móvil (9 dígitos)" },
};
const DEFAULT_PREFIX = "+502";

/* =========================
   Email corporativo
   ========================= */
const FREE_EMAIL_DOMAINS = [
  "gmail.com", "hotmail.com", "outlook.com", "yahoo.com",
  "icloud.com", "proton.me", "aol.com", "live.com", "msn.com",
];
function isCorporateEmail(email: string) {
  const domain = email.split("@").pop()?.toLowerCase().trim();
  return !!domain && !FREE_EMAIL_DOMAINS.includes(domain);
}

/* =========================
   Evaluación (Reglas)
   ========================= */
function evaluate(finalAnswers: Answer[]) {
  const score1Count = finalAnswers.filter((a) => a.score === 1).length;
  const score2Count = finalAnswers.filter((a) => a.score === 2).length;
  const qualifies = score2Count >= 3 ? true : score1Count >= 3 ? false : false;
  const resultText = qualifies ? "Sí califica" : "No califica";
  return { score1Count, qualifies, resultText };
}

/* =========================
   API helper
   ========================= */
async function submitDiagnostico(payload: any) {
  const res = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.ok === false) throw new Error(json?.error || `Error ${res.status}`);
  return json;
}

/* =========================
   Componente
   ========================= */
export default function DiagnosticoContent() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, Answer | undefined>>({});
  const [form, setForm] = useState({
    name: "",
    company: "",
    role: "",
    email: "",
    country: "GT" as CountryValue,
    consent: false,
    phoneLocal: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultUI, setResultUI] = useState<null | {
    title: string;
    message: string;
    ctaLabel: string;
    ctaHref: string;
  }>(null);

  // ✅ Muestra /gracias en la barra sin recargar
  useEffect(() => {
    if (!resultUI) return;
    if (typeof window !== "undefined" && window.location.pathname !== "/gracias") {
      window.history.replaceState(null, "", "/gracias");
    }
  }, [resultUI]);

  const utms = useMemo(() => {
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
    const x: Record<string, string> = {};
    keys.forEach((k) => { const v = searchParams.get(k); if (v) x[k] = v; });
    return x;
  }, [searchParams]);

  const progressPct = useMemo(() => (step / 3) * 100, [step]);
  const barWidth = progressPct + "%";

  const selectedPrefix = useMemo(
    () => COUNTRY_PREFIX[form.country] ?? DEFAULT_PREFIX,
    [form.country]
  );
  const phoneFull = useMemo(() => {
    const local = (form.phoneLocal || "").replace(/[^\d]/g, "");
    return `${selectedPrefix}${local ? " " + local : ""}`;
  }, [form.phoneLocal, selectedPrefix]);

  const isPhoneValid = (local: string, country: CountryValue) => {
    const digits = (local || "").replace(/[^\d]/g, "");
    const rule = COUNTRY_PHONE_RULES[country];
    const meetsMin = digits.length >= (rule?.min ?? 8);
    const meetsMax = rule?.max ? digits.length <= rule.max : true;
    return meetsMin && meetsMax;
  };

  const onSubmit = async () => {
    setErrorMsg(null);
    if (!form.consent) { setErrorMsg("Debes aceptar el consentimiento para continuar."); return; }
    setLoading(true);
    try {
      const finalAnswers = Object.values(answers).filter(Boolean) as Answer[];
      const { score1Count, qualifies, resultText } = evaluate(finalAnswers);
      const countryLabel = COUNTRIES.find((c) => c.value === form.country)?.label || form.country;

      const json = await submitDiagnostico({
        name: form.name,
        company: form.company,
        role: form.role,
        email: form.email,
        country: countryLabel,
        phone: phoneFull,
        answers: { utms, items: finalAnswers },
        score1Count,
        qualifies,
        resultText,
      });

      const ui = json?.ui as
        | { title: string; body: string; ctaLabel: string; ctaHref: string }
        | undefined;

      setResultUI(
        ui
          ? {
              title: ui.title,
              message: ui.body,
              ctaLabel: ui.ctaLabel,
              ctaHref: ui.ctaHref,
            }
          : {
              title: "¡Gracias por completar el cuestionario!",
              message: qualifies
                ? "Tu empresa es candidata para un cambio hacia servidores en la nube. Un asesor te contactará."
                : "Según tus respuestas, esta solución no es la adecuada. Visita nuestro sitio para ver otros servicios.",
              ctaLabel: "Visitar nuestro website",
              ctaHref: "https://www.grupoinforum.com",
            }
      );
    } catch (e: any) {
      setErrorMsg(e?.message || "No se logró enviar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  /* ===== Resultado ===== */
  if (resultUI) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <div className="w-full h-2 bg-gray-200 rounded mb-6">
          <div className="h-2 bg-blue-500 rounded" style={{ width: "100%" }} />
        </div>
        <h1 className="text-2xl font-semibold mb-3">{resultUI.title}</h1>
        <p className="whitespace-pre-line text-gray-800 leading-relaxed mb-4">{resultUI.message}</p>
        <div className="mt-1">
          <a
            href={resultUI.ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-5 py-3 rounded-2xl bg-[#082a49] text-white text-center"
          >
            {resultUI.ctaLabel}
          </a>
        </div>
      </main>
    );
  }

  /* ===== Formularios ===== */
  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="w-full h-2 bg-gray-200 rounded mb-6">
        <div className="h-2 bg-blue-500 rounded transition-all" style={{ width: barWidth }} />
      </div>
      <h1 className="text-2xl font-semibold mb-4">Diagnóstico de Infraestructura de Servidores</h1>
      <p className="text-gray-600 mb-4">Completa el cuestionario y conoce tu resultado al instante.</p>
      {errorMsg && <p className="text-sm text-red-600 mb-4">{errorMsg}</p>}
      {/* ... resto del formulario sin cambios ... */}
    </main>
  );
}
