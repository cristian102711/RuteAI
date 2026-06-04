"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
  const [generando, setGenerando] = useState(false);

  const handleExport = async () => {
    try {
      setGenerando(true);

      // Crear instancia de jsPDF
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // ── COLORES CORPORATIVOS ──
      const primaryColor: [number, number, number] = [139, 92, 246]; // Morado (#8b5cf6)
      const accentColor: [number, number, number] = [245, 158, 11];  // Ámbar/Naranja (#f59e0b)
      const darkText: [number, number, number] = [31, 41, 55];       // Gris oscuro (#1f2937)
      const lightText: [number, number, number] = [107, 114, 128];   // Gris claro (#6b7280)

      // ── CABECERA / HEADER ──
      // Fondo morado sutil para el banner superior
      doc.setFillColor(243, 244, 246);
      doc.rect(0, 0, 210, 45, "F");

      // Título principal
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("RouteAI", 15, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(lightText[0], lightText[1], lightText[2]);
      doc.text("Solución de Optimización Logística inteligente", 15, 25);

      // Metadatos a la derecha
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      doc.text("REPORTE MENSUAL DE OPERACIONES", 120, 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(lightText[0], lightText[1], lightText[2]);
      doc.text(`Empresa: ${empresaNombre}`, 120, 24);
      doc.text(`Periodo: ${mes}`, 120, 30);
      doc.text(`Generado: ${new Date().toLocaleDateString("es-ES")}`, 120, 36);

      // Línea divisoria
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(1);
      doc.line(15, 45, 195, 45);

      // ── RESUMEN EJECUTIVO (KPIs) ──
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      doc.text("1. Resumen de Ahorros e Impacto (KPIs)", 15, 58);

      // Usar jsPDF AutoTable para formatear una grilla elegante de KPIs
      const kpiData = [
        [
          "Combustible Ahorrado",
          `${kpis.combustible.toLocaleString()} L`,
          `Equivalente a ≈ $${kpis.ahorroClp.toLocaleString("es-CL")} CLP en ahorro directo.`
        ],
        [
          "Tiempo Recuperado",
          `${kpis.tiempo.toLocaleString()} h`,
          "Horas efectivas devueltas a la flota gracias a rutas optimizadas."
        ],
        [
          "Eficiencia en Entregas",
          `${kpis.tasaExito}%`,
          `Tasa de éxito general (${kpis.pedidosEntregados} de ${kpis.pedidosTotal} pedidos).`
        ],
        [
          "Huella de Carbono Evitada",
          `${kpis.co2.toLocaleString()} kg`,
          `CO2 que deja de emitirse, equivalente a ${Math.round(kpis.co2 / 21)} árboles.`
        ]
      ];

      autoTable(doc, {
        startY: 64,
        head: [["Métrica", "Valor Real", "Impacto Estimado"]],
        body: kpiData,
        theme: "striped",
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: {
          fontSize: 10,
          cellPadding: 4,
        },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: "bold" },
          1: { cellWidth: 30, textColor: accentColor, fontStyle: "bold" },
          2: { cellWidth: 100 },
        },
      });

      const nextStartY = (doc as any).lastAutoTable.finalY + 15;

      // ── EXPLICACIÓN DE FÓRMULAS ──
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      doc.text("2. Metodología de Estimación", 15, nextStartY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(lightText[0], lightText[1], lightText[2]);
      
      const formulasText = [
        "• Combustible: Se asume un ahorro promedio de 1.2 litros por cada entrega exitosa realizada mediante una ruta optimizada.",
        "• CO2 evitado: Se multiplica el total de litros de combustible ahorrados por un factor de emisión estándar de 2.38 kg/L.",
        "• Tiempo recuperado: Se estima una reducción de 9 minutos por entrega en comparación con despachos no planificados.",
        "• Ahorro CLP: Basado en una cotización promedio del combustible de $1,100 CLP por litro."
      ];

      let formulaY = nextStartY + 6;
      formulasText.forEach((line) => {
        doc.text(line, 15, formulaY);
        formulaY += 6;
      });

      // ── FIRMA / PIE DE PÁGINA ──
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(15, 270, 195, 270);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(lightText[0], lightText[1], lightText[2]);
      doc.text("Documento oficial generado de manera automatizada por RouteAI. Todos los derechos reservados.", 15, 275);
      doc.text("Pág. 1 de 1", 180, 275);

      // Guardar PDF
      const filename = `Reporte_RouteAI_${empresaNombre.replace(/\s+/g, "_")}_${mes.replace(/\s+/g, "_")}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error("Error generando PDF:", error);
    } finally {
      setGenerando(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={generando}
      className="inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] active:scale-[0.98] disabled:opacity-50 transition-all px-4 py-2 text-sm text-zinc-300"
    >
      <Download className="h-4 w-4" />
      {generando ? "Generando..." : "Exportar PDF"}
    </button>
  );
}
