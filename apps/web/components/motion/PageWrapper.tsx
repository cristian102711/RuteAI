"use client";

import { motion } from "framer-motion";
import { pageTransition, staggerContainer, slideUp, scaleIn, slideDown } from "./variants";

// ─── PageWrapper ─────────────────────────────────────────────────────────────
// Wrapper de página completa con entrada suave + stagger de secciones.
// Uso: envuelve el return de cualquier page.tsx (server o client).
export function PageWrapper({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── AnimatedHeader ──────────────────────────────────────────────────────────
// Anima el encabezado (título + subtítulo + botón) deslizando desde arriba.
export function AnimatedHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideDown}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── AnimatedGrid ─────────────────────────────────────────────────────────────
// Grid de KPI cards que entran en cascada (stagger) al montar la página.
export function AnimatedGrid({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── AnimatedCard ─────────────────────────────────────────────────────────────
// Tarjeta con entrada scaleIn + hover lift. Úsala como hijo de AnimatedGrid.
export function AnimatedCard({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      variants={scaleIn}
      whileHover={{ y: -4, scale: 1.015, transition: { duration: 0.18 } }}
      whileTap={{ scale: 0.98 }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

// ─── AnimatedSection ──────────────────────────────────────────────────────────
// Sección grande (tabla, gráfico) con slideUp cuando entra al viewport.
export function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, y: 28 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: "easeOut", delay },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── AnimatedRow ──────────────────────────────────────────────────────────────
// Fila de tabla que aparece deslizando desde abajo. Úsala como hijo de AnimatedGrid.
export function AnimatedRow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.tr
      variants={slideUp}
      className={className}
    >
      {children}
    </motion.tr>
  );
}

// ─── AnimatedListItem ─────────────────────────────────────────────────────────
// Ítem de lista (li / div) para listas tipo alertas, pedidos, etc.
export function AnimatedListItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={slideUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}
