import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

// Mock de las acciones del dashboard (server actions)
jest.mock("../app/dashboard/actions", () => ({
  eliminarPedido:      jest.fn().mockResolvedValue(undefined),
  marcarComoEntregado: jest.fn().mockResolvedValue(undefined),
  marcarEnRuta:        jest.fn().mockResolvedValue(undefined),
  cancelarPedido:      jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock("../app/dashboard/components/ModalEvidencia", () => ({
  ModalEvidencia: ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => (
    <div data-testid="modal-evidencia">
      Modal Evidencia
      <button onClick={onClose} data-testid="modal-close">Cerrar</button>
      <button onClick={onSuccess} data-testid="modal-success">OK</button>
    </div>
  ),
}));

import { BotonesTabla } from "../app/dashboard/components/BotonesTabla";
import { eliminarPedido, marcarEnRuta, cancelarPedido } from "../app/dashboard/actions";
import Swal from "sweetalert2";
import { toast } from "sonner";

// ─── Renders condicionales por estado ─────────────────────────────────────────
describe("BotonesTabla — renders", () => {
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

  it("renders cancelar (anular) button for estado=pendiente", () => {
    render(<BotonesTabla pedidoId="p1" estado="pendiente" />);
    expect(screen.getByTitle(/cancelar pedido \(anular\)/i)).toBeInTheDocument();
  });

  it("renders cancelar (anular) button for estado=en_ruta", () => {
    render(<BotonesTabla pedidoId="p2" estado="en_ruta" />);
    expect(screen.getByTitle(/cancelar pedido \(anular\)/i)).toBeInTheDocument();
  });

  it("does not render cancelar (anular) button for estado=entregado (terminal)", () => {
    render(<BotonesTabla pedidoId="p3" estado="entregado" />);
    expect(screen.queryByTitle(/cancelar pedido \(anular\)/i)).not.toBeInTheDocument();
  });

  it("does not render cancelar (anular) button for estado=cancelado (terminal)", () => {
    render(<BotonesTabla pedidoId="p4" estado="cancelado" />);
    expect(screen.queryByTitle(/cancelar pedido \(anular\)/i)).not.toBeInTheDocument();
  });

  it("does not render cancelar (anular) button for estado=fallido (terminal)", () => {
    render(<BotonesTabla pedidoId="p5" estado="fallido" />);
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

  it("passes nombreCliente prop correctly (no crash)", () => {
    const { container } = render(
      <BotonesTabla pedidoId="p1" estado="en_ruta" nombreCliente="Ana Torres" />,
    );
    expect(container).toBeInTheDocument();
  });
});

// ─── handleEntregar → ModalEvidencia ─────────────────────────────────────────
describe("BotonesTabla — handleEntregar", () => {
  it("opens ModalEvidencia when clicking entregar", () => {
    render(<BotonesTabla pedidoId="p2" estado="en_ruta" nombreCliente="Juan Pérez" />);
    fireEvent.click(screen.getByTitle(/confirmar entrega/i));
    expect(screen.getByTestId("modal-evidencia")).toBeInTheDocument();
  });

  it("closes ModalEvidencia when onClose is called", () => {
    render(<BotonesTabla pedidoId="p2" estado="en_ruta" />);
    fireEvent.click(screen.getByTitle(/confirmar entrega/i));
    expect(screen.getByTestId("modal-evidencia")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("modal-close"));
    expect(screen.queryByTestId("modal-evidencia")).not.toBeInTheDocument();
  });

  it("closes ModalEvidencia when onSuccess is called", () => {
    render(<BotonesTabla pedidoId="p2" estado="en_ruta" />);
    fireEvent.click(screen.getByTitle(/confirmar entrega/i));
    fireEvent.click(screen.getByTestId("modal-success"));
    expect(screen.queryByTestId("modal-evidencia")).not.toBeInTheDocument();
  });
});

// ─── handleEliminar ───────────────────────────────────────────────────────────
describe("BotonesTabla — handleEliminar", () => {
  beforeEach(() => jest.clearAllMocks());

  it("confirma en Swal → llama eliminarPedido con el pedidoId", async () => {
    (Swal.fire as jest.Mock).mockResolvedValueOnce({ isConfirmed: true });

    render(<BotonesTabla pedidoId="p1" estado="pendiente" />);
    fireEvent.click(screen.getByTitle(/cancelar este pedido/i));

    await waitFor(() => {
      expect(eliminarPedido).toHaveBeenCalledWith("p1");
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it("cancela en Swal → NO llama eliminarPedido", async () => {
    (Swal.fire as jest.Mock).mockResolvedValueOnce({ isConfirmed: false });

    render(<BotonesTabla pedidoId="p1" estado="pendiente" />);
    fireEvent.click(screen.getByTitle(/cancelar este pedido/i));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalled();
    });
    expect(eliminarPedido).not.toHaveBeenCalled();
  });

  it("confirma → eliminarPedido lanza error → toast.error", async () => {
    (Swal.fire as jest.Mock).mockResolvedValueOnce({ isConfirmed: true });
    (eliminarPedido as jest.Mock).mockRejectedValueOnce(new Error("Error de red"));

    render(<BotonesTabla pedidoId="p1" estado="pendiente" />);
    fireEvent.click(screen.getByTitle(/cancelar este pedido/i));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it("muestra Swal con título '¿Eliminar pedido?' al hacer click", async () => {
    (Swal.fire as jest.Mock).mockResolvedValueOnce({ isConfirmed: false });

    render(<BotonesTabla pedidoId="p1" estado="pendiente" />);
    fireEvent.click(screen.getByTitle(/cancelar este pedido/i));

    await waitFor(() => expect(Swal.fire).toHaveBeenCalled());
    const swalArg = (Swal.fire as jest.Mock).mock.calls[0][0];
    expect(swalArg.title).toMatch(/eliminar pedido/i);
  });
});

// ─── handleDespachar ──────────────────────────────────────────────────────────
describe("BotonesTabla — handleDespachar", () => {
  beforeEach(() => jest.clearAllMocks());

  it("confirma en Swal → llama marcarEnRuta con el pedidoId", async () => {
    (Swal.fire as jest.Mock).mockResolvedValueOnce({ isConfirmed: true });

    render(<BotonesTabla pedidoId="p1" estado="pendiente" />);
    fireEvent.click(screen.getByTitle(/notificar cliente/i));

    await waitFor(() => {
      expect(marcarEnRuta).toHaveBeenCalledWith("p1");
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it("cancela en Swal → NO llama marcarEnRuta", async () => {
    (Swal.fire as jest.Mock).mockResolvedValueOnce({ isConfirmed: false });

    render(<BotonesTabla pedidoId="p1" estado="pendiente" />);
    fireEvent.click(screen.getByTitle(/notificar cliente/i));

    await waitFor(() => expect(Swal.fire).toHaveBeenCalled());
    expect(marcarEnRuta).not.toHaveBeenCalled();
  });

  it("confirma → marcarEnRuta lanza error → toast.error", async () => {
    (Swal.fire as jest.Mock).mockResolvedValueOnce({ isConfirmed: true });
    (marcarEnRuta as jest.Mock).mockRejectedValueOnce(new Error("SMS falló"));

    render(<BotonesTabla pedidoId="p1" estado="pendiente" />);
    fireEvent.click(screen.getByTitle(/notificar cliente/i));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it("muestra Swal con título '¿Iniciar Despacho?' al hacer click", async () => {
    (Swal.fire as jest.Mock).mockResolvedValueOnce({ isConfirmed: false });

    render(<BotonesTabla pedidoId="p1" estado="pendiente" />);
    fireEvent.click(screen.getByTitle(/notificar cliente/i));

    await waitFor(() => expect(Swal.fire).toHaveBeenCalled());
    const swalArg = (Swal.fire as jest.Mock).mock.calls[0][0];
    expect(swalArg.title).toMatch(/iniciar despacho/i);
  });
});

// ─── handleCancelar ───────────────────────────────────────────────────────────
describe("BotonesTabla — handleCancelar", () => {
  beforeEach(() => jest.clearAllMocks());

  it("confirma con motivo → llama cancelarPedido(pedidoId, motivo)", async () => {
    (Swal.fire as jest.Mock).mockResolvedValueOnce({
      isConfirmed: true,
      value: "cliente_cancelo",
    });

    render(<BotonesTabla pedidoId="p1" estado="pendiente" />);
    fireEvent.click(screen.getByTitle(/cancelar pedido \(anular\)/i));

    await waitFor(() => {
      expect(cancelarPedido).toHaveBeenCalledWith("p1", "cliente_cancelo");
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it("cancela en Swal → NO llama cancelarPedido", async () => {
    (Swal.fire as jest.Mock).mockResolvedValueOnce({ isConfirmed: false });

    render(<BotonesTabla pedidoId="p1" estado="pendiente" />);
    fireEvent.click(screen.getByTitle(/cancelar pedido \(anular\)/i));

    await waitFor(() => expect(Swal.fire).toHaveBeenCalled());
    expect(cancelarPedido).not.toHaveBeenCalled();
  });

  it("confirma → cancelarPedido retorna {error} → toast.error con ese mensaje", async () => {
    (Swal.fire as jest.Mock).mockResolvedValueOnce({ isConfirmed: true, value: "duplicado" });
    (cancelarPedido as jest.Mock).mockResolvedValueOnce({ error: "No se puede cancelar: ya entregado" });

    render(<BotonesTabla pedidoId="p1" estado="pendiente" />);
    fireEvent.click(screen.getByTitle(/cancelar pedido \(anular\)/i));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "No se puede cancelar: ya entregado",
        expect.anything(),
      );
    });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("confirma → cancelarPedido lanza excepción → toast.error", async () => {
    (Swal.fire as jest.Mock).mockResolvedValueOnce({ isConfirmed: true, value: "error_datos" });
    (cancelarPedido as jest.Mock).mockRejectedValueOnce(new Error("DB error"));

    render(<BotonesTabla pedidoId="p1" estado="pendiente" />);
    fireEvent.click(screen.getByTitle(/cancelar pedido \(anular\)/i));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it("funciona también cuando el estado es en_ruta", async () => {
    (Swal.fire as jest.Mock).mockResolvedValueOnce({ isConfirmed: true, value: "otro" });

    render(<BotonesTabla pedidoId="p2" estado="en_ruta" />);
    fireEvent.click(screen.getByTitle(/cancelar pedido \(anular\)/i));

    await waitFor(() => {
      expect(cancelarPedido).toHaveBeenCalledWith("p2", "otro");
    });
  });

  it("muestra Swal con input select (motivos de cancelación)", async () => {
    (Swal.fire as jest.Mock).mockResolvedValueOnce({ isConfirmed: false });

    render(<BotonesTabla pedidoId="p1" estado="pendiente" />);
    fireEvent.click(screen.getByTitle(/cancelar pedido \(anular\)/i));

    await waitFor(() => expect(Swal.fire).toHaveBeenCalled());
    const swalArg = (Swal.fire as jest.Mock).mock.calls[0][0];
    expect(swalArg.title).toMatch(/cancelar pedido/i);
    expect(swalArg.input).toBe("select");
    // Verifica que los motivos de cancelación están en las inputOptions
    expect(swalArg.inputOptions).toHaveProperty("cliente_cancelo");
    expect(swalArg.inputOptions).toHaveProperty("duplicado");
  });

  it("inputValidator rechaza valor vacío", async () => {
    (Swal.fire as jest.Mock).mockResolvedValueOnce({ isConfirmed: false });

    render(<BotonesTabla pedidoId="p1" estado="pendiente" />);
    await act(async () => {
      fireEvent.click(screen.getByTitle(/cancelar pedido \(anular\)/i));
    });

    await waitFor(() => expect(Swal.fire).toHaveBeenCalled());
    const swalArg = (Swal.fire as jest.Mock).mock.calls[0][0];
    // El validator devuelve mensaje cuando el valor está vacío
    expect(swalArg.inputValidator("")).toBe("Selecciona un motivo");
    // Y undefined cuando hay valor válido
    expect(swalArg.inputValidator("duplicado")).toBeUndefined();
  });
});

// ─── Spinner component ───────────────────────────────────────────────────────
describe("BotonesTabla — Spinner (estado cargando)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("muestra spinner en el botón eliminar mientras la operación está en curso", async () => {
    // Promesa que no resuelve hasta que la controlamos nosotros
    let resolveEliminar!: (v: unknown) => void;
    const pendingEliminar = new Promise((res) => { resolveEliminar = res; });
    (Swal.fire as jest.Mock).mockResolvedValueOnce({ isConfirmed: true });
    (eliminarPedido as jest.Mock).mockReturnValueOnce(pendingEliminar);

    render(<BotonesTabla pedidoId="p1" estado="pendiente" />);
    fireEvent.click(screen.getByTitle(/cancelar este pedido/i));

    // Mientras eliminarPedido está pendiente, isDeleting = true → spinner visible
    await waitFor(() => {
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });

    // Resolver la promesa y confirmar que el spinner desaparece
    await act(async () => { resolveEliminar(undefined); });
    expect(document.querySelector(".animate-spin")).not.toBeInTheDocument();
  });

  it("muestra spinner en el botón despachar mientras la operación está en curso", async () => {
    let resolveRuta!: (v: unknown) => void;
    const pendingRuta = new Promise((res) => { resolveRuta = res; });
    (Swal.fire as jest.Mock).mockResolvedValueOnce({ isConfirmed: true });
    (marcarEnRuta as jest.Mock).mockReturnValueOnce(pendingRuta);

    render(<BotonesTabla pedidoId="p1" estado="pendiente" />);
    fireEvent.click(screen.getByTitle(/notificar cliente/i));

    await waitFor(() => {
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });

    await act(async () => { resolveRuta(undefined); });
    expect(document.querySelector(".animate-spin")).not.toBeInTheDocument();
  });
});
