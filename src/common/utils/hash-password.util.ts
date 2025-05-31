import * as process from 'node:process';

import { hashSync } from 'bcrypt';

export function hashPassword(password: string): string {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);

  return hashSync(password, saltRounds);
}
