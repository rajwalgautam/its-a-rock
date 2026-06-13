import { parseGrade } from '@/utils/gradeUtils';
import type { RouteInput } from '@/types';

export type RouteInputField = 'gymName' | 'grade' | 'dates';

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<RouteInputField, string>>;
}

/**
 * Validate a RouteInput. Per the blueprint, every field is optional except the
 * gym — a route must belong to a gym/location. A provided grade must be a valid
 * V-scale grade, and if both dates are present the start can't be after the end.
 */
export function validateRouteInput(input: RouteInput): ValidationResult {
  const errors: ValidationResult['errors'] = {};

  if (input.gymName.trim().length === 0) {
    errors.gymName = 'A gym or location is required.';
  }

  if (
    input.grade !== null &&
    input.grade !== undefined &&
    input.grade.trim().length > 0 &&
    parseGrade(input.grade) === null
  ) {
    errors.grade = 'Not a valid V-scale grade.';
  }

  if (
    input.startedAt !== null &&
    input.startedAt !== undefined &&
    input.completedAt !== null &&
    input.completedAt !== undefined &&
    input.startedAt > input.completedAt
  ) {
    errors.dates = 'Start date cannot be after the send date.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
