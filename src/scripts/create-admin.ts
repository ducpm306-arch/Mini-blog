import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { validate } from 'class-validator';
import { AppModule } from '../app.module.js';
import { RegisterDto } from '../dto/auth.dto.js';
import { UsersService } from '../modules/users/users.service.js';

async function createAdmin() {
  const dto = new RegisterDto();
  dto.username = process.env.ADMIN_USERNAME || '';
  dto.password = process.env.ADMIN_PASSWORD || '';
  const errors = await validate(dto);
  if (errors.length > 0) {
    throw new Error(
      'Đặt ADMIN_USERNAME từ 3 đến 30 ký tự và ADMIN_PASSWORD ít nhất 6 ký tự',
    );
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  });
  try {
    const usersService = app.get(UsersService);
    const admin = await usersService.createInitialAdmin(
      dto.username,
      dto.password,
    );
    console.log(`Đã tạo admin: ${admin.username}`);
  } finally {
    await app.close();
  }
}

createAdmin().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
});
