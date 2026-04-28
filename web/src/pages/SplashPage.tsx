import AndroidIcon from "@mui/icons-material/Android";
import IosShareIcon from "@mui/icons-material/IosShare";
import { Box, Link } from "@mui/material";
import { useEffect, useState } from "react";
import { IosInstallInstructionsDialog } from "../components/splash/IosInstallInstructionsDialog";
import { SplashActivityCarousel } from "../components/splash/SplashActivityCarousel";
import { useAndroidInstallPrompt } from "../hooks/useAndroidInstallPrompt";
import { useIosInstallInstructions } from "../hooks/useIosInstallInstructions";

function ensureHeadLink(id: string, attrs: Record<string, string>) {
  const existing = document.getElementById(id);
  if (existing) return () => undefined;

  const link = document.createElement("link");
  link.id = id;
  for (const [key, value] of Object.entries(attrs)) {
    link.setAttribute(key, value);
  }
  document.head.appendChild(link);
  return () => {
    link.remove();
  };
}

function useManropeFont() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const cleanupFns = [
      ensureHeadLink("splash-fonts-preconnect", {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      }),
      ensureHeadLink("splash-fonts-preconnect-gstatic", {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossorigin: "",
      }),
      ensureHeadLink("splash-fonts-manrope", {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;600;700;800&display=swap",
      }),
    ];
    return () => {
      cleanupFns.forEach((fn) => fn());
    };
  }, []);
}

