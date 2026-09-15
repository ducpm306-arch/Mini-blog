import { Test } from '@nestjs/testing';
import { execFileSync } from 'node:child_process';
import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { setupApp } from '../src/app.setup.js';
import { Role } from '../src/global/globalEnum.js';
import { User } from '../src/modules/users/entities/user.entity.js';

describe('Mini Blog API (MySQL)', () => {
  let app: INestApplication;
  let db: DataSource;
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    if (
      process.env.NODE_ENV !== 'test' ||
      process.env.DB_NAME !== 'mini_blog_test'
    ) {
      throw new Error('E2E cần NODE_ENV=test và DB_NAME=mini_blog_test');
    }
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    db = app.get(DataSource);

    await db.query('DELETE FROM posts');
    await db.query('DELETE FROM categories');
    await db.query('DELETE FROM users');

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: 'author', password: 'BlogPassword123' })
      .expect(201);
    execFileSync(process.execPath, ['dist/scripts/create-admin.js'], {
      env: {
        ...process.env,
        ADMIN_USERNAME: 'admin',
        ADMIN_PASSWORD: 'BlogPassword123',
      },
      timeout: 20000,
      stdio: 'pipe',
    });

    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'author', password: 'BlogPassword123' })
      .expect(200);
    userToken = userLogin.body.data.access_token;
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'BlogPassword123' })
      .expect(200);
    adminToken = adminLogin.body.data.access_token;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('API kết nối được MySQL', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    expect(response.body.data.status).toBe('ok');
  });

  it('đăng nhập rồi xem tài khoản', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .auth(userToken, { type: 'bearer' })
      .expect(200);
    expect(response.body.data.username).toBe('author');
    expect(response.body.data).not.toHaveProperty('password');
  });

  it('validation báo lỗi khi nhập thiếu dữ liệu', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: 'a', password: '123' })
      .expect(400);
  });

  it('JWT và role bảo vệ trang quản lý users', async () => {
    await request(app.getHttpServer()).get('/users').expect(401);
    await request(app.getHttpServer())
      .get('/users')
      .auth(userToken, { type: 'bearer' })
      .expect(403);
  });

  it('admin thêm, xem, sửa và xóa user', async () => {
    const created = await request(app.getHttpServer())
      .post('/users')
      .auth(adminToken, { type: 'bearer' })
      .send({ username: 'new_user', password: 'BlogPassword123' })
      .expect(201);
    const id = created.body.data.id;
    expect(created.body.data).not.toHaveProperty('password');

    const list = await request(app.getHttpServer())
      .get('/users')
      .auth(adminToken, { type: 'bearer' })
      .expect(200);
    expect(list.body.data.some((user: User) => user.id === id)).toBe(true);
    await request(app.getHttpServer())
      .get(`/users/${id}`)
      .auth(adminToken, { type: 'bearer' })
      .expect(200);

    const updated = await request(app.getHttpServer())
      .patch(`/users/${id}`)
      .auth(adminToken, { type: 'bearer' })
      .send({ username: 'updated_user', password: 'ChangedPassword123' })
      .expect(200);
    expect(updated.body.data.username).toBe('updated_user');
    expect(updated.body.data).not.toHaveProperty('password');
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'updated_user', password: 'ChangedPassword123' })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/users/${id}`)
      .auth(adminToken, { type: 'bearer' })
      .expect(200);
    await request(app.getHttpServer())
      .get(`/users/${id}`)
      .auth(adminToken, { type: 'bearer' })
      .expect(404);
  });

  it('admin cấp quyền quản trị cho user qua API', async () => {
    const registered = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: 'second_admin', password: 'BlogPassword123' })
      .expect(201);
    const id = registered.body.data.id;
    expect(registered.body.data.role).toBe(Role.USER);

    await request(app.getHttpServer())
      .patch(`/users/${id}`)
      .auth(userToken, { type: 'bearer' })
      .send({ role: Role.ADMIN })
      .expect(403);
    const promoted = await request(app.getHttpServer())
      .patch(`/users/${id}`)
      .auth(adminToken, { type: 'bearer' })
      .send({ role: Role.ADMIN })
      .expect(200);
    expect(promoted.body.data.role).toBe(Role.ADMIN);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'second_admin', password: 'BlogPassword123' })
      .expect(200);
    await request(app.getHttpServer())
      .get('/users')
      .auth(login.body.data.access_token, { type: 'bearer' })
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/users/${id}`)
      .auth(adminToken, { type: 'bearer' })
      .expect(200);
  });

  it('admin thêm, xem, sửa và xóa danh mục', async () => {
    const created = await request(app.getHttpServer())
      .post('/categories')
      .auth(adminToken, { type: 'bearer' })
      .send({ name: 'Thực hành' })
      .expect(201);
    const id = created.body.data.id;
    const list = await request(app.getHttpServer())
      .get('/categories')
      .expect(200);
    expect(list.body.data).toHaveLength(1);
    await request(app.getHttpServer()).get(`/categories/${id}`).expect(200);

    const updated = await request(app.getHttpServer())
      .patch(`/categories/${id}`)
      .auth(adminToken, { type: 'bearer' })
      .send({ name: 'Nhật ký' })
      .expect(200);
    expect(updated.body.data.name).toBe('Nhật ký');
    await request(app.getHttpServer())
      .delete(`/categories/${id}`)
      .auth(adminToken, { type: 'bearer' })
      .expect(200);
    await request(app.getHttpServer()).get(`/categories/${id}`).expect(404);
  });

  it('user tạo danh mục, viết bài, xuất bản rồi xóa bài', async () => {
    const category = await request(app.getHttpServer())
      .post('/categories')
      .auth(userToken, { type: 'bearer' })
      .send({ name: 'Học NestJS' })
      .expect(201);
    const created = await request(app.getHttpServer())
      .post('/posts')
      .auth(userToken, { type: 'bearer' })
      .send({
        title: 'Ngày đầu học NestJS',
        content: 'Mình thực hành module, controller và service.',
        categoryId: category.body.data.id,
      })
      .expect(201);
    const id = created.body.data.id;
    expect(created.body.data.status).toBe('draft');
    await request(app.getHttpServer()).get(`/posts/${id}`).expect(404);

    const mine = await request(app.getHttpServer())
      .get('/posts/my')
      .auth(userToken, { type: 'bearer' })
      .expect(200);
    expect(mine.body.data).toHaveLength(1);
    await request(app.getHttpServer())
      .get(`/posts/${id}/manage`)
      .auth(userToken, { type: 'bearer' })
      .expect(200);

    const newCategory = await request(app.getHttpServer())
      .post('/categories')
      .auth(userToken, { type: 'bearer' })
      .send({ name: 'Bài đã học' })
      .expect(201);
    const updated = await request(app.getHttpServer())
      .patch(`/posts/${id}`)
      .auth(userToken, { type: 'bearer' })
      .send({
        title: 'Bài đã sửa',
        status: 'published',
        categoryId: newCategory.body.data.id,
      })
      .expect(200);
    expect(updated.body.data.title).toBe('Bài đã sửa');
    const detail = await request(app.getHttpServer())
      .get(`/posts/${id}`)
      .expect(200);
    expect(detail.body.data.category.id).toBe(newCategory.body.data.id);
    const published = await request(app.getHttpServer())
      .get('/posts')
      .expect(200);
    expect(published.body.data).toHaveLength(1);

    const all = await request(app.getHttpServer())
      .get('/posts/all')
      .auth(adminToken, { type: 'bearer' })
      .expect(200);
    expect(all.body.data).toHaveLength(1);
    await request(app.getHttpServer())
      .delete(`/posts/${id}`)
      .auth(userToken, { type: 'bearer' })
      .expect(200);
    await request(app.getHttpServer()).get(`/posts/${id}`).expect(404);
  });
});
