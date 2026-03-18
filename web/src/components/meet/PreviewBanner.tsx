import { useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";

export function PreviewBanner() {
  const bannerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = bannerRef.current;
    if (!node) return;

    const setBannerHeightVar = () => {
      const height = node.getBoundingClientRect().height;
      document.documentElement.style.setProperty(
        "--preview-banner-height",
        `${Math.round(height)}px`,
      );
    };

    setBannerHeightVar();

    const resizeObserver = new ResizeObserver(() => {
      setBannerHeightVar();
    });
    resizeObserver.observe(node);

    return () => {
      resizeObserver.disconnect();
      document.documentElement.style.setProperty("--preview-banner-height", "0px");
    };
  }, []);

  return (
    <Box
      ref={bannerRef}
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2,
        bgcolor: "warning.light",
        px: 2,
        py: 1.5,
        boxShadow: 1,
      }}
    >
      <Typography
        variant="body2"
        align="center"
        color="text.primary"
        fontWeight={600}
      >
        PREVIEW ONLY - No changes will be saved on this form
      </Typography>
    </Box>
  );
}
