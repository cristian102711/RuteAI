import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Docs — RuteAI",
  description: "Documentación interactiva de la API REST de RuteAI (OpenAPI 3.0)",
};

export default function DocsPage() {
  return <SwaggerPage />;
}

// Server component que inyecta el spec URL como prop al client
function SwaggerPage() {
  const specUrl = `/api/docs`;
  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Header */}
      <div className="bg-[#09090b] border-b border-zinc-800 px-6 py-4 flex items-center gap-3 sticky top-0 z-10">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center font-black text-white text-sm shadow-[0_0_20px_rgba(168,85,247,0.3)]">
          R
        </div>
        <div>
          <h1 className="text-white font-bold text-base leading-none">RuteAI — API Docs</h1>
          <p className="text-zinc-500 text-xs mt-0.5">OpenAPI 3.0 · v1.0.0</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <a
            href="/api/docs"
            target="_blank"
            className="text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded-lg px-3 py-1.5 transition-colors"
          >
            JSON Spec ↗
          </a>
          <a
            href="/dashboard"
            className="text-xs text-zinc-400 hover:text-white transition-colors"
          >
            ← Dashboard
          </a>
        </div>
      </div>

      {/* SwaggerUI embedido via script */}
      <div id="swagger-ui-root" className="pb-12" />

      {/* SwaggerUI CDN — carga asíncrona */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css"
      />
      {/* Estilos de override */}
      <style>{swaggerDarkStyles}</style>
      {/* Scripts CDN + inicialización */}
      <SwaggerScripts specUrl={specUrl} />
    </div>
  );
}

