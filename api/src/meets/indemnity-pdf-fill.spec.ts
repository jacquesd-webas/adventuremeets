import { PDFDocument } from "pdf-lib";
import { fillIndemnityPdf } from "./indemnity-pdf-fill";

describe("fillIndemnityPdf", () => {
  it("leaves signature dates blank even if an older signup supplied an answer", async () => {
    const template = await PDFDocument.create();
    const page = template.addPage();
    template.getForm().createTextField("Parent Signature Date").addToPage(page);
    template.getForm().createTextField("Child Date of Birth").addToPage(page);

    const filled = await fillIndemnityPdf(Buffer.from(await template.save()), {
      meet: {},
      attendee: {},
      answers: {
        "Parent Signature Date": "23/10/2026",
        "Child Date of Birth": "01/01/2015",
      },
    });
    const form = (await PDFDocument.load(filled)).getForm();
    expect(
      form.getTextField("Parent Signature Date").getText(),
    ).toBeUndefined();
    expect(form.getTextField("Child Date of Birth").getText()).toBe(
      "01/01/2015",
    );
  });

  it.each([
    { isMinor: true, expected: "Parent Example" },
    { isMinor: false, expected: "Adult Example" },
  ])(
    "fills a generic signer name for isMinor=$isMinor",
    async ({ isMinor, expected }) => {
      const template = await PDFDocument.create();
      template.getForm().createTextField("Name").addToPage(template.addPage());

      const filled = await fillIndemnityPdf(
        Buffer.from(await template.save()),
        {
          meet: {},
          attendee: {
            name: "Adult Example",
            guardianName: "Parent Example",
            isMinor,
          },
          answers: {},
        },
      );

      expect(
        (await PDFDocument.load(filled))
          .getForm()
          .getTextField("Name")
          .getText(),
      ).toBe(expected);
    },
  );

  it("leaves a generic name as a question when a guardian field exists", async () => {
    const template = await PDFDocument.create();
    const page = template.addPage();
    template.getForm().createTextField("Name").addToPage(page);
    template.getForm().createTextField("Guardian Name").addToPage(page);

    const filled = await fillIndemnityPdf(Buffer.from(await template.save()), {
      meet: {},
      attendee: {
        name: "Child Example",
        guardianName: "Parent Example",
        isMinor: true,
      },
      answers: { Name: "Other person" },
    });
    const result = (await PDFDocument.load(filled)).getForm();
    expect(result.getTextField("Name").getText()).toBe("Other person");
    expect(result.getTextField("Guardian Name").getText()).toBe(
      "Parent Example",
    );
  });

  it("uses an adult attendee's name for a parent or guardian field", async () => {
    const template = await PDFDocument.create();
    template
      .getForm()
      .createTextField("Parent full name")
      .addToPage(template.addPage());

    const filled = await fillIndemnityPdf(Buffer.from(await template.save()), {
      meet: {},
      attendee: { name: "Adult Example", isMinor: false },
      answers: {},
    });

    expect(
      (await PDFDocument.load(filled))
        .getForm()
        .getTextField("Parent full name")
        .getText(),
    ).toBe("Adult Example");
  });

  it("uses one font and size even when form widgets request automatic sizing", async () => {
    const template = await PDFDocument.create();
    const page = template.addPage();
    const form = template.getForm();
    const small = form.createTextField("Small field");
    small.addToPage(page, { height: 12 });
    small.acroField.setDefaultAppearance("/Cour 0 Tf 0 g");
    small.acroField.getWidgets()[0].setDefaultAppearance("/Cour 0 Tf 0 g");
    const large = form.createTextField("Large field");
    large.addToPage(page, { height: 40 });
    const choice = form.createDropdown("Choice");
    choice.addOptions(["Yes", "No"]);
    choice.addToPage(page);

    const filled = await fillIndemnityPdf(Buffer.from(await template.save()), {
      meet: {},
      attendee: {},
      answers: {
        "Small field": "One",
        "Large field": "Two",
        Choice: "Yes",
      },
    });
    const result = (await PDFDocument.load(filled)).getForm();
    for (const field of [
      result.getTextField("Small field"),
      result.getTextField("Large field"),
      result.getDropdown("Choice"),
    ]) {
      expect(field.acroField.getDefaultAppearance()).toContain(
        "/Helvetica 9 Tf",
      );
      for (const widget of field.acroField.getWidgets()) {
        expect(widget.getDefaultAppearance()).toContain("/Helvetica 9 Tf");
      }
    }
    expect(result.getTextField("Small field").getText()).toBe("One");
    expect(result.getTextField("Large field").getText()).toBe("Two");
    expect(result.getDropdown("Choice").getSelected()).toEqual(["Yes"]);
  });

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
