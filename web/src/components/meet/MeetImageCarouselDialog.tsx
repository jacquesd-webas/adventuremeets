import {
  Box,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { ReactNode, useRef } from "react";
import MeetImage from "../../types/MeetImageModel";

type MeetImageCarouselDialogProps = {
  open: boolean;
  title?: string;
  images: MeetImage[];
  initialIndex?: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  renderActionSlot?: (image: MeetImage, index: number) => ReactNode;
};

export function MeetImageCarouselDialog({
  open,
  title,
  images,
  initialIndex = 0,
  onClose,
  onIndexChange,
  renderActionSlot,
}: MeetImageCarouselDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  if (!images.length) {
    return null;
  }

  const activeIndex = Math.min(Math.max(initialIndex, 0), images.length - 1);
  const activeImage = images[activeIndex];

  const goPrev = () => {
    onIndexChange(activeIndex === 0 ? images.length - 1 : activeIndex - 1);
  };

  const goNext = () => {
    onIndexChange(activeIndex === images.length - 1 ? 0 : activeIndex + 1);
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (!touchStart.current) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) {
      return;
    }

    if (dx > 0) {
      goPrev();
      return;
    }

    goNext();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={isMobile}
      sx={{
        "& .MuiDialog-paper": {
          m: isMobile ? 0 : 2,
          height: isMobile ? "100dvh" : "calc(100dvh - 32px)",
          maxHeight: isMobile ? "100dvh" : "calc(100dvh - 32px)",
          borderRadius: isMobile ? 0 : 2,
          overflow: "hidden",
          bgcolor: "rgba(15, 23, 42, 0.98)",
          color: "#fff",
        },
      }}
    >
      <DialogContent
        sx={{
          p: isMobile ? 1.5 : 2,
          height: "100%",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Stack spacing={2} sx={{ height: "100%", minHeight: 0 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ flexShrink: 0 }}
          >
            <Typography variant="h6" fontWeight={700}>
              {title || "Meet images"}
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              {renderActionSlot ? renderActionSlot(activeImage, activeIndex) : null}
              <IconButton
                onClick={onClose}
                aria-label="Close image carousel"
                sx={{ color: "#fff" }}
              >
                <CloseIcon />
              </IconButton>
            </Stack>
          </Stack>
          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={1}
            alignItems="center"
            justifyContent="center"
            sx={{ flex: 1, minHeight: 0 }}
          >
            {!isMobile && images.length > 1 ? (
              <IconButton
                onClick={goPrev}
                aria-label="Previous image"
                sx={{ color: "#fff" }}
              >
                <ChevronLeftIcon />
              </IconButton>
            ) : null}
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                minWidth: 0,
                position: "relative",
                height: "100%",
                maxHeight: "100%",
                width: "100%",
                maxWidth: 960,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "rgba(255,255,255,0.03)",
              }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <Box
                component="img"
                src={activeImage.url}
                alt={`${title || "Meet"} image ${activeIndex + 1}`}
                sx={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  display: "block",
                  mx: "auto",
                  my: "auto",
                  borderRadius: 2,
                }}
              />
              {isMobile && images.length > 1 ? (
                <>
                  <IconButton
                    onClick={goPrev}
                    aria-label="Previous image"
                    sx={{
                      position: "absolute",
                      left: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#fff",
                      bgcolor: "rgba(15, 23, 42, 0.55)",
                      "&:hover": {
                        bgcolor: "rgba(15, 23, 42, 0.75)",
                      },
                    }}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                  <IconButton
                    onClick={goNext}
                    aria-label="Next image"
                    sx={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#fff",
                      bgcolor: "rgba(15, 23, 42, 0.55)",
                      "&:hover": {
                        bgcolor: "rgba(15, 23, 42, 0.75)",
                      },
                    }}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 10,
                      left: "50%",
                      transform: "translateX(-50%)",
                      px: 1.25,
                      py: 0.4,
                      borderRadius: 999,
                      bgcolor: "rgba(15, 23, 42, 0.65)",
                      color: "#fff",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                    }}
                  >
                    {activeIndex + 1} / {images.length}
                  </Box>
                </>
              ) : null}
            </Box>
            {!isMobile && images.length > 1 ? (
              <IconButton
                onClick={goNext}
                aria-label="Next image"
                sx={{ color: "#fff" }}
              >
                <ChevronRightIcon />
              </IconButton>
            ) : null}
          </Stack>
          {images.length > 1 ? (
            <Stack
              direction="row"
              spacing={1}
              justifyContent="flex-start"
              flexWrap="nowrap"
              sx={{
                overflowX: "auto",
                overflowY: "hidden",
                pb: isMobile ? 0.5 : 0.25,
                px: 0.25,
                flexShrink: 0,
              }}
            >
              {images.map((image, index) => (
                <Box
                  key={image.id}
                  component="button"
                  type="button"
                  onClick={() => onIndexChange(index)}
                  aria-label={`Show image ${index + 1}`}
                  sx={{
                    p: 0,
                    border: 0,
                    background: "none",
                    cursor: "pointer",
                    opacity: index === activeIndex ? 1 : 0.65,
                    outline:
                      index === activeIndex
                        ? "2px solid #fff"
                        : "1px solid rgba(255,255,255,0.2)",
                    outlineOffset: 2,
                    borderRadius: 1,
                    flexShrink: 0,
                  }}
                >
                  <Box
                    component="img"
                    src={image.url}
                    alt=""
                    sx={{
                      width: 64,
                      height: 48,
                      objectFit: "cover",
                      borderRadius: 1,
                      display: "block",
                    }}
                  />
                </Box>
              ))}
            </Stack>
          ) : null}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
