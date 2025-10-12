import { TemplateData, FieldDefinition } from '../components3col/types';

export const validateFieldData = (field: FieldDefinition,  data: TemplateData): boolean => {
  const value = data[field.field_id];
  
  if (field.visibility) {
    // Handle conditional visibility logic here
    // For now, always return true
    return true;
  }
  
  // Add more validation logic as needed
  return true;
};
