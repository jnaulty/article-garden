/**
 * Form validation utilities
 */

import { UI } from "../config/constants";

export function validatePublicationName(name: string): string | null {
  if (name.length < UI.MIN_PUBLICATION_NAME_LENGTH) {
    return `Name must be at least ${UI.MIN_PUBLICATION_NAME_LENGTH} characters`;
  }
  if (name.length > UI.MAX_PUBLICATION_NAME_LENGTH) {
    return `Name must be less than ${UI.MAX_PUBLICATION_NAME_LENGTH} characters`;
  }
  if (name.trim() !== name) {
    return "Name cannot start or end with whitespace";
  }
  return null;
}

export function validateDescription(desc: string): string | null {
  if (desc.length < UI.MIN_DESCRIPTION_LENGTH) {
    return `Description must be at least ${UI.MIN_DESCRIPTION_LENGTH} characters`;
  }
  if (desc.length > UI.MAX_DESCRIPTION_LENGTH) {
    return `Description must be less than ${UI.MAX_DESCRIPTION_LENGTH} characters`;
  }
  return null;
}

export function validatePricing(basic: number, premium: number): string | null {
  if (basic < 0 || premium < 0) {
    return "Prices must be positive";
  }
  if (premium < basic) {
    return "Premium price must be greater than or equal to Basic price";
  }
  if (basic === 0 && premium === 0) {
    return "At least one tier must have a price";
  }
  return null;
}

export function validateArticleTitle(title: string): string | null {
  if (title.length < UI.MIN_ARTICLE_TITLE_LENGTH) {
    return "Title is required";
  }
  if (title.length > UI.MAX_ARTICLE_TITLE_LENGTH) {
    return `Title must be less than ${UI.MAX_ARTICLE_TITLE_LENGTH} characters`;
  }
  if (title.trim() !== title) {
    return "Title cannot start or end with whitespace";
  }
  return null;
}

export function validateExcerpt(excerpt: string): string | null {
  if (excerpt.length > UI.MAX_EXCERPT_LENGTH) {
    return `Excerpt must be less than ${UI.MAX_EXCERPT_LENGTH} characters`;
  }
  return null;
}

export function validateWalrusId(blobId: string): string | null {
  if (blobId.length === 0) {
    return "Walrus blob ID is required";
  }
  // Basic validation - could be more specific based on Walrus ID format
  if (blobId.trim() !== blobId) {
    return "Blob ID cannot contain whitespace";
  }
  return null;
}

export function validateSuiAddress(address: string): string | null {
  if (!address.startsWith("0x")) {
    return "Address must start with 0x";
  }
  if (address.length !== 66) {
    return "Address must be 66 characters (including 0x)";
  }
  // Check if it's a valid hex string
  const hexPart = address.slice(2);
  if (!/^[0-9a-fA-F]+$/.test(hexPart)) {
    return "Address must contain only hexadecimal characters";
  }
  return null;
}
