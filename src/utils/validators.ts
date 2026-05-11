import {
  ATTEMPTS_MAX,
  ATTEMPTS_MIN,
  GYM_NAME_MAX_LENGTH,
  NOTES_MAX_LENGTH,
  ROUTE_NAME_MAX_LENGTH,
  TAGS_MAX_SELECTED,
} from '@/constants/limits';
import { ROUTE_TAGS } from '@/constants/tags';
import { ROUTE_GRADES } from '@/constants/grades';
import { RouteInput } from '@/types';
import { formatGymName } from './gymUtils';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateRouteInput(input: RouteInput): ValidationResult {
  const errors: Record<string, string> = {};
  const name = input.name.trim();
  const gymName = formatGymName(input.gymName);

  if (name.length === 0) {
    errors.name = 'Route name is required.';
  } else if (name.length > ROUTE_NAME_MAX_LENGTH) {
    errors.name = `Route name must be ${ROUTE_NAME_MAX_LENGTH} characters or fewer.`;
  }

  if (gymName.length === 0) {
    errors.gymName = 'Gym is required.';
  } else if (gymName.length > GYM_NAME_MAX_LENGTH) {
    errors.gymName = `Gym must be ${GYM_NAME_MAX_LENGTH} characters or fewer.`;
  }

  if (!Number.isInteger(input.attempts) || input.attempts < ATTEMPTS_MIN || input.attempts > ATTEMPTS_MAX) {
    errors.attempts = `Attempts must be between ${ATTEMPTS_MIN} and ${ATTEMPTS_MAX}.`;
  }

  if (!ROUTE_GRADES.includes(input.grade)) {
    errors.grade = 'Grade must be between VB and V9.';
  }

  if ((input.notes ?? '').length > NOTES_MAX_LENGTH) {
    errors.notes = `Notes must be ${NOTES_MAX_LENGTH} characters or fewer.`;
  }

  if (input.tagIds.length > TAGS_MAX_SELECTED) {
    errors.tagIds = `Choose up to ${TAGS_MAX_SELECTED} tags.`;
  } else if (input.tagIds.some((tagId) => ROUTE_TAGS[tagId] === undefined)) {
    errors.tagIds = 'Tags must be selected from the predefined list.';
  }

  if (!Number.isFinite(input.climbedAt)) {
    errors.climbedAt = 'Climbed date is invalid.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
