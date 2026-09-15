import { jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Post } from './entities/post.entity.js';
import { PostsService } from './posts.service.js';
import { CategoriesService } from '../categories/categories.service.js';
import { PostStatus, Role } from '../../global/globalEnum.js';
import { User } from '../users/entities/user.entity.js';

describe('PostsService', () => {
  let service: PostsService;
  let post: Post;
  const author = new User();
  author.id = 1;
  author.role = Role.USER;

  const postRepo = {
    findOne: jest.fn<() => Promise<Post | null>>(),
    create: jest.fn<(data: Partial<Post>) => Partial<Post>>(),
    save: jest.fn<(data: Partial<Post>) => Promise<Partial<Post>>>(),
    remove: jest.fn(),
  };
  const categoriesService = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    post = new Post();
    post.id = 1;
    post.authorId = author.id;
    post.status = PostStatus.DRAFT;
    postRepo.findOne.mockResolvedValue(post);
    postRepo.create.mockImplementation((data) => data);
    postRepo.save.mockImplementation(async (data) => data);

    const moduleRef = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(Post), useValue: postRepo },
        { provide: CategoriesService, useValue: categoriesService },
      ],
    }).compile();
    service = moduleRef.get(PostsService);
  });

  it('tạo bài nháp của người đang đăng nhập', async () => {
    const result = await service.create(author, {
      title: 'Bài đầu tiên',
      content: 'Nội dung bài viết đầu tiên',
      categoryId: 1,
    });
    expect(result).toMatchObject({ authorId: 1, status: PostStatus.DRAFT });
  });

  it('tác giả sửa tiêu đề và xuất bản bài', async () => {
    const result = await service.update(1, author, {
      title: 'Bài đã sửa',
      status: PostStatus.PUBLISHED,
    });
    expect(result.title).toBe('Bài đã sửa');
    expect(result.status).toBe(PostStatus.PUBLISHED);
    expect(postRepo.save).toHaveBeenCalledWith(post);
  });

  it('tác giả xóa bài', async () => {
    expect(await service.remove(1, author)).toEqual({ deleted: true });
    expect(postRepo.remove).toHaveBeenCalledWith(post);
  });

  it('người khác không được sửa bài', async () => {
    const other = new User();
    other.id = 2;
    other.role = Role.USER;
    await expect(
      service.update(1, other, { title: 'Tiêu đề khác' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(postRepo.save).not.toHaveBeenCalled();
  });

  it('khách không xem được bài nháp', async () => {
    await expect(service.findPublishedById(1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
