import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NotificationBell } from "../app/dashboard/components/NotificationBell";

// Mock de fetch global
beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

const alertasMock = [
  { id: "1", tipo: "retraso",     mensaje: "El repartidor lleva 30 min de retraso", createdAt: new Date().toISOString() },
  { id: "2", tipo: "desvio",      mensaje: "Desvío detectado en Av. Providencia",   createdAt: new Date().toISOString() },
  { id: "3", tipo: "riesgo_alto", mensaje: "Score de riesgo alto en pedido #A1B2",  createdAt: new Date().toISOString() },
];

describe("NotificationBell", () => {
  it("renders bell icon", () => {
    render(<NotificationBell initialCount={0} initialAlertas={[]} />);
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("does not show badge when count is 0", () => {
    const { container } = render(<NotificationBell initialCount={0} initialAlertas={[]} />);
    expect(container.querySelector(".animate-ping")).not.toBeInTheDocument();
  });

  it("shows badge with count when there are unread alerts", () => {
    render(<NotificationBell initialCount={3} initialAlertas={alertasMock} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows 9+ when count exceeds 9", () => {
    render(<NotificationBell initialCount={15} initialAlertas={alertasMock} />);
    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it("opens dropdown on bell click", () => {
    render(<NotificationBell initialCount={2} initialAlertas={alertasMock} />);
    const button = screen.getByRole("button", { name: /notificaciones/i });
    fireEvent.click(button);
    expect(screen.getByText("Notificaciones")).toBeInTheDocument();
  });

  it("shows 'Todo al día' when no alerts in dropdown", () => {
    render(<NotificationBell initialCount={0} initialAlertas={[]} />);
    const button = screen.getByRole("button", { name: /notificaciones/i });
    fireEvent.click(button);
    expect(screen.getByText(/todo al día/i)).toBeInTheDocument();
  });

  it("shows alert messages when dropdown is open", () => {
    render(<NotificationBell initialCount={3} initialAlertas={alertasMock} />);
    fireEvent.click(screen.getByRole("button", { name: /notificaciones/i }));
    expect(screen.getByText(/repartidor lleva/i)).toBeInTheDocument();
  });

  it("calls PATCH /api/alertas when opening dropdown with alerts", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ json: async () => ({}) });
    render(<NotificationBell initialCount={2} initialAlertas={alertasMock} />);
    fireEvent.click(screen.getByRole("button", { name: /notificaciones/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/alertas", { method: "PATCH" });
    });
  });

  it("resets count to 0 after opening", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ json: async () => ({}) });
    render(<NotificationBell initialCount={5} initialAlertas={alertasMock} />);
    fireEvent.click(screen.getByRole("button", { name: /notificaciones/i }));
    // After opening, badge should disappear
    await waitFor(() => {
      expect(screen.queryByText("5")).not.toBeInTheDocument();
    });
  });

  it("shows link to all alerts", () => {
    render(<NotificationBell initialCount={1} initialAlertas={alertasMock} />);
    fireEvent.click(screen.getByRole("button", { name: /notificaciones/i }));
    expect(screen.getByText(/ver todas las alertas/i)).toBeInTheDocument();
  });
});
