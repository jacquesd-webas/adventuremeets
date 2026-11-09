import { QRCodeSVG } from "qrcode.react";
import { renderToStaticMarkup } from "react-dom/server";

type OpenMeetPosterPrintWindowArgs = {
  title: string;
  subtitle: string;
  qrUrl: string;
  imageUrl?: string;
  organizationName: string;
  organizationLogoUrl?: string;
  footerLabel: string;
  posterMode?: "text-and-image" | "image-above" | "branded" | "text-only";
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toAbsoluteUrl(value?: string) {
  if (!value || typeof window === "undefined") {
    return value ?? "";
  }

  try {
    return new URL(value, window.location.origin).toString();
  } catch {
    return value;
  }
}

function toPosterImageUrl(value?: string) {
  const normalizedUrl = toAbsoluteUrl(value);

  if (!normalizedUrl || typeof window === "undefined") {
    return normalizedUrl;
  }

  try {
    const parsed = new URL(normalizedUrl);

    if (import.meta.env.DEV && parsed.pathname.startsWith("/meet-images/")) {
      return `${window.location.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    return parsed.toString();
  } catch {
    return normalizedUrl;
  }
}

function isValidBase64DataUrl(value: string) {
  const match = value.match(
    /^data:([^;,]+)?(?:;charset=[^;,]+)?;base64,(.+)$/i,
  );

  if (!match) {
    return false;
  }

  const [, , base64Payload] = match;

  if (!base64Payload || base64Payload.length % 4 !== 0) {
    return false;
  }

  try {
    window.atob(base64Payload);
    return true;
  } catch {
    return false;
  }
}

function openPosterLoadingWindow() {
  if (typeof window === "undefined") {
    return null;
  }

  const previewWindow = window.open("", "_blank");

  if (!previewWindow) {
    return null;
  }

  previewWindow.document.title = "Generating poster...";
  previewWindow.document.body.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0;background:#f3f4f6;color:#111827;font-family:Helvetica,Arial,sans-serif;">
      <div style="padding:24px 28px;border:1px solid #d1d5db;border-radius:18px;background:#fff;font-weight:700;">
        Generating poster...
      </div>
    </div>
  `;

  return previewWindow;
}

function resolvePosterImageUrl(imageUrl?: string) {
  const normalizedUrl = toPosterImageUrl(imageUrl);

  if (!normalizedUrl || typeof window === "undefined") {
    return "";
  }

  if (normalizedUrl.startsWith("data:")) {
    if (!isValidBase64DataUrl(normalizedUrl)) {
      console.error("Poster image data URI is invalid or truncated");
      return "";
    }

    return normalizedUrl;
  }

  return normalizedUrl;
}

export async function openMeetPosterPrintWindow({
  title,
  subtitle,
  qrUrl,
  imageUrl,
  organizationName,
  organizationLogoUrl,
  footerLabel,
  posterMode = "text-and-image",
}: OpenMeetPosterPrintWindowArgs) {
  const previewWindow = openPosterLoadingWindow();

  if (!previewWindow || typeof window === "undefined") {
    return;
  }

  const qrMarkup = renderToStaticMarkup(
    <QRCodeSVG value={qrUrl} size={360} includeMargin bgColor="#ffffff" />,
  );
  const resolvedImageUrl = resolvePosterImageUrl(imageUrl);
  const resolvedLogoUrl = resolvePosterImageUrl(organizationLogoUrl);

  const safeTitle = escapeHtml(title);
  const safeSubtitle = escapeHtml(subtitle);
  const safeOrganizationName = escapeHtml(organizationName);
  const safeFooterLabel = escapeHtml(footerLabel);
  const safeQrUrl = escapeHtml(qrUrl);
  const safeImageUrl = resolvedImageUrl ? escapeHtml(resolvedImageUrl) : "";
  const safeLogoUrl = resolvedLogoUrl ? escapeHtml(resolvedLogoUrl) : "";
  const hasImage = Boolean(safeImageUrl);
  const canUseBranded = hasImage && Boolean(safeLogoUrl);
  const initialPosterMode = !hasImage
    ? "text-only"
    : posterMode === "branded" && !canUseBranded
      ? "text-and-image"
      : posterMode;
  const isSelfCheckinPoster = footerLabel.toLowerCase().includes("check-in");
  const safeScanTitle = escapeHtml(
    isSelfCheckinPoster
      ? "Scan to check-in for this meet"
      : "Scan to signup for this meet",
  );
  const imagePosterMarkup = hasImage
    ? `
      <article
        class="poster poster-variant poster-variant--image"
        id="poster-variant-image"
        style="${initialPosterMode === "text-and-image" ? "display:grid;" : "display:none;"}"
      >
        <section class="hero">
          <img src="${safeImageUrl}" alt="${safeTitle}" />
          <div class="hero-copy">
            <div class="eyebrow">${safeFooterLabel}</div>
            <h1>${safeTitle}</h1>
            <p class="subtitle">${safeSubtitle}</p>
          </div>
        </section>
        <section class="details">
          <div class="footer-copy">
            <div class="footer-label">${safeOrganizationName}</div>
            <h2 class="scan-title">${safeScanTitle}</h2>
            <p class="scan-copy">
              Open the camera on your phone and scan the QR code to go straight to this meet page.
            </p>
            <div class="link">${safeQrUrl}</div>
          </div>
          <div class="qr-shell">${qrMarkup}</div>
        </section>
      </article>
    `
    : "";
  const imageAbovePosterMarkup = hasImage
    ? `
      <article
        class="poster poster-variant poster-variant--above"
        id="poster-variant-above"
        style="${initialPosterMode === "image-above" ? "display:grid;" : "display:none;"}"
      >
        <section class="poster-above-image">
          <img src="${safeImageUrl}" alt="${safeTitle}" />
        </section>
        <section class="poster-above-message">
          <div class="eyebrow">${safeFooterLabel}</div>
          <h1>${safeTitle}</h1>
          <p class="subtitle">${safeSubtitle}</p>
        </section>
        <section class="details poster-above-details">
          <div class="footer-copy">
            <div class="footer-label">${safeOrganizationName}</div>
            <h2 class="scan-title">${safeScanTitle}</h2>
            <p class="scan-copy">Open the camera on your phone and scan the QR code to go straight to this meet page.</p>
            <div class="link">${safeQrUrl}</div>
          </div>
          <div class="qr-shell">${qrMarkup}</div>
        </section>
      </article>
    `
    : "";
  const brandedPosterMarkup = canUseBranded
    ? `
      <article
        class="poster poster-variant poster-variant--branded"
        id="poster-variant-branded"
        style="${initialPosterMode === "branded" ? "display:grid;" : "display:none;"}"
      >
        <section class="hero branded-hero">
          <img src="${safeImageUrl}" alt="${safeTitle}" />
          <div class="branded-logo"><img src="${safeLogoUrl}" alt="${safeOrganizationName} logo" /></div>
          <div class="branded-title-panel">
            <div class="eyebrow">${safeFooterLabel}</div>
            <h1>${safeTitle}</h1>
            <p class="subtitle">${safeSubtitle}</p>
          </div>
        </section>
        <section class="details">
          <div class="footer-copy">
            <div class="footer-label">${safeOrganizationName}</div>
            <h2 class="scan-title">${safeScanTitle}</h2>
            <p class="scan-copy">Open the camera on your phone and scan the QR code to go straight to this meet page.</p>
            <div class="link">${safeQrUrl}</div>
          </div>
          <div class="qr-shell">${qrMarkup}</div>
        </section>
      </article>
    `
    : "";
  const textOnlyPosterMarkup = `
      <article
        class="poster poster--no-image poster-variant poster-variant--text"
        id="poster-variant-text"
        style="${initialPosterMode === "text-only" ? "display:flex;" : "display:none;"}"
      >
        <section class="poster-no-image-content">
          <div class="footer-label poster-no-image-label">${safeOrganizationName}</div>
          <div class="eyebrow eyebrow--plain">${safeFooterLabel}</div>
          <h1 class="poster-no-image-title">${safeTitle}</h1>
          <p class="poster-no-image-subtitle">${safeSubtitle}</p>
          <div class="qr-shell qr-shell--focus">${qrMarkup}</div>
          <h2 class="scan-title poster-no-image-scan-title">${safeScanTitle}</h2>
          <p class="scan-copy poster-no-image-scan-copy">
            Open the camera on your phone and scan the QR code to go straight to this meet page.
          </p>
          <div class="link poster-no-image-link">${safeQrUrl}</div>
        </section>
      </article>
    `;
  const posterMarkup = `${imagePosterMarkup}${imageAbovePosterMarkup}${brandedPosterMarkup}${textOnlyPosterMarkup}`;

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle} Poster</title>
    <style>
      :root {
        color-scheme: light;
      }
      * {
        box-sizing: border-box;
      }
      html,
      body {
        margin: 0;
        padding: 0;
        background: #e5e7eb;
        color: #111827;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      }
      body {
        min-height: 100vh;
      }
      .toolbar {
        position: sticky;
        top: 0;
        z-index: 10;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        padding: 16px;
        background: rgba(255, 255, 255, 0.92);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid #d1d5db;
      }
      .toolbar button {
        appearance: none;
        border: 0;
        border-radius: 999px;
        padding: 12px 18px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
      }
      .toolbar .primary {
        background: #2563eb;
        color: white;
      }
      .toolbar .secondary {
        background: #e5e7eb;
        color: #111827;
      }
      .toolbar .chip {
        background: #ffffff;
        color: #374151;
        border: 1px solid #d1d5db;
        font-weight: 600;
      }
      .toolbar .chip.active {
        background: #2563eb;
        color: #ffffff;
        border-color: #2563eb;
      }
      .toolbar .chip[disabled] {
        cursor: not-allowed;
        opacity: 0.45;
      }
      .toolbar .primary[disabled] {
        cursor: progress;
        opacity: 0.7;
      }
      .page {
        display: flex;
        justify-content: center;
        padding: 24px;
      }
      .poster {
        --hero-height: 720px;
        width: 794px;
        min-height: 1123px;
        background: #ffffff;
        border-radius: 28px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18);
        display: grid;
        grid-template-rows: var(--hero-height) auto;
      }
      .hero {
        position: relative;
        background: linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%);
        min-height: var(--hero-height);
      }
      .hero > img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .hero::after {
        content: "";
        position: absolute;
        inset: 0;
        background:
          linear-gradient(180deg, rgba(15, 23, 42, 0.08) 0%, rgba(15, 23, 42, 0.16) 32%, rgba(15, 23, 42, 0.84) 100%);
      }
      .hero-copy {
        position: absolute;
        left: 40px;
        right: 40px;
        bottom: 36px;
        z-index: 1;
        color: white;
      }
      .eyebrow {
        display: inline-block;
        margin-bottom: 12px;
        padding: 8px 14px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.14);
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .eyebrow--plain {
        background: #eff6ff;
        color: #2563eb;
      }
      h1 {
        margin: 0;
        font-size: 52px;
        line-height: 1.02;
        font-weight: 800;
        overflow-wrap: anywhere;
      }
      .subtitle {
        margin-top: 16px;
        max-width: 520px;
        font-size: 24px;
        line-height: 1.35;
        color: rgba(255, 255, 255, 0.92);
      }
      .details {
        display: grid;
        grid-template-columns: 1fr 250px;
        gap: 24px;
        padding: 34px 40px 40px;
        align-items: center;
      }
      .footer-copy {
        align-self: stretch;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        gap: 16px;
      }
      .footer-label {
        font-size: 18px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #2563eb;
      }
      .scan-title {
        margin: 0;
        font-size: 34px;
        line-height: 1.1;
        font-weight: 800;
      }
      .scan-copy {
        margin: 0;
        font-size: 18px;
        line-height: 1.45;
        color: #4b5563;
      }
      .link {
        margin-top: 4px;
        font-size: 12px;
        line-height: 1.45;
        color: #6b7280;
        word-break: break-all;
      }
      .qr-shell {
        border: 1px solid #dbeafe;
        border-radius: 24px;
        padding: 18px;
        background: linear-gradient(180deg, #ffffff 0%, #eff6ff 100%);
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .qr-shell svg {
        width: 100%;
        height: auto;
      }
      .qr-shell--focus {
        width: 320px;
        max-width: min(72vw, 320px);
        padding: 24px;
        border-color: #bfdbfe;
        box-shadow: 0 18px 48px rgba(37, 99, 235, 0.12);
      }
      .poster-variant--above {
        grid-template-rows: 483px 300px 340px;
      }
      .poster-above-image {
        min-height: 0;
        overflow: hidden;
      }
      .poster-above-image img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .poster-above-message {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        padding: 30px 42px;
        background: #0f172a;
        color: #ffffff;
      }
      .poster-above-message .subtitle {
        margin-bottom: 0;
      }
      .poster-above-details {
        grid-template-columns: 1fr 225px;
        align-items: start;
        padding: 24px 40px;
      }
      .branded-hero::after {
        background: linear-gradient(180deg, rgba(15, 23, 42, 0.24), transparent 42%);
      }
      .branded-logo {
        position: absolute;
        top: 36px;
        right: 36px;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: center;
        max-width: 200px;
        max-height: 140px;
        padding: 14px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 12px 36px rgba(15, 23, 42, 0.22);
      }
      .branded-logo img {
        display: block;
        width: auto;
        height: auto;
        max-width: 172px;
        max-height: 112px;
        object-fit: contain;
      }
      .branded-title-panel {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 2;
        padding: 36px 40px;
        background: rgba(15, 23, 42, 0.9);
        color: #ffffff;
      }
      .branded-title-panel .subtitle {
        margin-bottom: 0;
      }
      .poster--no-image {
        min-height: 1123px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 56px 48px;
        background:
          radial-gradient(circle at top, #eff6ff 0%, #ffffff 42%),
          linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      }
      .poster-no-image-content {
        width: 100%;
        max-width: 520px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      .poster-no-image-label {
        margin-bottom: 20px;
      }
      .poster-no-image-title {
        font-size: 58px;
        line-height: 0.98;
        margin-bottom: 18px;
      }
      .poster-no-image-subtitle {
        margin: 0 0 32px;
        font-size: 26px;
        line-height: 1.35;
        color: #4b5563;
      }
      .poster-no-image-scan-title {
        margin-top: 28px;
        text-align: center;
      }
      .poster-no-image-scan-copy {
        max-width: 440px;
        text-align: center;
      }
      .poster-no-image-link {
        margin-top: 10px;
        text-align: center;
      }
      @media print {
        @page {
          size: A4 portrait;
          margin: 12mm;
        }
        html,
        body {
          background: white;
        }
        .toolbar {
          display: none;
        }
        .page {
          padding: 0;
        }
        .poster {
          width: 100%;
          height: auto;
          min-height: auto;
          grid-template-rows: 182mm auto;
          border-radius: 0;
          box-shadow: none;
        }
        .poster-variant--above {
          height: 273mm;
          grid-template-rows: 113mm 77mm 83mm;
        }
        .poster-above-image img {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .poster-above-message,
        .branded-title-panel,
        .branded-logo {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .poster-above-message h1 {
          font-size: 42px;
        }
        .hero {
          height: 182mm;
          min-height: 182mm;
          break-inside: avoid;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .hero > img {
          width: 100%;
          height: 182mm;
          object-fit: cover;
          display: block;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .details {
          padding-top: 24px;
        }
        .poster-above-details {
          padding: 18px 28px;
        }
        .poster--no-image {
          min-height: calc(297mm - 24mm);
          padding: 24mm 18mm;
          background: #ffffff;
        }
        .poster-no-image-title {
          font-size: 52px;
        }
        .poster-no-image-subtitle {
          font-size: 24px;
        }
        .qr-shell--focus {
          width: 86mm;
          max-width: 86mm;
        }
      }
    </style>
  </head>
  <body data-poster-mode="${initialPosterMode}">
    <div class="toolbar">
      <button class="chip ${initialPosterMode === "text-and-image" ? "active" : ""}" data-poster-mode-option="text-and-image" aria-pressed="${initialPosterMode === "text-and-image"}" onclick="setPosterMode('text-and-image')" ${hasImage ? "" : "disabled"}>Overlay</button>
      <button class="chip ${initialPosterMode === "image-above" ? "active" : ""}" data-poster-mode-option="image-above" aria-pressed="${initialPosterMode === "image-above"}" onclick="setPosterMode('image-above')" ${hasImage ? "" : "disabled"}>Three tier</button>
      <button class="chip ${initialPosterMode === "branded" ? "active" : ""}" data-poster-mode-option="branded" aria-pressed="${initialPosterMode === "branded"}" onclick="setPosterMode('branded')" ${canUseBranded ? "" : "disabled"}>Branded</button>
      <button class="chip ${initialPosterMode === "text-only" ? "active" : ""}" data-poster-mode-option="text-only" aria-pressed="${initialPosterMode === "text-only"}" onclick="setPosterMode('text-only')">Text only</button>
      <button class="primary" id="print-button" onclick="printPoster()">Print</button>
      <button class="secondary" onclick="window.close()">Close</button>
    </div>
    <main class="page">
      ${posterMarkup}
    </main>
    <script>
      function setPosterMode(mode) {
        const poster = document.getElementById({
          "text-and-image": "poster-variant-image",
          "image-above": "poster-variant-above",
          "branded": "poster-variant-branded",
          "text-only": "poster-variant-text",
        }[mode]);
        if (!poster) return;

        document.body.setAttribute("data-poster-mode", mode);
        document.querySelectorAll(".poster-variant").forEach((variant) => {
          variant.style.display = variant === poster
            ? (mode === "text-only" ? "flex" : "grid")
            : "none";
        });
        document.querySelectorAll("[data-poster-mode-option]").forEach((button) => {
          const active = button.getAttribute("data-poster-mode-option") === mode;
          button.classList.toggle("active", active);
          button.setAttribute("aria-pressed", String(active));
        });
      }

      async function waitForDocumentImages(doc = document) {
        const images = Array.from(doc.images || []);

        await Promise.all(
          images.map((image) => {
            if (image.complete && image.naturalWidth > 0) {
              if (typeof image.decode === "function") {
                return image.decode().catch((error) => {
                  console.error("Poster image decode failed", image.currentSrc || image.src, error);
                });
              }

              return Promise.resolve();
            }

            return new Promise((resolve) => {
              const cleanup = () => {
                image.removeEventListener("load", handleLoad);
                image.removeEventListener("error", handleError);
              };
              const handleLoad = async () => {
                cleanup();
                if (typeof image.decode === "function") {
                  try {
                    await image.decode();
                  } catch (error) {
                    console.error("Poster image decode failed", image.currentSrc || image.src, error);
                  }
                }
                resolve();
              };
              const handleError = (error) => {
                cleanup();
                console.error("Poster image failed to load", image.currentSrc || image.src, error);
                resolve();
              };

              image.addEventListener("load", handleLoad, { once: true });
              image.addEventListener("error", handleError, { once: true });
            });
          }),
        );
      }

      async function printPoster() {
        const printButton = document.getElementById("print-button");

        if (printButton) {
          printButton.disabled = true;
          printButton.textContent = "Preparing...";
        }

        try {
          await waitForDocumentImages(document);
          window.print();
        } finally {
          if (printButton) {
            printButton.disabled = false;
            printButton.textContent = "Print";
          }
        }
      }

      waitForDocumentImages(document).catch((error) => {
        console.error("Poster image preparation failed", error);
      });
    </script>
  </body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const blobUrl = window.URL.createObjectURL(blob);
  previewWindow.location.replace(blobUrl);

  window.setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 10 * 60_000);
}
