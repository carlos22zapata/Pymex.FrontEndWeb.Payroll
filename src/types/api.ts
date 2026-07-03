export interface ApiResult<T> {
  isSuccess: boolean;
  value: T | null;
  errorMessage: string | null;
}
