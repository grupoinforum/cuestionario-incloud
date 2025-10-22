// app/diagnostico/diagnostico-content.tsx
"use client";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
export const dynamic = "force-dynamic";

/* ========================= Tipos de preguntas ========================= */
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

/* ========================= PREGUNTAS (5) ========================= */
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

/* ========================= Países / Teléfono ========================= */
const COUNTRIES = [
  { value: "GT", label: "Guatemala" },
  { value: "SV", label: "El Salvador" },
  { value: "HN", label: "Honduras" },
  { value: "PA", label: "Panamá" },
  { value: "DO", label: "República Dominicana" },
  { value: "EC", label: "Ecuador" },
] as const;
type CountryValue = (typeof COUNTRIES)[number]["value"];

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

/* ========================= Email corporativo ========================= */
const FREE_EMAIL_DOMAINS = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
  "proton.me",
  "aol.com",
  "live.com",
  "msn.com",
];
function isCorporateEmail(email: string) {
  const domain = email.split("@").pop()?.toLowerCase().trim();
  return !!domain && !FREE_EMAIL_DOMAINS.includes(domain);
}

/* ========================= Evaluación (Reglas) ========================= */
function evaluate(finalAnswers: Answer[]) {
  const score1Count = finalAnswers.filter((a) => a.score === 1).length;
  const score2Count = finalAnswers.filter((a) => a.score === 2).length;
  const qualifies = score2Count >= 3 ? true : score1Count >= 3 ? false : false;
  const resultText = qualifies ? "Sí califica" : "No califica";
  return { score1Count, qualifies, resultText };
}

/* ========================= API helper ========================= */
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

