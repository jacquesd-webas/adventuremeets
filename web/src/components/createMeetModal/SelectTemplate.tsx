import { useEffect, useMemo, useState } from "react";
import {
  Box,
  FormControl,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { useAuth } from "../../context/AuthContext";
import { useFetchOrganizationTemplates } from "../../hooks/useFetchOrganizationTemplates";
import { useFetchOrganizationTemplate } from "../../hooks/useFetchOrganizationTemplate";
import { QuestionField } from "./CreateMeetState";
import { TemplateMetaDefinition } from "../../types/TemplateModel";

type SelectTemplateProps = {
  organizationId?: string;
  onApply: (questions: QuestionField[]) => void;
};

export function SelectTemplate({
  organizationId,
  onApply,
}: SelectTemplateProps) {
  const { user } = useAuth();
  const resolvedOrgId = organizationId || user?.organizationIds?.[0];
  const [selectedId, setSelectedId] = useState("");

  const {
    data: templates,
    isLoading,
    error,
  } = useFetchOrganizationTemplates(resolvedOrgId);
  const { data: template, isLoading: isLoadingTemplate } =
    useFetchOrganizationTemplate(resolvedOrgId, selectedId || undefined);

  useEffect(() => {
    if (!template) return;
    onApply(mapDefinitionsToQuestions(template.metaDefinitions || []));
    setSelectedId("");
  }, [template, onApply]);

  const options = useMemo(
    () => templates.map((t) => ({ id: t.id, name: t.name })),
    [templates]
  );

  console.log({ templates, template, selectedId, options });
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <FormControl size="small" sx={{ minWidth: 220 }}>
        <Select
          aria-label="Template"
          value={selectedId}
          displayEmpty
          onChange={(event) => {
            console.log({ selectedId: event.target.value });
            setSelectedId(event.target.value);
          }}
          disabled={!resolvedOrgId || isLoading}
          MenuProps={{ sx: { zIndex: 1501 } }}
          renderValue={(value) => {
            if (!value) {
              return (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FileDownloadOutlinedIcon fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    Import...
                  </Typography>
                </Box>
              );
            }
            const selected = options.find((option) => option.id === value);
            return selected?.name || "Untitled template";
          }}
        >
          {options.length === 0 ? (
            <MenuItem value="" disabled>
              No templates
            </MenuItem>
          ) : (
            options.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.name || "Untitled template"}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>
      {isLoadingTemplate && (
        <Typography variant="caption" color="text.secondary">
          Loading...
        </Typography>
      )}
      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}
    </Box>
  );
}

const mapDefinitionsToQuestions = (
  definitions: TemplateMetaDefinition[]
): QuestionField[] =>
  definitions.map((definition) => {
    const fieldType = ["text", "select", "switch", "checkbox"].includes(
      definition.fieldType
    )
      ? (definition.fieldType as QuestionField["type"])
      : "text";
    const fallbackId =
      definition.id ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2));
    return {
      id: fallbackId,
      type: fieldType,
      label: definition.label || "",
      required: Boolean(definition.required),
      options:
        fieldType === "select"
          ? (definition.config?.options as string[]) || []
          : undefined,
      optionsInput:
        fieldType === "select"
          ? ((definition.config?.options as string[]) || []).join(", ")
          : "",
      fieldKey: definition.fieldKey,
    };
  });
