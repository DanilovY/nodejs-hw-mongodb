import { Router } from 'express';
import contactsRouter from './contactsRout.js';
import authRouter from './authRout.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/contacts', contactsRouter);

export default router;
