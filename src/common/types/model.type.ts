import { User } from '@prisma/client';

export type OmittedUser = Omit<User, 'status' | 'password'>;
