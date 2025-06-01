import { Prisma } from '@prisma/client';

export type UserWithProfile = Prisma.UserGetPayload<{
  select: {
    first_name: true;
    last_name: true;
    profile: { omit: { id: true; user_id: true; updated_at: true; created_at: true } };
  };
}>;

export type UserWithHealth = Prisma.UserGetPayload<{
  select: {
    first_name: true;
    last_name: true;
    health: { omit: { id: true; user_id: true; updated_at: true; created_at: true } };
  };
}>;
