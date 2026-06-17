import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock de las acciones del dashboard (server actions)
jest.mock("../app/dashboard/actions", () => ({
  eliminarPedido:    jest.fn().mockResolvedValue(undefined),
  marcarComoEntregado: jest.fn().mockResolvedValue(undefined),
  marcarEnRuta:      jest.fn().mockResolvedValue(undefined),
  cancelarPedido:    jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock("../app/dashboard/components/ModalEvidencia", () => ({
  ModalEvidencia: () => <div data-testid="modal-evidencia">Modal Evidencia</div>,
}));

import { BotonesTabla } from "../app/dashboard/components/BotonesTabla";

describe("BotonesTabla", () => {
  it("renders eliminar button for all states", () => {
    render(<BotonesTabla pedidoId="p1" estado="pendiente" />);
    expect(screen.getByTitle(/cancelar este pedido/i)).toBeInTheDocument();
  });

  it("renders despachar button for estado=pendiente", () => {
    render(<BotonesTabla pedidoId="p1" estado="pendiente" />);
    expect(screen.getByTitle(/notificar cliente/i)).toBeInTheDocument();
  });

  it("does not render despachar button for estado=en_ruta", () => {
    render(<BotonesTabla pedidoId="p2" estado="en_ruta" />);
    expect(screen.queryByTitle(/notificar cliente/i)).not.toBeInTheDocument();
  });

  it("renders entregar button for estado=en_ruta", () => {
    render(<BotonesTabla pedidoId="p2" estado="en_ruta" />);
    expect(screen.getByTitle(/confirmar entrega/i)).toBeInTheDocument();
  });

  it("renders completado badge for estado=entregado", () => {
    render(<BotonesTabla pedidoId="p3" estado="entregado" />);
    expect(screen.getByText(/completado/i)).toBeInTheDocument();
  });

  it("does not render entregar button for estado=entregado", () => {
    render(<BotonesTabla pedidoId="p3" estado="entregado" />);
    expect(screen.queryByTitle(/confirmar entrega/i)).not.toBeInTheDocument();
  });

  it("opens modal evidencia when clicking entregar", () => {
    render(<BotonesTabla pedidoId="p2" estado="en_ruta" nombreCliente="Juan Pérez" />);
    const btn = screen.getByTitle(/confirmar entrega/i);
    fireEvent.click(btn);
    expect(screen.getByTestId("modal-evidencia")).toBeInTheDocument();
  });

  it("passes nombreCliente prop correctly", () => {
    const { container } = render(
      <BotonesTabla pedidoId="p1" estado="en_ruta" nombreCliente="Ana Torres" />
    );
    expect(container).toBeInTheDocument();
  });

  it("renders cancelar (anular) button for active states", () => {
    render(<BotonesTabla pedidoId="p1" estado="pendiente" />);
    expect(screen.getByTitle(/cancelar pedido \(anular\)/i)).toBeInTheDocument();
  });

  it("does not render cancelar (anular) button for terminal states", () => {
    render(<BotonesTabla pedidoId="p3" estado="entregado" />);
    expect(screen.queryByTitle(/cancelar pedido \(anular\)/i)).not.toBeInTheDocument();
  });

  it("renders cancelado badge for estado=cancelado", () => {
    render(<BotonesTabla pedidoId="p4" estado="cancelado" />);
    expect(screen.getByText(/^cancelado$/i)).toBeInTheDocument();
  });

  it("renders fallido badge for estado=fallido", () => {
    render(<BotonesTabla pedidoId="p5" estado="fallido" />);
    expect(screen.getByText(/^fallido$/i)).toBeInTheDocument();
  });
});
