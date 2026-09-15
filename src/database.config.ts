import type { DataSourceOptions } from 'typeorm';
import { User } from './modules/users/entities/user.entity.js';
import { Category } from './modules/categories/entities/category.entity.js';
import { Post } from './modules/posts/entities/post.entity.js';
import { InitialSchema } from './migrations/initial-schema.js';

export function databaseConfig(): DataSourceOptions {
  return {
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [User, Category, Post],
    migrations: [InitialSchema],
    synchronize: false,
    migrationsRun: true,
  };
}
