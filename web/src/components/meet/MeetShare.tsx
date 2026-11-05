import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import LinkIcon from "@mui/icons-material/Link";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { QRCodeSVG } from "qrcode.react";
import Meet from "../../types/MeetModel";
import { getMeetDateLabel, getMeetTimeLabel } from "../../helpers/meetTime";
import { openMeetPosterPrintWindow } from "../createMeetModal/openMeetPosterPrintWindow";
import { useNotistack } from "../../hooks/useNotistack";
import { useFetchOrganization } from "../../hooks/useFetchOrganization";
import { MeetWhatsappComposer } from "./MeetWhatsappComposer";
import { meetShareMessage } from "./meetShareMessage";
import { MeetShareOption } from "./MeetShareOption";

type MeetShareProps = {
  open: boolean;
  onClose: () => void;
  meet: Meet;
  canManageMeet?: boolean;
};

export function MeetShare({
  open,
  onClose,
  meet,
  canManageMeet,
}: MeetShareProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const notice = useNotistack();
  const { data: organization } = useFetchOrganization(meet.organizationId, {
    enabled: open,
  });
  const [showQr, setShowQr] = useState(false);
  const [showWhatsappComposer, setShowWhatsappComposer] = useState(false);
  const shareUrl = `${window.location.origin}/share/${meet.shareCode}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(meetShareMessage(meet, shareUrl, "whatsapp"))}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(meet.name)}&body=${encodeURIComponent(meetShareMessage(meet, shareUrl, "email"))}`;
  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const handleClose = () => {
    setShowQr(false);
    setShowWhatsappComposer(false);
    onClose();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      notice.success("Meet link copied");
    } catch {
      notice.error("Unable to copy meet link");
    }
  };

  const handlePoster = () => {
    if (!organization?.name) return;
    const dateLabel = getMeetDateLabel(meet);
    const timeLabel = getMeetTimeLabel(meet);
    openMeetPosterPrintWindow({
      title: meet.name,
      subtitle:
        !timeLabel || timeLabel === "TBC"
          ? dateLabel
          : `${dateLabel} • ${timeLabel}`,
      qrUrl: shareUrl,
      imageUrl: meet.imageUrl,
      organizationName: organization.name,
      organizationLogoUrl: organization.logoUrl,
      footerLabel: "Meet signup",
    });
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: meet.name,
        text: meetShareMessage(meet, shareUrl, "email", false, false),
        url: shareUrl,
      });
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        notice.error("Unable to share meet");
      }
    }
  };

  const content = (
    <Box sx={{ width: isMobile ? "100%" : 480, maxWidth: "100%", pt: 1 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: "repeat(3, minmax(0, 1fr))",
          },
          gap: 1.5,
        }}
      >
        <MeetShareOption
          label="WhatsApp"
          icon={<WhatsAppIcon fontSize="large" />}
          {...(canManageMeet
            ? { onClick: () => setShowWhatsappComposer(true) }
            : {
                href: whatsappUrl,
                target: "_blank",
                rel: "noopener noreferrer",
              })}
        />
        <MeetShareOption
          label="QR Code"
          icon={<QrCode2Icon fontSize="large" />}
          onClick={() => setShowQr((value) => !value)}
          selected={showQr}
        />
        <MeetShareOption
          label="Copy Link"
          icon={<LinkIcon fontSize="large" />}
          onClick={handleCopy}
        />
        <MeetShareOption
          label="Email"
          icon={<EmailOutlinedIcon fontSize="large" />}
          href={emailUrl}
        />
        <MeetShareOption
          label="Poster"
          icon={<ArticleOutlinedIcon fontSize="large" />}
          onClick={handlePoster}
          disabled={!organization?.name}
        />
        {canNativeShare ? (
          <MeetShareOption
            label="More..."
            icon={<MoreHorizIcon fontSize="large" />}
            onClick={handleNativeShare}
          />
        ) : null}
      </Box>
      {showQr ? (
        <Stack alignItems="center" spacing={1} sx={{ pt: 3, pb: 1 }}>
          <Box sx={{ bgcolor: "white", p: 2 }}>
            <QRCodeSVG value={shareUrl} size={220} />
          </Box>
          <Typography
            variant="body2"
            sx={{ overflowWrap: "anywhere", textAlign: "center" }}
          >
            {shareUrl}
          </Typography>
        </Stack>
      ) : null}
    </Box>
  );

  const shareView = isMobile ? (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          maxHeight: "90vh",
          overflowY: "auto",
        },
      }}
    >
      <Box
        sx={{
          p: 2,
          maxWidth: 480,
          width: "100%",
          mx: "auto",
          boxSizing: "border-box",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h6">Share {meet.name}</Typography>
          <Button onClick={handleClose}>Close</Button>
        </Stack>
        {content}
      </Box>
    </Drawer>
  ) : (
    <Dialog open={open} onClose={handleClose} maxWidth="sm">
      <DialogTitle>Share {meet.name}</DialogTitle>
      <DialogContent>{content}</DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      {shareView}
      {showWhatsappComposer ? (
        <MeetWhatsappComposer
          meet={meet}
          onClose={() => setShowWhatsappComposer(false)}
        />
      ) : null}
    </>
  );
}
