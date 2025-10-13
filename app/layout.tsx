// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Inforum · Diagnóstico",
  description: "Cuestionario de diagnóstico",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        {/* === Google Tag (Ads/Analytics) === */}
        <Script
          id="google-tag"
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=AW-385774897"
        />
        <Script
          id="google-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-385774897');
            `,
          }}
        />

        {/* === Microsoft Clarity === */}
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "to7g2gm7pi");`,
          }}
        />
      </head>

      <body className="min-h-screen bg-white text-gray-900 antialiased flex flex-col">
        {/* HEADER */}
        <header className="w-full bg-[#082a49]">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center">
            <Image
              src="/logo-inforum.png"
              alt="Inforum"
              width={160}
              height={40}
              priority
            />
          </div>
        </header>

        {/* CONTENIDO */}
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
          {children}
        </main>

        {/* FOOTER */}
        <footer className="w-full bg-[#f5f5f5] py-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Inforum
        </footer>
      </body>
    </html>
  );
}
