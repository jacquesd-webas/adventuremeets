import {
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import CloseIcon from "@mui/icons-material/Close";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/authContext";
import Meet from "../../types/MeetModel";
import { MeetInfoDeets } from "./MeetInfoDeets";
import { getMeetDateLabel } from "../../helpers/meetTime";
import { MeetImageCarouselDialog } from "./MeetImageCarouselDialog";

type MeetInfoSummaryProps = {
  meet: Meet;
  isPreview: boolean;
  loginHref?: string;
  onLoginClick?: () => void;
  onCopyLink?: () => void;
  maxDescriptionLines?: number;
  showUserAction?: boolean;
  actionSlot?: ReactNode;
  onClose?: () => void;
};

export function MeetInfoSummary({
  meet,
  isPreview,
  loginHref = "/login",
  onLoginClick,
  onCopyLink,
  maxDescriptionLines,
  showUserAction = true,
  actionSlot,
  onClose,
}: MeetInfoSummaryProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const dateLabel = useMemo(() => getMeetDateLabel(meet), [meet]);
  const images = useMemo(() => {
    if (meet.images?.length) {
      return meet.images;
    }
    if (meet.imageUrl) {
      return [
        {
          id: "primary",
          meetId: meet.id,
          url: meet.imageUrl,
          isPrimary: true,
          aspect: "O" as const,
        },
      ];
    }
    return [];
  }, [meet.id, meet.imageUrl, meet.images]);
  const hasImage = images.length > 0;
  const previewImageAspect = images[0]?.aspect ?? "O";
  const previewImageSize = useMemo(() => {
    switch (previewImageAspect) {
      case "P":
        return { width: 150, height: 210 };
      case "S":
        return { width: 170, height: 170 };
      case "W":
        return { width: 220, height: 130 };
      case "O":
      default:
        return { width: 200, height: 150 };
    }
  }, [previewImageAspect]);
  const displayName = useMemo(() => {
    if (!user) return "";
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
    if (name) return name;
    if (user.idp_profile?.name) return user.idp_profile.name;
    if (user.email) return user.email.split("@")[0];
    return "";
  }, [user]);
  const initials = useMemo(() => {
    if (!displayName) return "MP";
    const parts = displayName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [displayName]);
  const shouldClamp = Boolean(maxDescriptionLines) && !isExpanded;
  const linkifyText = (text?: string) => {
    if (!text) return text;
    const pattern =
      /(\bhttps?:\/\/[^\s]+|\bwww\.[^\s]+|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d\s().-]{6,}\d)/gi;
    const parts: ReactNode[] = [];
    let lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const matchText = match[0];
      const index = match.index ?? 0;
      if (index > lastIndex) {
        parts.push(text.slice(lastIndex, index));
      }
      const lower = matchText.toLowerCase();
      if (lower.includes("@") && !lower.startsWith("http")) {
        parts.push(
          <Link key={`${index}-${matchText}`} href={`mailto:${matchText}`}>
            {matchText}
          </Link>,
        );
      } else if (lower.startsWith("http") || lower.startsWith("www.")) {
        const href = lower.startsWith("http")
          ? matchText
          : `https://${matchText}`;
        parts.push(
          <Link key={`${index}-${matchText}`} href={href}>
            {matchText}
          </Link>,
        );
      } else {
        const telValue = matchText.replace(/[^\d+]/g, "");
        parts.push(
          <Link key={`${index}-${matchText}`} href={`tel:${telValue}`}>
            {matchText}
          </Link>,
        );
      }
      lastIndex = index + matchText.length;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts;
  };

  useEffect(() => {
    if (!descriptionRef.current || !maxDescriptionLines) {
      setIsTruncated(false);
      return;
    }
    const el = descriptionRef.current;
    let frameId = 0;

    const measure = () => {
      setIsTruncated(el.scrollHeight > el.clientHeight + 1);
    };

    const scheduleMeasure = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(measure);
    };

    scheduleMeasure();

    const resizeObserver = new ResizeObserver(() => {
      scheduleMeasure();
    });
    resizeObserver.observe(el);
    window.addEventListener("resize", scheduleMeasure);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
    };
  }, [maxDescriptionLines, meet.description, isExpanded]);

  const renderDescription = () => (
    <Stack spacing={1} alignItems="flex-start">
      <Typography
        ref={descriptionRef}
        variant="body1"
        color="text.secondary"
        sx={{
          whiteSpace: "pre-line",
          ...(shouldClamp && {
            display: "-webkit-box",
            WebkitLineClamp: maxDescriptionLines,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }),
        }}
      >
        {linkifyText(meet.description)}
      </Typography>
      {maxDescriptionLines && isTruncated && (
        <Chip
          label={"show more"}
          size="small"
          variant="outlined"
          onClick={() => {
            (setIsTruncated(false), setIsExpanded(true));
          }}
        />
      )}
      {maxDescriptionLines && isExpanded && (
        <Chip
          label={"show less"}
          size="small"
          variant="outlined"
          onClick={() => {
            (setIsTruncated(true), setIsExpanded(false));
          }}
        />
      )}
    </Stack>
  );

  return (
    <>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="h4" fontWeight={700}>
          {meet.name}
        </Typography>
        {actionSlot ? (
          actionSlot
        ) : onClose ? (
          <IconButton
            onClick={onClose}
            size="small"
            aria-label="Close"
            data-testid="close-meet-details-modal"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        ) : showUserAction ? (
          isPreview && typeof onCopyLink === "function" ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={<LinkIcon fontSize="small" />}
              aria-label="Copy share link"
              onClick={onCopyLink}
              disabled={!meet.shareCode}
            >
              Copy link
            </Button>
          ) : isAuthenticated ? (
            <Avatar
              src={user?.avatarUrl || undefined}
              role="button"
              sx={{ width: 36, height: 36, cursor: "pointer" }}
              onClick={() => void logout()}
            >
              {initials}
            </Avatar>
          ) : (
            <Button
              variant="outlined"
              size="small"
              href={!onLoginClick ? loginHref : undefined}
              onClick={onLoginClick}
            >
              Login
            </Button>
          )
        ) : null}
      </Stack>
      {dateLabel && (
        <Typography variant="subtitle1" color="text.secondary">
          {dateLabel}
        </Typography>
      )}
      {hasImage ? (
        <>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="flex-start"
            mt={1}
          >
            <Box
              sx={{
                position: "relative",
                width: previewImageSize.width,
                height: previewImageSize.height,
                cursor: "pointer",
                flexShrink: 0,
              }}
              onClick={() => setCarouselOpen(true)}
            >
              <Box
                component="img"
                src={images[0]?.url || ""}
                alt="Meet preview"
                sx={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 2,
                  objectFit: "cover",
                  display: "block",
                }}
              />
              {images.length > 1 ? (
                <Box
                  sx={{
                    position: "absolute",
                    right: 8,
                    bottom: 8,
                    px: 1,
                    py: 0.25,
                    borderRadius: 999,
                    bgcolor: "rgba(15, 23, 42, 0.8)",
                    color: "#fff",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    lineHeight: 1.4,
                  }}
                >
                  +{images.length - 1}
                </Box>
              ) : null}
            </Box>
            <MeetInfoDeets meet={meet} />
          </Stack>
          {renderDescription()}
        </>
      ) : (
        <>
          <Box mt={1}>
            <MeetInfoDeets meet={meet} layout="horizontal" />
          </Box>
          {renderDescription()}
        </>
      )}
      <MeetImageCarouselDialog
        open={carouselOpen}
        title={meet.name}
        images={images}
        initialIndex={activeImageIndex}
        onIndexChange={setActiveImageIndex}
        onClose={() => setCarouselOpen(false)}
      />
    </>
  );
}
