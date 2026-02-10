export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Email is required";
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(trimmed)) return "Enter a valid email";
  return null;
}

export function validatePhone(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Phone is required";
  const digits = trimmed.replace(/[^\d]/g, "");
  if (digits.length < 6) return "Enter a valid phone number";
  return null;
}

export function validateRequired(value: string, label: string): string | null {
  return value.trim() ? null : `${label} is required`;
}
