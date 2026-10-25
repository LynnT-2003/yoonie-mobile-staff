export class ApiError extends Error {
  readonly statusCode: number;
  readonly errorTitle?: string;
  readonly isAccountSuspended: boolean;

  constructor(params: {
    message: string;
    statusCode: number;
    errorTitle?: string;
    isAccountSuspended?: boolean;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.statusCode = params.statusCode;
    this.errorTitle = params.errorTitle;
    this.isAccountSuspended = params.isAccountSuspended ?? false;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function isAccountSuspendedMessage(message: unknown): boolean {
  if (typeof message !== "string") return false;
  const lower = message.toLowerCase();
  return lower.includes("account suspended") || lower.includes("account has been suspended");
}
