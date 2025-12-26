import type { LabelColor } from 'src/components/label/types';

// ----------------------------------------------------------------------

/**
 * Normalize combination string to handle both enum format and mapped format
 */
export function normalizeCombination(combination?: string | null): string | null {
  if (!combination) return null;
  
  // If it already has dashes, return as is
  if (combination.includes('-')) {
    return combination.toLowerCase().trim();
  }
  
  // Convert camelCase enum to mapped format
  // Example: "MathematicsPhysicsComputerScience" -> "mathematics-physics-computer science"
  const words = combination.split(/(?=[A-Z])/);
  const formattedWords: string[] = [];
  
  for (let i = 0; i < words.length; i++) {
    const currentWord = words[i];
    const nextWord = words[i + 1];
    
    // Handle "ComputerScience" -> "Computer Science"
    if (currentWord === 'Computer' && nextWord === 'Science') {
      formattedWords.push('Computer Science');
      i++; // Skip next word
    } else {
      formattedWords.push(currentWord);
    }
  }
  
  return formattedWords.join('-').toLowerCase().trim();
}

/**
 * Format combination for display (with dashes and proper capitalization)
 */
export function formatCombination(combination?: string | null): string | null {
  if (!combination) return null;
  
  // If it already has dashes, return as is
  if (combination.includes('-')) {
    return combination;
  }
  
  // Convert camelCase enum to mapped format
  const words = combination.split(/(?=[A-Z])/);
  const formattedWords: string[] = [];
  
  for (let i = 0; i < words.length; i++) {
    const currentWord = words[i];
    const nextWord = words[i + 1];
    
    // Handle "ComputerScience" -> "Computer Science"
    if (currentWord === 'Computer' && nextWord === 'Science') {
      formattedWords.push('Computer Science');
      i++; // Skip next word
    } else {
      formattedWords.push(currentWord);
    }
  }
  
  return formattedWords.join('-');
}

/**
 * Get unique color for grade badge
 * Grades: error, warning, info, secondary (4 unique colors)
 */
export function getGradeColor(grade?: string): LabelColor {
  if (!grade || grade === '-') return 'info';
  
  const gradeLower = grade.toLowerCase();
  
  // Assign unique colors to each grade
  if (gradeLower.includes('enrichment')) return 'error';
  if (gradeLower.includes('senior 4')) return 'warning';
  if (gradeLower.includes('senior 5')) return 'info';
  if (gradeLower.includes('senior 6')) return 'secondary';
  
  return 'info';
}

/**
 * Get unique color for combination badge
 * Combinations: Each of the 8 combinations gets a unique color assignment
 * Using only non-red/orange colors: primary, success, default, info, secondary
 * Avoiding error (red) and warning (orange) colors
 * Grades use: error, warning, info, secondary (4 colors)
 * Combinations use: primary, success, default, info, secondary (5 colors, distributed across 8 combinations)
 * Note: The 'soft' variant already uses lighter colors, so we get the lighter appearance automatically
 */
export function getCombinationColor(combination?: string | null): LabelColor {
  if (!combination) return 'primary';
  
  const normalized = normalizeCombination(combination);
  if (!normalized) return 'primary';
  
  // Map each of the 8 combinations to use only non-red/orange colors
  // Available colors: primary, success, default, info, secondary (5 colors)
  // Since we have 8 combinations and 5 colors, we'll reuse colors strategically
  // Ensuring similar combinations (e.g., both starting with "Mathematics-Physics") get different colors
  const combinationColorMap: Record<string, LabelColor> = {
    'mathematics-physics-computer science': 'primary',
    'history-geography-literature-psychology': 'success',
    'mathematics-physics-geography-economics': 'default',
    'mathematics-physics-chemistry-biology': 'info',
    'mathematics-economics-geography': 'secondary',
    'mathematics-computer science-economics': 'primary', // Reusing primary, but different from MPC
    'physics-chemistry-biology': 'success', // Reusing success, but different from HGLP
    'history-geography-literature': 'info', // Reusing info, but different from MPCB
  };
  
  // Check exact match first
  if (combinationColorMap[normalized]) {
    return combinationColorMap[normalized];
  }
  
  // Fallback: use hash-based assignment for any unmapped combinations
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
    hash = hash & hash;
  }
  
  // Distribute across only non-red/orange colors
  const colors: LabelColor[] = ['primary', 'success', 'default', 'info', 'secondary'];
  return colors[Math.abs(hash) % colors.length];
}

