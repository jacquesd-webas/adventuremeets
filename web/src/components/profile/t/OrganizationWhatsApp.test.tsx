import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import { OrganizationWhatsApp } from "../OrganizationWhatsApp";

let connection: Record<string, any> = { status: "disconnected", qr: null };
const connect = vi.fn();
const disconnect = vi.fn();

vi.mock("../../../context/organizationContext", () => ({
  useCurrentOrganization: () => ({ currentOrganizationId: "org-1" }),
}));

vi.mock("../../../hooks/useOrganizationWhatsapp", () => ({
  useOrganizationWhatsapp: () => ({
    data: connection,
    isLoading: false,
    error: null,
  }),
  useConnectOrganizationWhatsapp: () => ({
    mutate: connect,
    isPending: false,
    error: null,
  }),
  useDisconnectOrganizationWhatsapp: () => ({
    mutate: disconnect,
    isPending: false,
    error: null,
  }),
}));

describe("OrganizationWhatsApp", () => {
  beforeEach(() => {
    connection = { status: "disconnected", qr: null };
    connect.mockReset();
    disconnect.mockReset();
  });

  it("lets an admin request pairing and shows the QR code", () => {
    const view = render(<OrganizationWhatsApp />);
    fireEvent.click(screen.getByRole("button", { name: "Connect WhatsApp" }));
    expect(connect).toHaveBeenCalledOnce();

    connection = { status: "qr", qr: "pairing-code" };
    view.rerender(<OrganizationWhatsApp />);
    expect(screen.getByText(/Scan this QR code/)).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Disconnect WhatsApp" }),
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Disconnect WhatsApp" }),
    );
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it("offers a session reset when a connection fails", () => {
    connection = {
      status: "error",
      error: "WhatsApp did not finish connecting",
    };
    render(<OrganizationWhatsApp />);
    expect(
      screen.getByRole("button", { name: "Retry connection" }),
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Reset saved session" }),
    );
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
