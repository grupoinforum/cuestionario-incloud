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
        {/* === Microsoft Clarity === */}
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "tpqh51e1s5");`,
          }}
        />

        {/* === Meta Pixel Code (sin duplicado) === */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            if (!window.fbq) {
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1744327902933881');
              fbq('track', 'PageView');
            }
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1744327902933881&ev=PageView&noscript=1"
          />
        </noscript>
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

        {/* === LinkedIn Insight Tag === */}
        <Script
  id="linkedin-insight"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      var _linkedin_partner_id = "8112330";
      window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
      window._linkedin_data_partner_ids.push(_linkedin_partner_id);
    `,
  }}
/>
<Script
  id="linkedin-insight-loader"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      (function(l) {
        if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])}; window.lintrk.q=[]}
        var s = document.getElementsByTagName("script")[0];
        var b = document.createElement("script"); b.type = "text/javascript"; b.async = true;
        b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
        s.parentNode.insertBefore(b, s);
      })(window.lintrk);
    `,
  }}
/>
<noscript>
  <img height="1" width="1" style={{ display: "none" }} alt=""
    src="https://px.ads.linkedin.com/collect/?pid=8112330&fmt=gif" />
</noscript>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src="https://px.ads.linkedin.com/collect/?pid=8112330&fmt=gif"
          />
        </noscript>
      </body>
    </html>
  );
}


