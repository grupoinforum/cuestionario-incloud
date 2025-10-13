
# Inforum Diagnóstico (Next.js + App Router + Tailwind)

Cuestionario de 3 pasos con envío a API propia que:
- Valida correo corporativo
- Calcula resultado (`califica` o `nocupo`)
- Crea Organization, Person y Deal en **Pipedrive**
- Agrega nota con UTMs y respuestas
- Envía **email transaccional** con **Brevo (Sendinblue)**

## Requisitos

- Node 18+
- Cuenta en Vercel (para deploy)
- Tokens/credenciales para Pipedrive y Brevo

## Instalar y correr local

```bash
npm install
npm run dev
# abrir http://localhost:3000/diagnostico
```

## Variables de entorno (configurarlas en Vercel)

> **No subas** tu `.env.local` al repo (ya está en `.gitignore`).

- **PIPEDRIVE_API_TOKEN**: token API
- **PD_CF_INDUSTRIA**: key del custom field (Deal u Org) para Industria (opcional)
- **PD_CF_SISTEMA**: key del custom field (Deal u Org) para Sistema Empresarial (opcional)
- **BREVO_API_KEY**: API Key de Brevo
- **EMAIL_FROM**: remitente (ej. `info@inforumsol.com`)
- **EMAIL_BCC**: (opcional) BCC para copias
- **RECAPTCHA_SECRET**: (opcional) para v3
- **NEXT_PUBLIC_PRIVACY_URL**: (opcional) url pública de privacidad

## Deploy en Vercel

1. Subir este folder a **GitHub** como un repo nuevo.
2. En Vercel: **Add New... → Project → Import** tu repo.
3. Configurar **Environment Variables** (arriba).
4. Deployar. La página estará en `/diagnostico`.

## Ajustes rápidos

- Cambia el texto del `<h1>` en `app/diagnostico/page.tsx`.
- Edita reglas del resultado en `decideResult()` dentro de `app/api/submit/route.ts`.
