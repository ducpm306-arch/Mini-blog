import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
import { CategoriesService } from '../categories/categories.service.js';
import { PostStatus, Role } from '../../global/globalEnum.js';
import type { User } from '../users/entities/user.entity.js';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postRepo: Repository<Post>,
    private categoriesService: CategoriesService,
  ) {}

  async create(user: User, dto: CreatePostDto) {
    await this.categoriesService.findOne(dto.categoryId);
    const post = this.postRepo.create({
      title: dto.title,
      content: dto.content,
      categoryId: dto.categoryId,
      status: dto.status || PostStatus.DRAFT,
      authorId: user.id,
    });
    return this.postRepo.save(post);
  }

  findPublished() {
    return this.postRepo.find({
      where: { status: PostStatus.PUBLISHED },
      relations: ['category'],
    });
  }

  async findPublishedById(id: number) {
    const post = await this.findOne(id);
    if (post.status !== PostStatus.PUBLISHED) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }
    return post;
  }

  findMine(user: User) {
    return this.postRepo.find({
      where: { authorId: user.id },
      relations: ['category'],
    });
  }

  findAll() {
    return this.postRepo.find({ relations: ['category'] });
  }

  async findOne(id: number) {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }
    return post;
  }

  async findForManagement(id: number, user: User) {
    const post = await this.findOne(id);
    if (post.authorId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền quản lý bài viết này');
    }
    return post;
  }

  async update(id: number, user: User, dto: UpdatePostDto) {
    const post = await this.findForManagement(id, user);
    if (dto.title) {
      post.title = dto.title;
    }
    if (dto.content) {
      post.content = dto.content;
    }
    if (dto.status) {
      post.status = dto.status;
    }
    if (dto.categoryId) {
      post.category = await this.categoriesService.findOne(dto.categoryId);
      post.categoryId = dto.categoryId;
    }
    return this.postRepo.save(post);
  }

  async remove(id: number, user: User) {
    const post = await this.findForManagement(id, user);
    await this.postRepo.remove(post);
    return { deleted: true };
  }
}
