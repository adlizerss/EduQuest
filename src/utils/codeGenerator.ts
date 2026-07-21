/**
 * Generates a unique 6-character uppercase code prefixed with 'EQ-' (e.g. EQ-8F2K9L)
 * ensuring it is collision-free against all existing student codes.
 */
export function generateUniqueCode(existingStudents: { nis?: string }[]): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const existingSet = new Set(
    existingStudents
      .map(s => s.nis?.trim().toUpperCase())
      .filter((n): n is string => Boolean(n))
  );

  let isUnique = false;
  let code = '';

  while (!isUnique) {
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code = `EQ-${randomPart}`;
    if (!existingSet.has(code)) {
      isUnique = true;
    }
  }

  return code;
}
