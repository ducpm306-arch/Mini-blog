import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema implements MigrationInterface {
  name = 'InitialSchema1789257600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id int NOT NULL AUTO_INCREMENT,
        username varchar(30) NOT NULL,
        password varchar(255) NOT NULL,
        role enum('user', 'admin') NOT NULL DEFAULT 'user',
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY UQ_users_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE categories (
        id int NOT NULL AUTO_INCREMENT,
        name varchar(100) NOT NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY UQ_categories_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE posts (
        id int NOT NULL AUTO_INCREMENT,
        title varchar(200) NOT NULL,
        content mediumtext NOT NULL,
        status enum('draft', 'published') NOT NULL DEFAULT 'draft',
        authorId int NOT NULL,
        categoryId int NOT NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        INDEX IDX_posts_status_id (status, id),
        CONSTRAINT FK_posts_author FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE RESTRICT,
        CONSTRAINT FK_posts_category FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE posts');
    await queryRunner.query('DROP TABLE categories');
    await queryRunner.query('DROP TABLE users');
  }
}
