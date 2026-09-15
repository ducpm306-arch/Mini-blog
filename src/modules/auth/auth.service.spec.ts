import { jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { Role } from '../../global/globalEnum.js';

describe('AuthService', () => {
  let service: AuthService;
  const usersService = {
    create: jest.fn(),
    findByUsername: jest.fn<UsersService['findByUsername']>(),
  };
  const jwtService = { sign: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('đăng ký tài khoản user', async () => {
    await service.register({
      username: 'learner',
      password: 'BlogPassword123',
    });
    expect(usersService.create).toHaveBeenCalledWith({
      username: 'learner',
      password: 'BlogPassword123',
      role: Role.USER,
    });
  });

  it('đăng nhập đúng trả về JWT', async () => {
    usersService.findByUsername.mockResolvedValue({
      id: 1,
      username: 'learner',
      password: await bcrypt.hash('BlogPassword123', 10),
      role: Role.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jwtService.sign.mockReturnValue('signed-token');
    const result = await service.login({
      username: 'learner',
      password: 'BlogPassword123',
    });
    expect(result).toEqual({ access_token: 'signed-token' });
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 1,
      username: 'learner',
      role: Role.USER,
    });
  });

  it('tài khoản không tồn tại trả lỗi', async () => {
    usersService.findByUsername.mockResolvedValue(null);
    await expect(
      service.login({ username: 'missing', password: 'BlogPassword123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('mật khẩu sai trả lỗi', async () => {
    usersService.findByUsername.mockResolvedValue({
      id: 1,
      username: 'learner',
      password: await bcrypt.hash('BlogPassword123', 10),
      role: Role.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await expect(
      service.login({ username: 'learner', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwtService.sign).not.toHaveBeenCalled();
  });
});
