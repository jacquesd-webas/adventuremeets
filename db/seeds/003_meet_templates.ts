import type { Knex } from "knex";

type TemplateField = {
  field_key: string;
  label: string;
  field_type: string;
  required?: boolean;
  position?: number;
  config?: Record<string, any>;
};

type MeetTemplate = {
  name: string;
  fields: TemplateField[];
};

const templates: MeetTemplate[] = [
  {
    name: "Day Hike Meet",
    fields: [
      { field_key: "emergency_contact", label: "Emergency Contact", field_type: "text", required: true },
      { field_key: "fitness_level", label: "Fitness Level", field_type: "select", config: { options: ["Beginner", "Intermediate", "Advanced"] } },
      { field_key: "gear", label: "Gear Checklist Confirmed", field_type: "checkbox", required: true }
    ]
  },
  {
    name: "Caving Meet",
    fields: [
      { field_key: "experience", label: "Caving Experience", field_type: "select", required: true, config: { options: ["None", "Some", "Experienced"] } },
      { field_key: "helmet", label: "Helmet Provided?", field_type: "select", config: { options: ["Need one", "Bringing my own"] } },
      { field_key: "litter", label: "I aggree to pick up litter", field_type: "checkbox", required: true }
    ]
  },
  {
    name: "Scrambling Meet",
    fields: [
      { field_key: "scramble_grade", label: "Max Scramble Grade", field_type: "select", required: true, config: { options: ["Class 2", "Class 3", "Class 4+"] } },
      { field_key: "helmet", label: "Helmet Confirmed", field_type: "checkbox", required: true },
      { field_key: "exposure_ok", label: "Comfortable With Exposure", field_type: "checkbox" }
    ]
  },
  {
    name: "Camping Meet",
    fields: [
      { field_key: "tent", label: "Tent / Shelter", field_type: "select", config: { options: ["Need spot", "Bringing my own", "Sharing"] } },
      { field_key: "meals", label: "Meal Plan", field_type: "text" },
      { field_key: "allergies", label: "Allergies / Dietary Notes", field_type: "text" }
    ]
  },
  {
    name: "Work Meet",
    fields: [
      { field_key: "agenda", label: "Agenda Items", field_type: "text" },
      { field_key: "role", label: "Role", field_type: "select", config: { options: ["Presenter", "Contributor", "Observer"] } }
    ]
  },
  {
    name: "Overnight Hike Meet",
    fields: [
      { field_key: "pack_weight", label: "Expected Pack Weight (lbs)", field_type: "number" },
      { field_key: "sleep_system", label: "Sleep System", field_type: "text" },
      { field_key: "navigation", label: "Navigation Experience", field_type: "select", config: { options: ["Novice", "Intermediate", "Expert"] } }
    ]
  }
];

export async function seed(knex: Knex): Promise<void> {
  const meetMap = await knex("meets").select("id", "name");
  const nameToId = new Map(meetMap.map((m) => [m.name, m.id]));

  const rows: any[] = [];
  for (const template of templates) {
    const meetId = nameToId.get(template.name);
    if (!meetId) continue;
    template.fields.forEach((field, idx) => {
      rows.push({
        meet_id: meetId,
        field_key: field.field_key,
        label: field.label,
        field_type: field.field_type,
        required: field.required ?? false,
        position: field.position ?? idx,
        config: field.config || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });
  }

  if (rows.length) {
    await knex("meet_meta_definitions").insert(rows);
  }
}
