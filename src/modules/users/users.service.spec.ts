import { jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity.js';
import { UsersService } from './users.service.js';
import { Role } from '../../global/globalEnum.js';

describe('Tạo admin đầu tiên', () => {
  let service: UsersService;
  const userRepo = {
    findOneBy: jest.fn<() => Promise<User | null>>(),
    create: jest.fn<(data: Partial<User>) => Partial<User>>(),
    save: jest.fn<(data: Partial<User>) => Promise<Partial<User>>>(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    userRepo.create.mockImplementation((data) => data);
    userRepo.save.mockImplementation(async (data) => data);
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  it('tạo tài khoản admin với mật khẩu đã hash', async () => {
    const admin = new User();
    admin.id = 1;
    admin.username = 'admin';
    admin.role = Role.ADMIN;
    userRepo.findOneBy.mockResolvedValueOnce(null);
    userRepo.findOneBy.mockResolvedValueOnce(null);
    userRepo.findOneBy.mockResolvedValueOnce(admin);
    userRepo.save.mockImplementation(async (data) => {
      data.id = 1;
      return data;
    });

    const result = await service.createInitialAdmin('admin', 'BlogPassword123');
    const saved = userRepo.save.mock.calls[0][0];
    expect(saved.role).toBe(Role.ADMIN);
    expect(await bcrypt.compare('BlogPassword123', saved.password!)).toBe(true);
    expect(result).toBe(admin);
    expect(result.password).toBeUndefined();
  });

  it('không tạo thêm khi đã có admin', async () => {
    const admin = new User();
    admin.role = Role.ADMIN;
    userRepo.findOneBy.mockResolvedValue(admin);
    await expect(
      service.createInitialAdmin('another_admin', 'BlogPassword123'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(userRepo.save).not.toHaveBeenCalled();
  });

  it('không tự nâng quyền tài khoản trùng username', async () => {
    const user = new User();
    user.username = 'author';
    user.role = Role.USER;
    userRepo.findOneBy.mockResolvedValueOnce(null);
    userRepo.findOneBy.mockResolvedValueOnce(user);
    await expect(
      service.createInitialAdmin('author', 'BlogPassword123'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(user.role).toBe(Role.USER);
    expect(userRepo.save).not.toHaveBeenCalled();
  });
});
