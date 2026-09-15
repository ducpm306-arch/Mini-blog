import 'dotenv/config';
import { DataSource } from 'typeorm';
import { databaseConfig } from './database.config.js';

export default new DataSource({ ...databaseConfig(), migrationsRun: false });
