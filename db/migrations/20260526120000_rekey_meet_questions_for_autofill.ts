import type { Knex } from "knex";

type MeetMetaDefinitionRow = {
  id: string;
  meet_id: string;
  organization_id: string;
  field_key: string;
  label: string;
  position: number | null;
};

type UserMetaValueRow = {
  id: string;
  user_id: string;
  organization_id: string;
  key: string;
  value: string | null;
  created_at: string | Date | null;
  updated_at: string | Date | null;
};

function normalizeMeetQuestionText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function hashFnv1a64(value: string) {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = (hash * prime) & mask;
  }

  return hash.toString(16).padStart(16, "0");
}

function buildMeetQuestionFieldKey(
  organizationId: string,
  questionLabel: string,
) {
  const normalizedOrganizationId = organizationId.trim().toLowerCase();
  const normalizedQuestionLabel = normalizeMeetQuestionText(questionLabel);
  return `mq_${hashFnv1a64(
    `${normalizedOrganizationId}::${normalizedQuestionLabel}`,
  )}`;
}

function buildUserMetaGroupKey(row: {
  user_id: string;
  organization_id: string;
  key: string;
}) {
  return `${row.user_id}::${row.organization_id}::${row.key}`;
}

function toEpoch(value: string | Date | null) {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

export async function up(knex: Knex): Promise<void> {
  await knex.transaction(async (trx) => {
    const definitions = (await trx("meet_meta_definitions as md")
      .join("meets as m", "m.id", "md.meet_id")
      .select<MeetMetaDefinitionRow[]>(
        "md.id",
        "md.meet_id",
        "m.organization_id",
        "md.field_key",
        "md.label",
        "md.position",
      )) as MeetMetaDefinitionRow[];

    const sortedDefinitions = [...definitions].sort((left, right) => {
      if (left.meet_id !== right.meet_id) {
        return left.meet_id.localeCompare(right.meet_id);
      }
      const leftBaseKey = buildMeetQuestionFieldKey(
        left.organization_id,
        left.label,
      );
      const rightBaseKey = buildMeetQuestionFieldKey(
        right.organization_id,
        right.label,
      );
      if (leftBaseKey !== rightBaseKey) {
        return leftBaseKey.localeCompare(rightBaseKey);
      }
      if ((left.position ?? 0) !== (right.position ?? 0)) {
        return (left.position ?? 0) - (right.position ?? 0);
      }
      return left.id.localeCompare(right.id);
    });

    const meetKeyCounts = new Map<string, number>();
    const definitionUpdates = sortedDefinitions.map((definition) => {
      const baseKey = buildMeetQuestionFieldKey(
        definition.organization_id,
        definition.label,
      );
      const meetScopedKey = `${definition.meet_id}::${baseKey}`;
      const nextCount = (meetKeyCounts.get(meetScopedKey) ?? 0) + 1;
      meetKeyCounts.set(meetScopedKey, nextCount);

      return {
        ...definition,
        newFieldKey: nextCount === 1 ? baseKey : `${baseKey}_${nextCount}`,
      };
    });

    for (const definition of definitionUpdates) {
      await trx("meet_meta_definitions")
        .where({ id: definition.id })
        .update({
          field_key: `tmp_rekey_${definition.id}`,
          updated_at: trx.fn.now(),
        });
    }

    for (const definition of definitionUpdates) {
      await trx("meet_meta_definitions")
        .where({ id: definition.id })
        .update({
          field_key: definition.newFieldKey,
          updated_at: trx.fn.now(),
        });
    }

    const organizationFieldKeyMap = new Map<string, string>();
    for (const definition of definitionUpdates) {
      organizationFieldKeyMap.set(
        `${definition.organization_id}::${definition.field_key}`,
        definition.newFieldKey,
      );
    }

    const userMetaValues = (await trx("user_meta_values").select<
      UserMetaValueRow[]
    >(
      "id",
      "user_id",
      "organization_id",
      "key",
      "value",
      "created_at",
      "updated_at",
    )) as UserMetaValueRow[];

    const rewrittenUserMetaValues = userMetaValues.map((row) => ({
      ...row,
      newKey:
        organizationFieldKeyMap.get(`${row.organization_id}::${row.key}`) ??
        row.key,
    }));

    const groupedRows = new Map<
      string,
      Array<UserMetaValueRow & { newKey: string }>
    >();
    for (const row of rewrittenUserMetaValues) {
      const groupKey = buildUserMetaGroupKey({
        user_id: row.user_id,
        organization_id: row.organization_id,
        key: row.newKey,
      });
      const group = groupedRows.get(groupKey) ?? [];
      group.push(row);
      groupedRows.set(groupKey, group);
    }

    const rowsToDelete: string[] = [];
    const rowsToUpdate: Array<{ id: string; key: string }> = [];

    groupedRows.forEach((groupRows) => {
      const sortedGroup = [...groupRows].sort((left, right) => {
        const updatedAtDiff =
          toEpoch(right.updated_at) - toEpoch(left.updated_at);
        if (updatedAtDiff !== 0) return updatedAtDiff;

        const createdAtDiff =
          toEpoch(right.created_at) - toEpoch(left.created_at);
        if (createdAtDiff !== 0) return createdAtDiff;

        return right.id.localeCompare(left.id);
      });

      const [keeper, ...duplicates] = sortedGroup;
      if (keeper.key !== keeper.newKey) {
        rowsToUpdate.push({ id: keeper.id, key: keeper.newKey });
      }
      duplicates.forEach((row) => {
        rowsToDelete.push(row.id);
      });
    });

    if (rowsToDelete.length) {
      await trx("user_meta_values").whereIn("id", rowsToDelete).del();
    }

    for (const row of rowsToUpdate) {
      await trx("user_meta_values")
        .where({ id: row.id })
        .update({ key: row.key, updated_at: trx.fn.now() });
    }
  });
}

export async function down(): Promise<void> {
  // This is a data migration and is intentionally not reversible.
}
