import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs';
import { ResponseData } from '../global/globalClass.js';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const response = context.switchToHttp().getResponse();
    return next
      .handle()
      .pipe(
        map(
          (data) => new ResponseData(data, response.statusCode, 'Thành công'),
        ),
      );
  }
}
