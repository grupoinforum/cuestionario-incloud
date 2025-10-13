// app/page.tsx
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function Home() {
  // Redirige inmediatamente a /diagnostico
  redirect("/diagnostico");
}
