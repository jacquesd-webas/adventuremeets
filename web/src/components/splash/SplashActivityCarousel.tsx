import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";

type Slide = { key: string; src: string };

function shuffle<T>(items: readonly T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const DEFAULT_SPLASH_IMAGE_FILES = [
  "camping.jpg",
  "climbing.jpg",
  "dancing.jpg",
  "hiking.jpg",
  "school-outings.jpg",
  "scuba.jpg",
  "surfing.jpg",
  "zipline.jpg",
];

function toSplashUrl(file: string) {
  return `/static/splash/${file}`;
}

function isAllowedImageFile(file: string) {
  return /\.(png|jpg|jpeg|webp|avif)$/i.test(file);
}

function normalizeManifest(data: unknown): string[] | null {
  if (!data) return null;
  if (Array.isArray(data)) {
    const files = data.filter((v) => typeof v === "string") as string[];
    return files.filter(isAllowedImageFile);
  }
  if (typeof data === "object") {
    const obj = data as { images?: unknown };
    if (Array.isArray(obj.images)) {
      const files = obj.images.filter((v) => typeof v === "string") as string[];
      return files.filter(isAllowedImageFile);
    }
  }
  return null;
}

export function SplashActivityCarousel({
  intervalMs = 8000,
  sx,
}: {
  intervalMs?: number;
  sx?: SxProps<Theme>;
}) {
  const [imageFiles, setImageFiles] = useState<string[]>(
    DEFAULT_SPLASH_IMAGE_FILES,
  );
  const [order, setOrder] = useState<Slide[]>(() =>
    shuffle(DEFAULT_SPLASH_IMAGE_FILES).map((file) => ({
      key: file,
      src: toSplashUrl(file),
    })),
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/static/splash/manifest.json")
      .then(async (res) => {
        if (!res.ok) return null;
        return normalizeManifest(await res.json());
      })
      .then((files) => {
        if (cancelled) return;
        if (!files || files.length === 0) return;
        setImageFiles(files);
      })
      .catch(() => {
        // Keep defaults.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const nextOrder = shuffle(imageFiles).map((file) => ({
      key: file,
      src: toSplashUrl(file),
    }));
    setOrder(nextOrder);
    setIndex(0);
  }, [imageFiles]);

  useEffect(() => {
    // Preload so transitions don't flash on first show.
    order.forEach((slide) => {
      const img = new Image();
      img.src = slide.src;
    });
  }, [order]);

  useEffect(() => {
    if (order.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => {
        const next = prev + 1;
        if (next < order.length) return next;
        setOrder(shuffle(imageFiles).map((file) => ({
          key: file,
          src: toSplashUrl(file),
        })));
        return 0;
      });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [imageFiles, intervalMs, order.length]);

  const active = order[index] ?? order[0];

  const alt = useMemo(() => {
    if (!active) return "Activity";
    return "Splash image";
  }, [active]);

  if (!active) {
    return (
      <Box
        sx={[
          {
            width: "100%",
            borderRadius: 3,
            border: "1px solid rgba(148, 163, 184, 0.35)",
            background:
              "linear-gradient(135deg, rgba(14,165,233,0.08), rgba(251,191,36,0.08))",
          },
          sx,
        ]}
        aria-label="Activity carousel"
      />
    );
  }

  return (
    <Box
      sx={[
        {
          position: "relative",
          width: "100%",
          borderRadius: 3,
          overflow: "hidden",
          aspectRatio: { xs: "3 / 2", md: "3 / 2" },
          boxShadow: "0 18px 42px rgba(15, 23, 42, 0.14)",
          border: "1px solid rgba(148, 163, 184, 0.35)",
          background:
            "linear-gradient(135deg, rgba(14,165,233,0.08), rgba(251,191,36,0.08))",
        },
        sx,
      ]}
      aria-label="Activity carousel"
    >
      <Box
        component="img"
        key={active.key}
        src={active.src}
        alt={alt}
        loading="eager"
        decoding="async"
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          animation: "splashFadeIn 700ms ease both",
          "@keyframes splashFadeIn": {
            from: { opacity: 0, transform: "scale(1.01)" },
            to: { opacity: 1, transform: "scale(1)" },
          },
        }}
      />

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(15,23,42,0.0) 40%, rgba(15,23,42,0.48) 100%)",
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 0.75,
        }}
      >
        {order.map((slide, i) => (
          <Box
            key={slide.key}
            sx={{
              width: 8,
              height: 8,
              borderRadius: 99,
              backgroundColor:
                i === index
                  ? "rgba(255,255,255,0.95)"
                  : "rgba(255,255,255,0.45)",
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
