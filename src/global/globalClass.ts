export class ResponseData<T> {
  constructor(
    public data: T,
    public statusCode: number,
    public message: string | string[],
  ) {}
}
