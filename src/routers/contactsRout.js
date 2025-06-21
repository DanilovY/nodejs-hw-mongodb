import { Router } from 'express';
import {
  createContactController,
  deleteContactController,
  getContactByIdController,
  getContactsController,
  replaceContsctController,
  updateContactController,
} from '../controllers/contactsControllers.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import express from 'express';
import { validateBody } from '../middlewares/validateBody.js';
import {
  createContactSchema,
  updateContactSchema,
} from '../validation/contactValidation.js';
import { isValidId } from '../middlewares/isValidId/isValidId.js';
import { authenticate } from '../middlewares/authenticate.js';
import { upload } from '../middlewares/upload.js';

const router = Router();
const jsonParser = express.json();
router.use(authenticate);

router.get('/', ctrlWrapper(getContactsController));

router.get('/:contactId', isValidId, ctrlWrapper(getContactByIdController));

router.post(
  '/',
  jsonParser,
  upload.single('avatar'),
  validateBody(createContactSchema),
  ctrlWrapper(createContactController),
);

router.patch(
  '/:contactId',
  jsonParser,
  isValidId,
  validateBody(updateContactSchema),
  ctrlWrapper(updateContactController),
);

router.delete('/:contactId', isValidId, ctrlWrapper(deleteContactController));
//-----------------------------------put-------------------------------------------//
router.put(
  '/:contactId',
  jsonParser,
  isValidId,
  validateBody(createContactSchema),
  ctrlWrapper(replaceContsctController),
);
export default router;