// Estilos del tema oscuro RuteAI
const swaggerDarkStyles = `
  #swagger-ui-root .swagger-ui { background: transparent; color: #e4e4e7; }
  #swagger-ui-root .swagger-ui .topbar { display: none; }
  #swagger-ui-root .swagger-ui .info { margin: 24px 20px; }
  #swagger-ui-root .swagger-ui .info .title { color: #f4f4f5 !important; font-size: 1.6rem !important; }
  #swagger-ui-root .swagger-ui .info p,
  #swagger-ui-root .swagger-ui .info li { color: #a1a1aa !important; }
  #swagger-ui-root .swagger-ui .scheme-container { background: #18181b; box-shadow: none; padding: 12px 20px; }
  #swagger-ui-root .swagger-ui .opblock-tag { color: #e4e4e7 !important; border-bottom: 1px solid #27272a !important; }
  #swagger-ui-root .swagger-ui .opblock-tag small { color: #71717a !important; }
  #swagger-ui-root .swagger-ui .opblock {
    background: #18181b; border: 1px solid #27272a !important;
    box-shadow: none; margin-bottom: 6px; border-radius: 12px; overflow: hidden;
  }
  #swagger-ui-root .swagger-ui .opblock.is-open { border-color: #3f3f46 !important; }
  #swagger-ui-root .swagger-ui .opblock .opblock-summary { padding: 10px 16px; }
  #swagger-ui-root .swagger-ui .opblock .opblock-summary-path { color: #e4e4e7 !important; font-weight: 600; }
  #swagger-ui-root .swagger-ui .opblock .opblock-summary-description { color: #71717a !important; }
  #swagger-ui-root .swagger-ui .opblock-body { background: #09090b; border-top: 1px solid #27272a; }
  #swagger-ui-root .swagger-ui .opblock-section-header { background: #18181b; border-bottom: 1px solid #27272a; }
  #swagger-ui-root .swagger-ui .opblock-section-header h4 { color: #a1a1aa !important; }
  #swagger-ui-root .swagger-ui table.headers td { color: #a1a1aa; }
  #swagger-ui-root .swagger-ui .response-col_status { color: #71717a; }
  #swagger-ui-root .swagger-ui .responses-table td { color: #a1a1aa !important; border-color: #27272a; }
  #swagger-ui-root .swagger-ui .parameter__name { color: #e4e4e7 !important; font-weight: 600; }
  #swagger-ui-root .swagger-ui .parameter__type { color: #a78bfa !important; font-size: 11px; }
  #swagger-ui-root .swagger-ui table.model tr td { color: #a1a1aa; border-color: #27272a; }
  #swagger-ui-root .swagger-ui .model-title { color: #e4e4e7 !important; }
  #swagger-ui-root .swagger-ui .prop-type { color: #34d399 !important; }
  #swagger-ui-root .swagger-ui .prop-format { color: #a78bfa !important; }
  #swagger-ui-root .swagger-ui .prop.prop-enum { color: #fbbf24 !important; }
  #swagger-ui-root .swagger-ui .btn { border-radius: 8px; font-weight: 600; }
  #swagger-ui-root .swagger-ui .btn.execute { background: #7c3aed !important; border-color: #7c3aed !important; }
  #swagger-ui-root .swagger-ui .btn.try-out__btn { border-color: #7c3aed; color: #a78bfa; }
  #swagger-ui-root .swagger-ui .btn.cancel { border-color: #ef4444; color: #f87171; }
  #swagger-ui-root .swagger-ui select,
  #swagger-ui-root .swagger-ui textarea,
  #swagger-ui-root .swagger-ui input[type=text] {
    background: #27272a !important; color: #e4e4e7 !important;
    border: 1px solid #3f3f46 !important; border-radius: 8px;
  }
  #swagger-ui-root .swagger-ui .highlight-code { background: #18181b !important; }
  #swagger-ui-root .swagger-ui section.models { background: #18181b; border: 1px solid #27272a; border-radius: 12px; margin: 20px; }
  #swagger-ui-root .swagger-ui section.models h4 { color: #e4e4e7 !important; }
  #swagger-ui-root .swagger-ui .model-box { background: #09090b; }
  #swagger-ui-root .swagger-ui .filter .operation-filter-input { background: #27272a; border: 1px solid #3f3f46; color: #e4e4e7; border-radius: 8px; }
  /* Colores por método HTTP */
  #swagger-ui-root .swagger-ui .opblock-get    { border-left: 3px solid #3b82f6 !important; }
  #swagger-ui-root .swagger-ui .opblock-post   { border-left: 3px solid #22c55e !important; }
  #swagger-ui-root .swagger-ui .opblock-patch  { border-left: 3px solid #f59e0b !important; }
  #swagger-ui-root .swagger-ui .opblock-put    { border-left: 3px solid #f97316 !important; }
  #swagger-ui-root .swagger-ui .opblock-delete { border-left: 3px solid #ef4444 !important; }
  #swagger-ui-root .swagger-ui .opblock-get    .opblock-summary-method { background: #1d4ed8 !important; border-radius: 6px; }
  #swagger-ui-root .swagger-ui .opblock-post   .opblock-summary-method { background: #15803d !important; border-radius: 6px; }
  #swagger-ui-root .swagger-ui .opblock-patch  .opblock-summary-method { background: #b45309 !important; border-radius: 6px; }
  #swagger-ui-root .swagger-ui .opblock-delete .opblock-summary-method { background: #b91c1c !important; border-radius: 6px; }
  /* Wrapper padding */
  #swagger-ui-root .swagger-ui .wrapper { padding: 0 20px; max-width: 1200px; margin: 0 auto; }
`;

// Componente que inyecta los scripts CDN de SwaggerUI
function SwaggerScripts({ specUrl }: { specUrl: string }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function loadSwagger() {
              var css = document.createElement('link');
              css.rel = 'stylesheet';
              css.href = 'https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css';
              document.head.appendChild(css);

              function loadScript(src, cb) {
                var s = document.createElement('script');
                s.src = src;
                s.onload = cb;
                document.body.appendChild(s);
              }

              loadScript('https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js', function() {
                loadScript('https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js', function() {
                  window.SwaggerUIBundle({
                    url: '${specUrl}',
                    dom_id: '#swagger-ui-root',
                    presets: [
                      window.SwaggerUIBundle.presets.apis,
                      window.SwaggerUIStandalonePreset
                    ],
                    layout: 'StandaloneLayout',
                    deepLinking: true,
                    displayRequestDuration: true,
                    defaultModelsExpandDepth: 1,
                    defaultModelExpandDepth: 2,
                    tryItOutEnabled: false,
                    filter: true,
                  });
                });
              });
            })();
          `,
        }}
      />
    </>
  );
}
