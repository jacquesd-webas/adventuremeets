import type { Knex } from "knex";

type TemplateField = {
  fieldKey: string;
  label: string;
  fieldType: string;
  required?: boolean;
  position?: number;
  config?: Record<string, any>;
};

type TemplateSeed = {
  organizationName: string;
  name: string;
  description?: string;
  indemnity?: string;
  approvedResponse?: string;
  rejectResponse?: string;
  waitlistResponse?: string;
  metaDefinitions: TemplateField[];
};

const templates: TemplateSeed[] = [
  {
    organizationName: "Summit Explorers",
    name: "Alpine Day Hike",
    description: "Ideal for scenic hikes with optional guests and flexible pace.",
    indemnity:
      "I understand hiking involves uneven terrain, weather exposure, and potential injury. I agree to follow the organizer's instructions and take responsibility for my own safety.",
    approvedResponse:
      "You're confirmed for the hike. We'll share trail details and a packing list 48 hours before the meet.",
    rejectResponse:
      "Thanks for applying. This hike is full at the moment; we hope to see you on the next one.",
    waitlistResponse:
      "You're on the waitlist. We'll notify you if a spot opens up.",
    metaDefinitions: [
      {
        fieldKey: "fitness_level",
        label: "Fitness Level",
        fieldType: "select",
        required: true,
        config: { options: ["Beginner", "Intermediate", "Advanced"] }
      },
      {
        fieldKey: "emergency_contact",
        label: "Emergency Contact",
        fieldType: "text",
        required: true
      },
      {
        fieldKey: "gear_confirmed",
        label: "Gear Checklist Confirmed",
        fieldType: "checkbox",
        required: true
      }
    ]
  },
  {
    organizationName: "Summit Explorers",
    name: "Overnight Backpacking",
    description: "Two-day overnight hike with shared campsite and group meals.",
    indemnity:
      "Backpacking involves physical exertion and remote travel. I accept the risks and agree to follow safety guidance.",
    approvedResponse: "You're in! We'll coordinate gear and food logistics soon.",
    rejectResponse: "This trip is currently full. We'll keep you in mind for future overnights.",
    waitlistResponse: "You're on the waitlist. We'll follow up if space opens.",
    metaDefinitions: [
      {
        fieldKey: "pack_weight",
        label: "Expected Pack Weight (kg)",
        fieldType: "number"
      },
      {
        fieldKey: "sleep_system",
        label: "Sleep System",
        fieldType: "text"
      },
      {
        fieldKey: "navigation_experience",
        label: "Navigation Experience",
        fieldType: "select",
        config: { options: ["Novice", "Intermediate", "Expert"] }
      }
    ]
  },
  {
    organizationName: "Trailblazers Club",
    name: "Trail Run",
    description: "Fast-paced trail run with optional training pace group.",
    approvedResponse: "You're confirmed. We'll send route and pace group info soon.",
    rejectResponse: "Thanks for your interest. This run is at capacity.",
    waitlistResponse: "You're on the waitlist. We'll notify you if a spot opens.",
    metaDefinitions: [
      {
        fieldKey: "pace_group",
        label: "Preferred Pace Group",
        fieldType: "select",
        required: true,
        config: { options: ["Easy", "Moderate", "Fast"] }
      },
      {
        fieldKey: "distance_pref",
        label: "Distance Preference",
        fieldType: "select",
        config: { options: ["5k", "10k", "15k+"] }
      },
      {
        fieldKey: "injuries",
        label: "Current Injuries",
        fieldType: "text"
      }
    ]
  },
  {
    organizationName: "Weekend Adventurers",
    name: "Photography Walk",
    description: "Low-key city or nature walk focused on photo opportunities.",
    approvedResponse: "You're confirmed. Bring your camera or phone and a small day pack.",
    rejectResponse: "This walk is full. We'll share the next date soon.",
    waitlistResponse: "You're on the waitlist. We'll reach out if space opens.",
    metaDefinitions: [
      {
        fieldKey: "camera_type",
        label: "Camera Type",
        fieldType: "select",
        required: true,
        config: { options: ["Phone", "Point-and-shoot", "DSLR/Mirrorless"] }
      },
      {
        fieldKey: "photo_focus",
        label: "Photo Focus",
        fieldType: "select",
        config: { options: ["Landscapes", "People", "Wildlife", "Architecture"] }
      },
      {
        fieldKey: "tripod",
        label: "Bringing a Tripod?",
        fieldType: "checkbox"
      }
    ]
  }
];

export async function seed(knex: Knex): Promise<void> {
  await knex("organization_meta_definitions").del();
  await knex("templates").del();

  const orgRows = await knex("organizations").select("id", "name");
  const orgByName = new Map(orgRows.map((org) => [org.name, org.id]));

  const now = new Date().toISOString();

  const templateRows = templates.map((template) => {
    const organizationId = orgByName.get(template.organizationName);
    if (!organizationId) {
      throw new Error(
        `Seed requires organization: ${template.organizationName}`
      );
    }
    return {
      organization_id: organizationId,
      name: template.name,
      description: template.description ?? null,
      indemnity: template.indemnity ?? null,
      approved_response: template.approvedResponse ?? null,
      reject_response: template.rejectResponse ?? null,
      waitlist_response: template.waitlistResponse ?? null,
      created_at: now,
      updated_at: now
    };
  });

  const insertedTemplates = await knex("templates").insert(templateRows, [
    "id",
    "name",
    "organization_id"
  ]);

  const templateIdByKey = new Map(
    insertedTemplates.map((template) => [
      `${template.organization_id}:${template.name}`,
      template.id
    ])
  );

  const metaRows: any[] = [];
  templates.forEach((template) => {
    const orgId = orgByName.get(template.organizationName);
    if (!orgId) return;
    const templateId = templateIdByKey.get(`${orgId}:${template.name}`);
    if (!templateId) return;

    template.metaDefinitions.forEach((field, idx) => {
      metaRows.push({
        template_id: templateId,
        field_key: field.fieldKey,
        label: field.label,
        field_type: field.fieldType,
        required: field.required ?? false,
        position: field.position ?? idx,
        config: field.config || {},
        created_at: now,
        updated_at: now
      });
    });
  });

  if (metaRows.length) {
    await knex("organization_meta_definitions").insert(metaRows);
  }
}
