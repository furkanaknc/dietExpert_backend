import { IAppErrorParams } from '../interfaces/app-error-params.interface';
import { IAppErrorResponse } from '../interfaces/app-error-response.interface';

export abstract class AppError extends Error {
  readonly code: string;
  readonly type: string;
  readonly statusCode: number;

  constructor(params: IAppErrorParams) {
    super(params.message);

    this.code = params.code;
    this.type = this.constructor.name;
    this.message = params.message;
    this.statusCode = params.statusCode;
  }

  toJSON(): IAppErrorResponse {
    return {
      error: {
        code: this.code,
        type: this.type,
        message: this.message,
      },
    };
  }
}