/* ========================= Componente ========================= */
export default function DiagnosticoContent() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  // Para multi: cada selección se guarda como clave "qid:value"
  const [answers, setAnswers] = useState<Record<string, Answer | undefined>>({});
  const [form, setForm] = useState<{
    name: string;
    company: string;
    role: string;
    email: string;
    country: CountryValue;
    consent: boolean;
    phoneLocal: string;
  }>({
    name: "",
    company: "",
    role: "",
    email: "",
    country: "GT",
    consent: false,
    phoneLocal: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultUI, setResultUI] = useState<null | { title: string; message: string; ctaLabel: string; ctaHref: string }>(null);

  // ✅ SOLO cambia la URL visible a /gracias (sin navegar)
  useEffect(() => {
    if (!resultUI) return;
    if (typeof window !== "undefined" && window.location.pathname !== "/gracias") {
      window.history.replaceState(null, "", "/gracias");
    }
  }, [resultUI]);

  /* ===== UTM ===== */
  const utms = useMemo(() => {
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
    const x: Record<string, string> = {};
    keys.forEach((k) => {
      const v = searchParams.get(k);
      if (v) x[k] = v;
    });
    return x;
  }, [searchParams]);

  /* ===== Progreso ===== */
  const progressPct = useMemo(() => (step / 3) * 100, [step]);
  const barWidth = progressPct + "%";

  /* ===== Helpers selección multi ===== */
  const isMultiSelected = (qid: string, optValue: string) => !!answers[`${qid}:${optValue}`];
  const countMultiSelected = (qid: string) => Object.keys(answers).filter((k) => k.startsWith(`${qid}:`)).length;
  const selectedValuesForMulti = (qid: string) =>
    Object.entries(answers)
      .filter(([k]) => k.startsWith(`${qid}:`))
      .map(([, v]) => v?.value)
      .filter(Boolean) as string[];

  /* ===== Handlers de preguntas ===== */
  const handleSelect = (qid: string, optionValue: string) => {
    const q = QUESTIONS.find((qq) => qq.id === qid)!;
    const opt = q.options.find((o) => o.value === optionValue)!;
    if (q.type === "single") {
      setAnswers((prev) => ({ ...prev, [qid]: { id: qid, value: optionValue, score: opt.score } }));
    }
  };

  const handleToggleMulti = (qid: string, optionValue: string) => {
    const q = QUESTIONS.find((qq) => qq.id === qid)! as QuestionMulti | QuestionSingle;
    if (q.type !== "multi") return;
    const opt = q.options.find((o) => o.value === optionValue)!;
    const key = `${qid}:${optionValue}`;
    setAnswers((prev) => {
      const already = !!prev[key];
      const current = countMultiSelected(qid);
      const limit = typeof (q as QuestionMulti).maxSelections === "number" ? (q as QuestionMulti).maxSelections : 0;
      if (!already && limit > 0 && current >= limit) return prev;
      const next = { ...prev };
      if (already) delete next[key];
      else next[key] = { id: key, value: optionValue, score: opt.score };
      return next;
    });
  };

  const handleExtraText = (qid: string, text: string) => {
    const q = QUESTIONS.find((qq) => qq.id === qid);
    if (!q) return;
    if (q.type === "single") {
      const existing = answers[qid];
      if (!existing) return;
      setAnswers((prev) => ({ ...prev, [qid]: { ...existing, extraText: text } }));
      return;
    }
    // multi: texto para opción "otro"
    const key = `${qid}:otro`;
    if (!answers[key]) return;
    setAnswers((prev) => ({ ...prev, [key]: { ...prev[key]!, extraText: text } }));
  };

  const shouldShowExtraInput = (qid: string) => {
    const q = QUESTIONS.find((qq) => qq.id === qid);
    if (!q) return false;
    if (q.type === "single") {
      const selected = answers[qid]?.value;
      const selectedOpt = q.options.find((o) => o.value === selected) as any;
      return !!selectedOpt?.requiresText;
    }
    const selected = selectedValuesForMulti(qid);
    return q.options.some((o) => selected.includes(o.value) && (o as any).requiresText);
  };

  const canContinueQuestions = useMemo(() => {
    return QUESTIONS.every((q) => {
      if (!q.required) return true;
      if (q.type === "single") return !!answers[q.id];
      // multi: al menos 1 seleccionado
      return Object.keys(answers).some((k) => k.startsWith(`${q.id}:`));
    });
  }, [answers]);

  /* ===== Teléfono ===== */
  const selectedPrefix = useMemo(() => COUNTRY_PREFIX[form.country] ?? DEFAULT_PREFIX, [form.country]);

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

  const phoneRequirementText = (() => {
    const rule = COUNTRY_PHONE_RULES[form.country];
    if (!rule) return "Ingresa al menos 8 dígitos del número local.";
    const minTxt = `${rule.min} dígitos`;
    const maxTxt = rule.max ? ` (máx. ${rule.max})` : "";
    const note = rule.note ? ` · ${rule.note}` : "";
    return `Ingresa ${minTxt}${maxTxt} del número local${note}.`;
  })();

  const canContinueData = useMemo(
    () =>
      form.name.trim().length > 1 &&
      form.company.trim().length > 1 &&
      form.role.trim().length > 1 &&
      /.+@.+\..+/.test(form.email) &&
      isCorporateEmail(form.email) &&
      isPhoneValid(form.phoneLocal, form.country),
    [form]
  );

  /* ========================= Submit ========================= */
  const onSubmit = async () => {
    setErrorMsg(null);
    if (!form.consent) {
      setErrorMsg("Debes aceptar el consentimiento para continuar.");
      return;
    }
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

      // UI desde backend
      const ui = json?.ui as | { title: string; body: string; ctaLabel: string; ctaHref: string } | undefined;
      if (ui) {
        setResultUI({ title: ui.title, message: ui.body, ctaLabel: ui.ctaLabel, ctaHref: ui.ctaHref });
      } else {
        // Fallback
        setResultUI({
          title: "¡Gracias por completar el cuestionario!",
          message: qualifies
            ? "Tu empresa es candidata para un cambio hacia servidores en la nube. Un asesor te contactará."
            : "Según tus respuestas, esta solución no es la adecuada. Visita nuestro sitio para ver otros servicios.",
          ctaLabel: "Visitar nuestro website",
          ctaHref: "https://www.grupoinforum.com",
        });
      }
    } catch (e: any) {
      setErrorMsg(e?.message || "No se logró enviar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  /* ========================= RENDER RESULTADO ========================= */
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

  /* ========================= FORMULARIO (3 PASOS) ========================= */
  return (
    <main className="max-w-3xl mx-auto p-6">
      {/* Progreso */}
      <div className="w-full h-2 bg-gray-200 rounded mb-6">
        <div className="h-2 bg-blue-500 rounded transition-all" style={{ width: barWidth }} />
      </div>

      <h1 className="text-2xl font-semibold mb-4">Diagnóstico de Infraestructura de Servidores</h1>
      <p className="text-gray-600 mb-4">Completa el cuestionario y conoce tu resultado al instante.</p>
      {errorMsg && <p className="text-sm text-red-600 mb-4">{errorMsg}</p>}

      {/* Paso 1 */}
      {step === 1 && (
        <section className="space-y-6">
          {QUESTIONS.map((q) => (
            <div key={q.id} className="p-4 rounded-2xl border border-gray-200">
              <label className="font-medium block mb-3">{q.label}</label>

              <div className="space-y-2">
                {q.type === "single"
                  ? q.options.map((o) => (
                      <div key={o.value} className="flex items-center gap-3">
                        <input
                          type="radio"
                          id={`${q.id}_${o.value}`}
                          name={q.id}
                          className="cursor-pointer"
                          onChange={() => handleSelect(q.id, o.value)}
                          checked={answers[q.id]?.value === o.value}
                        />
                        <label htmlFor={`${q.id}_${o.value}`} className="cursor-pointer">
                          {o.label}
                        </label>
                      </div>
                    ))
                  : q.options.map((o) => {
                      const selected = isMultiSelected(q.id, o.value);
                      const limit = (q as QuestionMulti).maxSelections ?? 0;
                      const reachedLimit = !selected && limit > 0 && countMultiSelected(q.id) >= limit;
                      return (
                        <div key={o.value} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={`${q.id}_${o.value}`}
                            className="cursor-pointer"
                            onChange={() => handleToggleMulti(q.id, o.value)}
                            checked={selected}
                            disabled={reachedLimit}
                          />
                          <label
                            htmlFor={`${q.id}_${o.value}`}
                            className={`cursor-pointer ${reachedLimit ? "opacity-60" : ""}`}
                            title={reachedLimit ? `Máximo ${limit} opciones` : ""}
                          >
                            {o.label}
                          </label>
                        </div>
                      );
                    })}
              </div>

              {/* Campo libre si alguna opción requiere texto */}
              {shouldShowExtraInput(q.id) && (
                <input
                  type="text"
                  placeholder="Especifica aquí"
                  className="mt-3 w-full border rounded-xl px-3 py-2"
                  onChange={(e) => handleExtraText(q.id, e.target.value)}
                />
              )}
            </div>
          ))}

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!canContinueQuestions}
              className="px-5 py-3 rounded-2xl shadow bg-blue-600 text-white disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </section>
      )}

      {/* Paso 2 */}
      {step === 2 && (
        <section className="space-y-4">
          <div>
            <label className="block mb-1">Nombre</label>
            <input
              className="w-full border rounded-xl px-3 py-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block mb-1">Empresa</label>
            <input
              className="w-full border rounded-xl px-3 py-2"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
          </div>
          <div>
            <label className="block mb-1">Cargo en la empresa</label>
            <input
              className="w-full border rounded-xl px-3 py-2"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="Ej.: Gerente de TI"
            />
          </div>
          <div>
            <label className="block mb-1">Correo empresarial</label>
            <input
              className="w-full border rounded-xl px-3 py-2"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {form.email && !isCorporateEmail(form.email) && (
              <p className="text-sm text-red-600 mt-1">
                Usa un correo corporativo (no Gmail/Hotmail/Outlook/Yahoo, etc.).
              </p>
            )}
          </div>
          <div>
            <label className="block mb-1">País</label>
            <select
              className="w-full border rounded-xl px-3 py-2"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value as CountryValue })}
            >
              {COUNTRIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1">Teléfono</label>
            <div className="flex">
              <span className="inline-flex items-center rounded-l border border-r-0 bg-gray-50 px-3 text-sm">
                {selectedPrefix}
              </span>
              <input
                className="w-full rounded-r border px-3 py-2"
                value={form.phoneLocal}
                onChange={(e) => setForm({ ...form, phoneLocal: e.target.value.replace(/[^\d]/g, "") })}
                placeholder="Ingresa tu número (solo dígitos)"
                inputMode="numeric"
                pattern="\d*"
              />
            </div>
            {!isPhoneValid(form.phoneLocal, form.country) && form.phoneLocal.length > 0 ? (
              <p className="text-xs text-red-600 mt-1">{phoneRequirementText}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Se enviará como: <strong>{phoneFull || selectedPrefix}</strong>
              </p>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 pt-2">
            <button onClick={() => setStep(1)} className="px-5 py-3 rounded-2xl border">
              Atrás
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={
                !(
                  form.name.trim().length > 1 &&
                  form.company.trim().length > 1 &&
                  form.role.trim().length > 1 &&
                  /.+@.+\..+/.test(form.email) &&
                  isCorporateEmail(form.email) &&
                  isPhoneValid(form.phoneLocal, form.country)
                )
              }
              className="px-5 py-3 rounded-2xl shadow bg-blue-600 text-white disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </section>
      )}

      {/* Paso 3 */}
      {step === 3 && (
        <section className="space-y-4">
          <div className="p-4 rounded-2xl border border-gray-200">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => setForm({ ...form, consent: e.target.checked })}
              />
              <span>
                Autorizo a Grupo Inforum a contactarme respecto a esta evaluación y servicios relacionados. He leído la{" "}
                {process.env.NEXT_PUBLIC_PRIVACY_URL ? (
                  <a
                    href={process.env.NEXT_PUBLIC_PRIVACY_URL}
                    className="text-blue-600 underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Política de Privacidad
                  </a>
                ) : (
                  <span className="font-medium">Política de Privacidad</span>
                )}
                .
              </span>
            </label>
          </div>
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => setStep(2)} className="px-5 py-3 rounded-2xl border">
              Atrás
            </button>
            <button
              onClick={onSubmit}
              disabled={loading || !form.consent}
              className="px-5 py-3 rounded-2xl shadow bg-blue-600 text-white disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Haz clic para conocer tu resultado"}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
