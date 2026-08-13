/**
 * Generates 2-letter uppercase initials from a name or username.
 * Examples:
 * - "Bhavik" -> "BH"
 * - "Talha" -> "TA"
 * - "Siddhi" -> "SI"
 * - "John Doe" -> "JD"
 * - "A" -> "A"
 */
export function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'US';
  
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/);
  
  if (parts.length >= 2) {
    const first = parts[0][0] || '';
    const last = parts[parts.length - 1][0] || '';
    return (first + last).toUpperCase();
  }
  
  // Single word: take first 2 letters if available
  if (trimmed.length >= 2) {
    return trimmed.substring(0, 2).toUpperCase();
  }
  
  return trimmed.substring(0, 1).toUpperCase();
}

/**
 * Deterministically picks a pleasant accent color for the avatar background
 */
export function getAvatarColor(name?: string | null): string {
  const colors = [
    'bg-blue-600 text-white border-blue-700',
    'bg-indigo-600 text-white border-indigo-700',
    'bg-slate-700 text-white border-slate-800',
    'bg-emerald-600 text-white border-emerald-700',
    'bg-teal-600 text-white border-teal-700',
    'bg-violet-600 text-white border-violet-700',
  ];
  
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
