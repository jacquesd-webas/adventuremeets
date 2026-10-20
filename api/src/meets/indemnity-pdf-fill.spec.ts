import { PDFDocument } from "pdf-lib";
import { fillIndemnityPdf } from "./indemnity-pdf-fill";

describe("fillIndemnityPdf", () => {
  it("fills meet and attendee details and answers without retaining template answers", async () => {
    const template = await PDFDocument.create();
    const page = template.addPage();
    const form = template.getForm();
    form.createTextField("CampActivity").addToPage(page);
    form.createTextField("Start Date").addToPage(page);
    form.getTextField("Start Date").setMaxLength(8);
    form.createTextField("Start Time").addToPage(page);
    form.createTextField("LocationVenue").addToPage(page);
    form.createTextField("Scout troop / group").addToPage(page);
    form.createTextField("Child full name").addToPage(page);
    form.createTextField("Parent full name").addToPage(page);
    form.createTextField("Allergies").addToPage(page);
    form.createTextField("Old answer").addToPage(page);
    form.getTextField("Old answer").setText("Previous attendee");
    const swim = form.createRadioGroup("Permission to swim");
    swim.addOptionToPage("Yes", page);
    swim.addOptionToPage("No", page);

    const filled = await fillIndemnityPdf(Buffer.from(await template.save()), {
      meet: {
        name: "Mountain Hike",
        startTime: "2026-10-20T06:00:00Z",
        timeZone: "Africa/Johannesburg",
        location: "Trailhead",
        organizationName: "MCSA Cape Town",
      },
      attendee: {
        name: "Child Example",
        guardianName: "Parent Example",
        isMinor: true,
      },
      answers: { Allergies: "None", "Permission to swim": "Yes" },
    });
    const result = (await PDFDocument.load(filled)).getForm();
    expect(result.getTextField("CampActivity").getText()).toBe("Mountain Hike");
    expect(result.getTextField("Start Date").getText()).toBe("20/10/26");
    expect(result.getTextField("Start Time").getText()).toBe("08:00");
    expect(result.getTextField("LocationVenue").getText()).toBe("Trailhead");
    expect(result.getTextField("Scout troop / group").getText()).toBe(
      "MCSA Cape Town",
    );
    expect(result.getTextField("Child full name").getText()).toBe(
      "Child Example",
    );
    expect(result.getTextField("Parent full name").getText()).toBe(
      "Parent Example",
    );
    expect(result.getTextField("Allergies").getText()).toBe("None");
    expect(result.getTextField("Old answer").getText()).toBeUndefined();
    expect(result.getRadioGroup("Permission to swim").getSelected()).toBe(
      "Yes",
    );
  });
});
