import { getEnvVar } from '../utils/getEnvVar.js';
import path from 'node:path';

export const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc',
};

export const FIFTEEN_MINUTES = 15 * 60 * 1000;
export const ONE_DAY = 24 * 60 * 60 * 1000;

export const SMTP = {
  SMTP_HOST: getEnvVar('SMTP_HOST'),
  SMTP_PORT: getEnvVar('SMTP_PORT'),
  SMTP_AUTH_USER: getEnvVar('SMTP_AUTH_USER'),
  SMTP_AUTH_PASSWORD: getEnvVar('SMTP_AUTH_PASSWORD'),
  SMTP_FROM: getEnvVar('SMTP_FROM'),
};

export const TEMPLATES_DIR = path.join(process.cwd(), 'src', 'templates');
export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
