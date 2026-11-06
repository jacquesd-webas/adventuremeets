import { openMeetPosterPrintWindow } from "../openMeetPosterPrintWindow";

function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

describe("openMeetPosterPrintWindow", () => {
  const originalCreateObjectURL = window.URL.createObjectURL;
  const originalRevokeObjectURL = window.URL.revokeObjectURL;

  afterEach(() => {
    vi.restoreAllMocks();
    window.URL.createObjectURL = originalCreateObjectURL;
    window.URL.revokeObjectURL = originalRevokeObjectURL;
  });

  async function generatePoster(
    imageUrl?: string,
    organizationLogoUrl?: string,
  ) {
    let posterBlob: Blob | undefined;
    window.URL.createObjectURL = vi.fn((blob: Blob) => {
      posterBlob = blob;
      return "blob:poster-test";
    });
    window.URL.revokeObjectURL = vi.fn();
    const popupDocument = document.implementation.createHTMLDocument();
    vi.spyOn(window, "open").mockReturnValue({
      document: popupDocument,
      location: { replace: vi.fn() },
    } as unknown as Window);

    await openMeetPosterPrintWindow({
      title: "Mountain Day",
      subtitle: "Saturday, 7 November",
      qrUrl: "https://example.com/meets/mountain-day",
      imageUrl,
      organizationName: "Summit Explorers",
      organizationLogoUrl,
      footerLabel: "Meet signup",
    });

    expect(posterBlob).toBeDefined();
    return new DOMParser().parseFromString(
      await readBlob(posterBlob!),
      "text/html",
    );
  }

  it("offers four layouts and uses the organisation name on every poster", async () => {
    const doc = await generatePoster(
      "https://example.com/mountain.jpg",
      "https://example.com/logo.png",
    );
    const options = Array.from(
      doc.querySelectorAll("[data-poster-mode-option]"),
    );

    expect(options.map((option) => option.textContent)).toEqual([
      "Overlay",
      "Three tier",
      "Branded",
      "Text only",
    ]);
    expect(doc.querySelectorAll(".poster-variant")).toHaveLength(4);
    expect(doc.querySelectorAll(".footer-label")).toHaveLength(4);
    expect(
      Array.from(doc.querySelectorAll(".footer-label")).map((label) =>
        label.textContent?.trim(),
      ),
    ).toEqual(Array(4).fill("Summit Explorers"));
    expect(doc.querySelector(".poster-above-image img")).not.toBeNull();
    expect(doc.querySelector(".poster-above-message .footer-label")).toBeNull();
    expect(
      doc.querySelector(".poster-above-details .footer-label")?.textContent,
    ).toBe("Summit Explorers");
    expect(
      doc.querySelector(".poster-above-details .footer-copy")
        ?.firstElementChild,
    ).toBe(doc.querySelector(".poster-above-details .footer-label"));
    expect(doc.querySelector(".poster-above-message h1")?.textContent).toBe(
      "Mountain Day",
    );
    expect(doc.querySelector(".branded-hero > img")).not.toBeNull();
    expect(doc.querySelector(".branded-logo img")?.getAttribute("src")).toBe(
      "https://example.com/logo.png",
    );
    expect(
      doc.querySelector(".branded-logo")?.parentElement?.className,
    ).toContain("hero");
  });

  it("defaults to text only and disables image layouts without an image", async () => {
    const doc = await generatePoster();
    const options = Array.from(
      doc.querySelectorAll<HTMLButtonElement>("[data-poster-mode-option]"),
    );

    expect(doc.body.dataset.posterMode).toBe("text-only");
    expect(options.slice(0, 3).every((option) => option.disabled)).toBe(true);
    expect(options[3].disabled).toBe(false);
    expect(doc.querySelectorAll(".poster-variant")).toHaveLength(1);
  });

  it("disables the branded layout when the organisation has no logo", async () => {
    const doc = await generatePoster("https://example.com/mountain.jpg");
    const brandedOption = doc.querySelector<HTMLButtonElement>(
      '[data-poster-mode-option="branded"]',
    );

    expect(brandedOption?.disabled).toBe(true);
    expect(doc.querySelector("#poster-variant-branded")).toBeNull();
    expect(doc.querySelectorAll(".poster-variant")).toHaveLength(3);
  });
});
