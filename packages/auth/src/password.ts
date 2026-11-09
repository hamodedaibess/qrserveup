import bcrypt from 'bcryptjs';

// bcryptjs cost=12 (يكافئ Argon2id في هذه المرحلة، مع خطة ترحيل لـ Phase 10)
// راجع ADR-008
const BCRYPT_COST = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}
