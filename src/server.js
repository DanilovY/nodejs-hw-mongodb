import express from 'express';
import cors from 'cors';
import pino from 'pino-http';
import { getEnvVar } from './utils/getEnvVar.js';
import { getAllContacts, getContactById } from './services/contacts.js';

export const setupServer = () => {
  const app = express();
  const PORT = Number(getEnvVar('PORT'));

  app.use(cors());
  app.use(express.json());
  app.use(
    pino({
      transport: {
        target: 'pino-pretty',
      },
    }),
  );

  app.get('/contacts', async (req, res) => {
    const contactsList = await getAllContacts();

    res.json({
      status: 200,
      message: 'Successfully found contacts!',
      data: contactsList,
    });
  });

  app.get('/contacts/:contactId', async (req, res) => {
    const { contactId } = req.params;
    const contact = await getContactById(contactId);

    if (!contact) {
      return res.status(404).json({
        message: `Contact not found`,
      });
    }
    res.json({
      status: 200,
      message: `Successfully found contact with id: ${contactId}!`,
      data: contact,
    });
  });

  app.use('*eny', (req, res) => {
    res.status(404).json({ message: 'No found' });
  });

  app.use((err, req, res, next) => {
    res.status(500).json({
      message: 'Something went wrong',
      error: err.message,
    });
    next();
  });

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};
