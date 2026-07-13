/**
 * English. Typed as `Dictionary` (= the shape of the Italian file): a missing key, or one with
 * different parameters, is a compile error — a forgotten translation cannot reach production.
 */
import type { Dictionary } from './index'

export const en: Dictionary = {
  'errors.EMPTY_NAME': 'The exercise name is required',
  'errors.INVALID_YOUTUBE_LINK': 'Enter a valid YouTube link',
  'errors.FACE_BLUR_REQUIRED': 'Confirm that the face in the video is blurred',
  'errors.INVALID_STATURE_RANGE': 'The height range is not valid (100–250 cm)',
  'errors.INVALID_STATURE': 'Enter a height between 100 and 250 cm',
  'errors.INVALID_SET': 'Invalid set: at least 1 rep and a weight ≥ 0 are required',
  'errors.EXERCISE_NOT_FOUND': 'Exercise not found',
  'errors.EMPTY_PLAN_NAME': 'The plan name is required',
  'errors.PLAN_NOT_FOUND': 'Plan not found',
  'errors.EMPTY_DAY_NAME': 'The day name is required',
  'errors.DUPLICATE_DAY_NAME': 'This plan already has a day with this name',
  'errors.DAY_NOT_FOUND': 'Day not found in the plan',
  'errors.INVALID_TARGET': 'The target is not valid: at least 1 set and 1 rep are required',
  'errors.DUPLICATE_ENTRY': 'This exercise is already planned for this day',
  'errors.INVALID_JSON': 'The file does not contain valid JSON',
  'errors.INVALID_FORMAT': 'Unrecognised backup format',
  'errors.INVALID_SHARE_CODE': 'Invalid share code',
  'errors.STORAGE_FULL':
    'No space left on this device: export a backup, free some space and try again',
  'errors.DUPLICATE_EXERCISE': 'This video is already in the community catalogue',
  'errors.UNKNOWN_EXERCISE': 'Exercise not in the community catalogue',
  'errors.TOO_LONG': 'The text you entered is too long',
  'errors.COMMUNITY_UNREACHABLE': 'Community unreachable: try again later',
  'errors.INVALID_DATA': 'Invalid data',

  'community.proposalSent': 'Proposal sent to the community!',
  'community.localOnly': (p) => `Saved on this device only: ${p.reason}`,
}
