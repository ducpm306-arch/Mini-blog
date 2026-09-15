import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { Role } from '../../global/globalEnum.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async createInitialAdmin(username: string, password: string) {
    const admin = await this.userRepo.findOneBy({ role: Role.ADMIN });
    if (admin) {
      throw new ConflictException(
        'Đã có admin. Hãy đăng nhập để quản lý người dùng qua API /users',
      );
    }
    return this.create({ username, password, role: Role.ADMIN });
  }

  async create(dto: CreateUserDto) {
    const existing = await this.userRepo.findOneBy({ username: dto.username });
    if (existing) {
      throw new ConflictException('Username đã tồn tại');
    }

    const password = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      username: dto.username,
      password,
      role: dto.role || Role.USER,
    });
    await this.userRepo.save(user);
    return this.findOne(user.id);
  }

  findAll() {
    return this.userRepo.find();
  }

  async findOne(id: number) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }

  findByUsername(username: string) {
    return this.userRepo.findOne({
      where: { username },
      select: ['id', 'username', 'password', 'role'],
    });
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.findOne(id);
    if (dto.username) {
      user.username = dto.username;
    }
    if (dto.role) {
      user.role = dto.role;
    }
    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, 10);
    }
    await this.userRepo.save(user);
    return this.findOne(id);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    await this.userRepo.remove(user);
    return { deleted: true };
  }
}
