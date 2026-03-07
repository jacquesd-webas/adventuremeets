import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("organization_workflows", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("organization_id")
      .notNullable()
      .references("id")
      .inTable("organizations")
      .onDelete("CASCADE");
    table.string("name").notNullable();
    table.string("trigger").notNullable(); // e.g. 'meet.report_generated'
    table.string("action_type").notNullable(); // e.g. 'expense_submission'
    table.jsonb("config").notNullable().defaultTo("{}");
    table.boolean("enabled").notNullable().defaultTo(true);
    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());
    table.index(["organization_id"]);
  });

  await knex.schema.createTable("meet_workflow_tasks", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("meet_id")
      .notNullable()
      .references("id")
      .inTable("meets")
      .onDelete("CASCADE");
    table
      .uuid("organization_id")
      .notNullable()
      .references("id")
      .inTable("organizations")
      .onDelete("CASCADE");
    table
      .uuid("workflow_id")
      .notNullable()
      .references("id")
      .inTable("organization_workflows")
      .onDelete("CASCADE");
    table.string("workflow_type").notNullable(); // mirrors action_type
    table.string("status").notNullable().defaultTo("pending"); // pending | completed | dismissed
    table.jsonb("payload").notNullable().defaultTo("{}");
    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());
    table.index(["meet_id", "status"]);
    table.index(["organization_id"]);
  });

  await knex.schema.createTable("expense_submissions", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("meet_id")
      .notNullable()
      .references("id")
      .inTable("meets")
      .onDelete("CASCADE");
    table
      .uuid("organization_id")
      .notNullable()
      .references("id")
      .inTable("organizations")
      .onDelete("CASCADE");
    table
      .uuid("workflow_task_id")
      .notNullable()
      .references("id")
      .inTable("meet_workflow_tasks")
      .onDelete("CASCADE");
    table
      .uuid("submitted_by")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.text("notes").nullable();
    table.string("status").notNullable().defaultTo("submitted"); // submitted | approved | rejected
    table.timestamp("submitted_at", { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());
    table.index(["meet_id"]);
    table.index(["organization_id"]);
  });

  await knex.schema.createTable("expense_attachments", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("expense_submission_id")
      .notNullable()
      .references("id")
      .inTable("expense_submissions")
      .onDelete("CASCADE");
    table.string("object_key").notNullable();
    table.string("url").notNullable();
    table.string("filename").notNullable();
    table.string("content_type").notNullable();
    table.integer("size_bytes").notNullable();
    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    table.index(["expense_submission_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("expense_attachments");
  await knex.schema.dropTableIfExists("expense_submissions");
  await knex.schema.dropTableIfExists("meet_workflow_tasks");
  await knex.schema.dropTableIfExists("organization_workflows");
}
