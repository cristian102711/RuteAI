import React from "react";
import { render, screen } from "@testing-library/react";
import { KPICard } from "../app/dashboard/components/KPICard";
import { Package } from "lucide-react";

describe("KPICard", () => {
  it("renders the label and value", () => {
    render(<KPICard label="Pedidos Hoy" value={42} />);
    expect(screen.getByText("Pedidos Hoy")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders the hint text when provided", () => {
    render(<KPICard label="Rutas" value={8} hint="+2 hoy" />);
    expect(screen.getByText("+2 hoy")).toBeInTheDocument();
  });

  it("does not render hint when not provided", () => {
    const { container } = render(<KPICard label="Conductores" value={5} />);
    // Only label and value spans should exist
    expect(container.querySelectorAll("span").length).toBe(1);
  });

  it("renders an icon when provided", () => {
    render(<KPICard label="Paquetes" value={100} icon={Package} />);
    // Lucide renders an SVG
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("renders a string value correctly", () => {
    render(<KPICard label="Score" value="98.5%" />);
    expect(screen.getByText("98.5%")).toBeInTheDocument();
  });
});
