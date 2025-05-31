export interface IAPPError {
  code: string;
  type: string;
  message: string;
}

export interface IValidationErrorDetail {
  type: string;
  path: string[];
  message: string;
}

export interface IValidationError extends IAPPError {
  details: IValidationErrorDetail[];
}

export interface IAppErrorResponse {
  error: IAPPError;
}

export interface IValidationErrorResponse {
  error: IValidationError;
}
