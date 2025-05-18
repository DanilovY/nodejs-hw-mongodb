import { initMongoConnection } from './bd/initMongoConnection.js';
import { setupServer } from './server.js';

const bootstrap = async () => {
  await initMongoConnection();
  setupServer();
};

bootstrap();
