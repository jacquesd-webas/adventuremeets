export type MetaValue = {
  definitionId: string;
  label: string;
  fieldType: string;
  required: boolean;
  position: number;
  config?: Record<string, any>;
  value: string | null;
};
