/**
 * Get avatar URL based on gender
 * Female avatars: 1, 2, 3, 4, 5, 7, 8, 11, 13, 14, 16, 17, 22, 25
 * Male avatars: 6, 9, 10, 12, 15, 18, 19, 20, 21, 23, 24
 */

const FEMALE_AVATARS = [1, 2, 3, 4, 5, 7, 8, 11, 13, 14, 16, 17, 22, 25];
const MALE_AVATARS = [6, 9, 10, 12, 15, 18, 19, 20, 21, 23, 24];
const ALL_AVATARS = [...FEMALE_AVATARS, ...MALE_AVATARS].sort((a, b) => a - b);

type Gender = 'male' | 'female' | null | undefined;

/**
 * Get avatar URL based on gender and optional ID for deterministic selection
 * @param gender - Gender of the user ('male', 'female', or null/undefined)
 * @param id - Optional ID for deterministic avatar selection when gender is not available
 * @returns Avatar URL path
 */
export function getAvatarUrl(gender?: Gender, id?: string | number | bigint): string {
  let avatarNumber: number;

  if (gender === 'female') {
    // Use ID to deterministically select from female avatars
    if (id !== undefined) {
      const numericId = typeof id === 'bigint' ? Number(id) : typeof id === 'string' ? parseInt(id, 10) || 0 : id;
      avatarNumber = FEMALE_AVATARS[numericId % FEMALE_AVATARS.length];
    } else {
      // Random selection if no ID provided
      avatarNumber = FEMALE_AVATARS[Math.floor(Math.random() * FEMALE_AVATARS.length)];
    }
  } else if (gender === 'male') {
    // Use ID to deterministically select from male avatars
    if (id !== undefined) {
      const numericId = typeof id === 'bigint' ? Number(id) : typeof id === 'string' ? parseInt(id, 10) || 0 : id;
      avatarNumber = MALE_AVATARS[numericId % MALE_AVATARS.length];
    } else {
      // Random selection if no ID provided
      avatarNumber = MALE_AVATARS[Math.floor(Math.random() * MALE_AVATARS.length)];
    }
  } else {
    // No gender specified - use deterministic selection from all avatars
    if (id !== undefined) {
      const numericId = typeof id === 'bigint' ? Number(id) : typeof id === 'string' ? parseInt(id, 10) || 0 : id;
      avatarNumber = ALL_AVATARS[numericId % ALL_AVATARS.length];
    } else {
      // Random selection if no ID provided
      avatarNumber = ALL_AVATARS[Math.floor(Math.random() * ALL_AVATARS.length)];
    }
  }

  return `/assets/images/avatar/avatar-${avatarNumber}.webp`;
}

