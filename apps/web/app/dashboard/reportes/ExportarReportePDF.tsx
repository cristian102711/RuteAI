"use client";

import { Download } from "lucide-react";

interface ExportarReportePDFProps {
  empresaNombre: string;
  mes: string;
  kpis: {
    combustible: number;
    ahorroClp: number;
    tiempo: number;
    tasaExito: number;
    co2: number;
    pedidosTotal: number;
    pedidosEntregados: number;
  };
}

export default function ExportarReportePDF({ empresaNombre, mes, kpis }: ExportarReportePDFProps) {
  const handleExport = () => {
    // Usamos el API de impresión nativo del navegador configurando estilos especiales de impresión.
    // Esto genera un PDF impecable que formatea la página omitiendo barras laterales o de navegación.
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              /* Ocultar barra lateral, header del dashboard, botones y pie de página de la app */
              aside,
              nav,
              header,
              button,
              .no-print {
                display: none !important;
              }
              
              /* Forzar fondo oscuro y colores premium en la impresión o PDF */
              body {
                background-color: #09090b !important;
                color: #f4f4f5 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              /* Ajustar márgenes */
              @page {
                margin: 15mm;
              }
              
              /* Asegurar que el contenedor ocupe todo el ancho */
              main,
              .max-w-7xl {
                max-width: 100% !important;
                width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
              }
            }
          `,
        }}
      />
      <button
        onClick={handleExport}
        className="inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] active:scale-[0.98] transition-all px-4 py-2 text-sm text-zinc-300"
      >
        <Download className="h-4 w-4" /> Exportar PDF
      </button>
    </>
  );
}
