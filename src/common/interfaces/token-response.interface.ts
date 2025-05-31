import { TokenType } from '../enums/token-type.enum';

export type UserTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: TokenType;
};
