export type Uuid = string & { readonly __brand: "Uuid" };
export type HumanId = string & { readonly __brand: "HumanId" };
export type IsoDateTime = string & { readonly __brand: "IsoDateTime" };

export type Result<T, E extends Error = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E extends Error>(error: E): Result<never, E> => ({
  ok: false,
  error,
});

export class DomainError extends Error {
  public constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export interface DomainEvent<TPayload = unknown> {
  readonly id: Uuid;
  readonly type: string;
  readonly occurredAt: IsoDateTime;
  readonly payload: TPayload;
}