function SplashPage() {
  useManropeFont();
  const { canInstall, promptInstall } = useAndroidInstallPrompt();
  const { canShowInstructions: canShowIosInstall } =
    useIosInstallInstructions();
  const [iosInstructionsOpen, setIosInstructionsOpen] = useState(false);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        fontFamily: '"Manrope", "Segoe UI", sans-serif',
        color: "#0f172a",
        background:
          "radial-gradient(1200px 700px at 15% -10%, rgba(14, 165, 233, 0.25), transparent 60%), radial-gradient(900px 500px at 85% 5%, rgba(251, 191, 36, 0.22), transparent 55%), linear-gradient(180deg, #ffffff 0%, #f8fafc 45%, #eef2ff 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: "20px",
        py: "48px",
      }}
    >
      <Box
        component="main"
        sx={{
          width: "min(1100px, 100%)",
          position: "relative",
          overflow: "hidden",
          borderRadius: "32px",
          backgroundColor: "rgba(255, 255, 255, 0.86)",
          backdropFilter: "blur(12px)",
          boxShadow:
            "0 24px 70px rgba(15, 23, 42, 0.15), inset 0 0 0 1px rgba(148, 163, 184, 0.2)",
          p: { xs: "40px 28px 32px", md: "56px 56px 40px" },
          "&::before": {
            content: '""',
            position: "absolute",
            inset: "-50% 0 auto auto",
            width: "420px",
            height: "420px",
            background:
              "radial-gradient(circle, rgba(14, 165, 233, 0.2), transparent 70%)",
            opacity: 0.8,
          },
          "&::after": {
            content: '""',
            position: "absolute",
            inset: "auto auto -45% -15%",
            width: "520px",
            height: "520px",
            background:
              "radial-gradient(circle, rgba(251, 191, 36, 0.25), transparent 70%)",
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            display: "grid",
            gap: "32px",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr auto" },
              gridTemplateAreas: {
                xs: `"logo" "title" "tagline" "carousel" "button"`,
                md: `"logo logo" "title title" "tagline carousel" "button carousel"`,
              },
              columnGap: { xs: 0, md: 4 },
              rowGap: { xs: 2, md: 2 },
              alignItems: "center",
            }}
          >
            <Box
              component="img"
              src="/static/adventuremeets-logo.png"
              alt="AdventureMeets logo"
              sx={{
                gridArea: "logo",
                width: { xs: 160, md: 200 },
                height: "auto",
              }}
            />

            <Box
              component="h1"
              sx={{
                gridArea: "title",
                fontSize: "clamp(2.2rem, 3vw, 3.3rem)",
                lineHeight: 1.05,
                m: 0,
                fontWeight: 800,
              }}
            >
              Adventure starts with the right crew.
            </Box>

            <Box
              component="p"
              sx={{
                gridArea: "tagline",
                fontSize: "clamp(1.05rem, 1.5vw, 1.35rem)",
                color: "#475569",
                maxWidth: "60ch",
                m: 0,
              }}
            >
              Making adventure planning simple and fun.
            </Box>

            <SplashActivityCarousel
              intervalMs={8000}
              sx={{
                gridArea: "carousel",
                justifySelf: { md: "end" },
                width: { xs: "100%", md: 400 },
                maxWidth: 400,
                height: { xs: 180, md: 180 },
              }}
            />

            <Box
              sx={{
                gridArea: "button",
                display: "grid",
                gap: 1,
                mt: "8px",
              }}
            >
              <Box
                component="a"
                href="/"
                sx={{
                  justifySelf: { xs: "stretch", sm: "start" },
                  width: { xs: "100%", sm: "fit-content" },
                  appearance: "none",
                  border: "none",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: "1rem",
                  px: "28px",
                  py: "16px",
                  mb: 2,
                  borderRadius: "999px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: { xs: "100%", sm: 240 },
                  color: "#fff",
                  background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                  boxShadow: "0 14px 30px rgba(14, 165, 233, 0.3)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                  },
                }}
              >
                Try AdventureMeets for Free
              </Box>
              {canInstall ? (
                <Box
                  component="button"
                  type="button"
                  onClick={() => {
                    void promptInstall();
                  }}
                  sx={{
                    appearance: "none",
                    border: "none",
                    cursor: "pointer",
                    justifySelf: { xs: "stretch", sm: "start" },
                    width: { xs: "100%", sm: "fit-content" },
                    fontWeight: 700,
                    fontSize: "0.92rem",
                    px: "18px",
                    py: "12px",
                    mb: 2,
                    borderRadius: "999px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    minWidth: { xs: "100%", sm: 0 },
                    color: "#fff",
                    backgroundColor: "#111111",
                    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.2)",
                    transition:
                      "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-1px)",
                      backgroundColor: "#000000",
                    },
                  }}
                >
                  <AndroidIcon sx={{ fontSize: 18 }} />
                  Install App
                </Box>
              ) : null}
              {canShowIosInstall ? (
                <Box
                  component="button"
                  type="button"
                  onClick={() => setIosInstructionsOpen(true)}
                  sx={{
                    appearance: "none",
                    border: "none",
                    cursor: "pointer",
                    justifySelf: { xs: "stretch", sm: "start" },
                    width: { xs: "100%", sm: "fit-content" },
                    fontWeight: 700,
                    fontSize: "0.92rem",
                    px: "18px",
                    py: "12px",
                    mb: 2,
                    borderRadius: "999px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    minWidth: { xs: "100%", sm: 0 },
                    color: "#fff",
                    backgroundColor: "#111111",
                    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.2)",
                    transition:
                      "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-1px)",
                      backgroundColor: "#000000",
                    },
                  }}
                >
                  <IosShareIcon sx={{ fontSize: 18 }} />
                  Install App
                </Box>
              ) : null}
              <Box
                sx={{
                  display: "grid",
                  gap: 0.5,
                  color: "#475569",
                  fontSize: "0.95rem",
                }}
              >
                <Box>
                  Read our{" "}
                  <Link href="/privacy" underline="hover">
                    Privacy Policy
                  </Link>
                </Box>
                <Box>
                  Read our{" "}
                  <Link href="/tnc" underline="hover">
                    Terms and Conditions
                  </Link>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box
            component="section"
            sx={{
              display: "grid",
              gap: "12px",
              borderTop: "1px solid rgba(148, 163, 184, 0.25)",
              pt: "24px",
              color: "#475569",
              "& strong": { color: "#0f172a" },
              "& p": { m: 0 },
            }}
          >
            <Box component="p">
              <strong>AdventureMeets</strong> is a free platform for organiser
              and adventurers to create and join adventure meets. Whether you're
              planning a weekend hike, a kayaking trip, or a group camping
              experience, AdventureMeets brings organisers and attendees
              together with seamless scheduling, easy check-ins, and powerful
              insights so you can focus on the experience, not the logistics.
            </Box>
            <Box component="p">Created by FringeCoding.</Box>
          </Box>
        </Box>
      </Box>
      <IosInstallInstructionsDialog
        open={iosInstructionsOpen}
        onClose={() => setIosInstructionsOpen(false)}
      />
    </Box>
  );
}

export default SplashPage;
