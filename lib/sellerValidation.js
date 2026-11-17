/**
 * Standard Indian Validation Helpers for Seller Onboarding & Profile Verification
 * (Feature 8)
 */

export const PHONE_REGEX = /^[6-9]\d{9}$/;
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const PINCODE_REGEX = /^[1-9]\d{5}$/;
export const BANK_ACC_REGEX = /^\d{9,18}$/;
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const FSSAI_REGEX = /^\d{14}$/;

// Food categories that legally require FSSAI registration in India
export const FOOD_CATEGORIES = ['snacks', 'sweets', 'groceries', 'food', 'vegetables', 'fruits'];

export function isFoodCategory(cat) {
  if (!cat) return false;
  const lower = String(cat).toLowerCase();
  return FOOD_CATEGORIES.some((fc) => lower.includes(fc));
}

export function validatePhone(phone) {
  if (!phone) return 'Phone number is required.';
  const clean = String(phone).replace(/\s+/g, '').replace(/^(\+91|91)/, '');
  if (!/^\d+$/.test(clean)) return 'Phone number must contain only numeric digits.';
  if (clean.length !== 10) return 'Phone number must be exactly 10 digits.';
  if (!/^[6-9]/.test(clean)) return 'Phone number must start with 6, 7, 8, or 9 (Indian mobile format).';
  return null;
}

export function validateGSTIN(gstin) {
  if (!gstin) return null; // GST may be optional for micro-sellers unless specified
  const clean = String(gstin).trim().toUpperCase();
  if (clean.length !== 15) return 'GSTIN must be exactly 15 characters.';
  if (!GSTIN_REGEX.test(clean)) {
    return 'Invalid GSTIN format. Expected format: 22AAAAA0000A1Z5.';
  }
  const stateCode = parseInt(clean.substring(0, 2), 10);
  if (isNaN(stateCode) || stateCode < 1 || stateCode > 38) {
    return 'Invalid GSTIN state code. First 2 digits must be between 01 and 38.';
  }
  return null;
}

export function validatePincode(pincode) {
  if (!pincode) return 'Pincode is required.';
  const clean = String(pincode).trim();
  if (clean.length !== 6) return 'Postal pincode must be exactly 6 digits.';
  if (!PINCODE_REGEX.test(clean)) {
    return 'Invalid pincode. Must be 6 digits and cannot start with 0.';
  }
  return null;
}

export function validateBankAccount(accountNumber, confirmAccountNumber) {
  if (!accountNumber) return 'Bank account number is required.';
  const clean = String(accountNumber).trim();
  if (!BANK_ACC_REGEX.test(clean)) {
    return 'Bank account number must be between 9 and 18 numeric digits.';
  }
  if (confirmAccountNumber !== undefined) {
    const confirmClean = String(confirmAccountNumber).trim();
    if (clean !== confirmClean) {
      return 'Account number and confirmation account number do not match.';
    }
  }
  return null;
}

export function validateIFSC(ifsc) {
  if (!ifsc) return 'Bank IFSC code is required.';
  const clean = String(ifsc).trim().toUpperCase();
  if (clean.length !== 11) return 'IFSC code must be exactly 11 characters.';
  if (!IFSC_REGEX.test(clean)) {
    return 'Invalid IFSC format (e.g. HDFC0001234). 4 letters, 5th character must be 0, followed by 6 alphanumeric characters.';
  }
  return null;
}

export function validateFSSAI(fssai, category) {
  const requiresFSSAI = isFoodCategory(category);
  const clean = String(fssai || '').trim();

  if (requiresFSSAI && !clean) {
    return 'FSSAI License number is mandatory for Food, Snacks, Sweets, and Grocery merchants.';
  }
  if (clean && !FSSAI_REGEX.test(clean)) {
    return 'FSSAI License number must be exactly 14 numeric digits.';
  }
  return null;
}
