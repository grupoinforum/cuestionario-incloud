// app/gracias/page.tsx
import { redirect } from "next/navigation";

export const metadata = {
  title: "Gracias",
  robots: { index: false, follow: false },
};

export default function GraciasRedirectPage() {
  // Si el usuario entra o refresca en /gracias,
  // lo regresamos al flujo principal del cuestionario.
  redirect("/diagnostico");
}

