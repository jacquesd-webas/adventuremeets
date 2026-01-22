export type Template = {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  metaDefinitions?: TemplateMetaDefinition[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type TemplateMetaDefinition = {
  id?: string;
  fieldKey: string;
  label: string;
  fieldType: string;
  required?: boolean;
  position?: number;
  config?: Record<string, any>;
};
