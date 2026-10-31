import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import { useCurrentOrganization } from "../../context/organizationContext";
import {
  useConnectOrganizationWhatsapp,
  useDisconnectOrganizationWhatsapp,
  useOrganizationWhatsapp,
} from "../../hooks/useOrganizationWhatsapp";

export function OrganizationWhatsApp() {
  const { currentOrganizationId } = useCurrentOrganization();
  const { data, isLoading, error } = useOrganizationWhatsapp(
    currentOrganizationId,
  );
  const connect = useConnectOrganizationWhatsapp(currentOrganizationId);
  const disconnect = useDisconnectOrganizationWhatsapp(currentOrganizationId);
  const busy = connect.isPending || disconnect.isPending;

  return (
    <Stack spacing={2} alignItems="flex-start">
      <Box>
        <Typography variant="h6">WhatsApp</Typography>
        <Typography variant="body2" color="text.secondary">
          Link your organisation's WhatsApp number by scanning a QR code from
          WhatsApp's Linked devices screen.
        </Typography>
      </Box>

      {isLoading ? <Typography>Loading connection status…</Typography> : null}
      {error ? (
        <Alert severity="error">Unable to load WhatsApp status.</Alert>
      ) : null}
      {connect.error || disconnect.error ? (
        <Alert severity="error">
          {connect.error?.message || disconnect.error?.message}
        </Alert>
      ) : null}

      {data?.status === "connected" ? (
        <Alert severity="success">
          Connected{data.phone ? ` as +${data.phone}` : ""}.
        </Alert>
      ) : null}
      {data?.status === "connecting" ? (
        <Typography>Starting WhatsApp connection…</Typography>
      ) : null}
      {data?.status === "disconnecting" ? (
        <Typography>Disconnecting WhatsApp…</Typography>
      ) : null}
      {data?.status === "qr" && data.qr ? (
        <Stack spacing={1}>
          <Typography variant="body2">
            Scan this QR code with the organisation's phone:
          </Typography>
          <Box sx={{ p: 2, bgcolor: "white", width: "fit-content" }}>
            <QRCodeSVG value={data.qr} size={220} />
          </Box>
          <Typography variant="caption" color="text.secondary">
            The code refreshes automatically while pairing is in progress.
          </Typography>
        </Stack>
      ) : null}
      {data?.status === "qr" && !data.qr ? (
        <Typography>Waiting for a fresh QR code…</Typography>
      ) : null}
      {data?.status === "error" ? (
        <Alert severity="error">
          {data.error || "WhatsApp connection failed."} If retrying does not
          work, reset the saved session and scan a new QR code.
        </Alert>
      ) : null}

      {data && ["disconnected", "error"].includes(data.status) ? (
        <Button
          variant="contained"
          disabled={busy}
          onClick={() => connect.mutate()}
        >
          {data.status === "error" ? "Retry connection" : "Connect WhatsApp"}
        </Button>
      ) : null}
      {data?.status === "error" ? (
        <Button
          color="error"
          disabled={busy}
          onClick={() => disconnect.mutate()}
        >
          Reset saved session
        </Button>
      ) : null}
      {data && ["connecting", "qr", "connected"].includes(data.status) ? (
        <Button
          color="error"
          disabled={busy}
          onClick={() => disconnect.mutate()}
        >
          Disconnect WhatsApp
        </Button>
      ) : null}
    </Stack>
  );
}
