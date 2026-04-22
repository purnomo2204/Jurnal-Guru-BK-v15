
export const validateRequired = (value: any): boolean => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

export const validateMinLength = (value: string, min: number): boolean => {
  return value.trim().length >= min;
};

export const validateMaxLength = (value: string, max: number): boolean => {
  return value.trim().length <= max;
};

export const validateNumeric = (value: string): boolean => {
  return /^\d+$/.test(value);
};

export const validateEmail = (value: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(value);
};

export const validatePhone = (value: string): boolean => {
  // Simple phone validation: starts with 0 or +, followed by 9-13 digits
  const re = /^(0|\+62|62)[0-9]{9,13}$/;
  return re.test(value.replace(/\s/g, ''));
};

export const validateDateNotFuture = (value: string): boolean => {
  if (!value) return true;
  const date = new Date(value);
  const now = new Date();
  return date <= now;
};

export const validateNIS = (value: string): boolean => {
  // NIS usually 10 digits, but can vary. Let's assume 4-15 digits for flexibility
  return /^\d{4,15}$/.test(value);
};

export const validateNISN = (value: string): boolean => {
  // NISN is exactly 10 digits
  return /^\d{10}$/.test(value);
};

export interface ValidationError {
  field: string;
  message: string;
}

export const validateForm = (data: any, rules: Record<string, ((val: any) => string | null)[]>): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  for (const field in rules) {
    const fieldRules = rules[field];
    for (const rule of fieldRules) {
      const error = rule(data[field]);
      if (error) {
        errors.push({ field, message: error });
        break; // Only show one error per field
      }
    }
  }
  
  return errors;
};
