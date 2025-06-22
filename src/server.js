import * as fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import pino from 'pino-http';
import { getEnvVar } from './utils/getEnvVar.js';
import router from './routers/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import cookieParser from 'cookie-parser';
import swaggerUI from 'swagger-ui-express';

const SWAGGER_DOCS = JSON.parse(
  fs.readFileSync(path.join('docs', 'swagger.json'), 'utf-8'),
);

export const setupServer = () => {
  const app = express();
  const PORT = Number(getEnvVar('PORT', 3000));

  app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(SWAGGER_DOCS));
  app.use(
    '/avatars',
    express.static(path.resolve('src', 'uploads', 'avatars')),
  );

  app.use(cors());
  app.use(cookieParser());

  app.use(
    pino({
      transport: {
        target: 'pino-pretty',
      },
    }),
  );
  app.get('/', (req, res) => {
    res.json({ message: 'API is running' });
  });

  app.use(router);

  app.use('*eny', notFoundHandler);

  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};
