import React from "react";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../app/dashboard/components/StatusBadge";

describe("StatusBadge", () => {
  it("renders PENDIENTE label for estado='pendiente'", () => {
    render(<StatusBadge estado="pendiente" />);
    expect(screen.getByText("PENDIENTE")).toBeInTheDocument();
  });

  it("renders EN CAMINO label for estado='en_ruta'", () => {
    render(<StatusBadge estado="en_ruta" />);
    expect(screen.getByText("EN CAMINO")).toBeInTheDocument();
  });

  it("renders ENTREGADO label for estado='entregado'", () => {
    render(<StatusBadge estado="entregado" />);
    expect(screen.getByText("ENTREGADO")).toBeInTheDocument();
  });

  it("renders FALLIDO label for estado='fallido'", () => {
    render(<StatusBadge estado="fallido" />);
    expect(screen.getByText("FALLIDO")).toBeInTheDocument();
  });

  it("renders CANCELADO label for estado='cancelado'", () => {
    render(<StatusBadge estado="cancelado" />);
    expect(screen.getByText("CANCELADO")).toBeInTheDocument();
  });

  it("renders ATRASADO overlay when atrasado is true", () => {
    render(<StatusBadge estado="en_ruta" atrasado minutosAtraso={45} />);
    expect(screen.getByText("EN CAMINO")).toBeInTheDocument();
    expect(screen.getByText(/ATRASADO/)).toBeInTheDocument();
  });

  it("falls back to PENDIENTE for unknown estado", () => {
    render(<StatusBadge estado="desconocido" />);
    expect(screen.getByText("PENDIENTE")).toBeInTheDocument();
  });

  it("applies extra className when provided", () => {
    const { container } = render(<StatusBadge estado="entregado" className="test-class" />);
    expect(container.firstChild).toHaveClass("test-class");
  });

  it("renders as a <span> element", () => {
    const { container } = render(<StatusBadge estado="pendiente" />);
    expect(container.firstChild?.nodeName).toBe("SPAN");
  });
});
