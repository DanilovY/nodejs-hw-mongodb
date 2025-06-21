import {
  createContact,
  deleteContact,
  getAllContacts,
  getContactById,
  replaceContact,
  updateContact,
} from '../services/contacts.js';
import createHttpError from 'http-errors';
import { parsePaginationParams } from '../utils/parsePaginationParams.js';
import { parseSortParams } from '../utils/parseSortParams.js';
import { parseFilterParams } from '../utils/parseFilterParams.js';
import { getEnvVar } from '../utils/getEnvVar.js';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { uploadCloudinary } from '../utils/saveFileToCloudinary.js';

export const getContactsController = async (req, res) => {
  const { page, perPage } = parsePaginationParams(req.query);
  const { sortBy, sortOrder } = parseSortParams(req.query);
  const filter = parseFilterParams(req.query);

  const contactsList = await getAllContacts({
    page,
    perPage,
    sortBy,
    sortOrder,
    filter,
    ownerId: req.user.id,
  });

  res.json({
    status: 200,
    message: 'Successfully found contacts!',
    data: contactsList,
  });
};

export const getContactByIdController = async (req, res) => {
  const { contactId } = req.params;
  const contact = await getContactById(contactId, req.user.id);

  if (!contact) {
    throw createHttpError(404, 'Contact not found');
  }

  if (contact.ownerId.toString() !== req.user.id.toString()) {
    throw createHttpError.NotFound('Student not found');
  }

  res.json({
    status: 200,
    message: `Successfully found contact with id: ${contactId}!`,
    data: contact,
  });
};

export const createContactController = async (req, res) => {
  let avatar = null;

  if (getEnvVar('UPLOAD-CLOUDINARY') === 'true') {
    const result = await uploadCloudinary(req.file.path);
    await fs.unlink(req.file.path);

    avatar = result.secure_url;
  } else {
    await fs.rename(
      req.file.path,
      path.resolve('src', 'uploads', 'avatars', req.file.filename),
    );
    avatar = `http://localhost:3000/avatars/${req.file.filename}`;
  }

  const contact = await createContact({
    ...req.body,
    ownerId: req.user.id,
    avatar,
  });

  res.status(201).json({
    status: 201,
    message: 'Successfully created a contact!',
    data: contact,
  });
};

export const updateContactController = async (req, res, next) => {
  const { contactId } = req.params;

  const contact = await getContactById(contactId, req.user.id);

  if (!contact) {
    return next(createHttpError(404, 'Contact not found'));
  }

  if (contact.ownerId.toString() !== req.user.id.toString()) {
    return next(
      createHttpError(403, 'You are not allowed to update this contact'),
    );
  }

  let avatar = contact.avatar;
  if (req.file) {
    if (getEnvVar('UPLOAD-CLOUDINARY') === 'true') {
      const result = await uploadCloudinary(req.file.path);
      await fs.unlink(req.file.path);
      avatar = result.secure_url;
    } else {
      await fs.rename(
        req.file.path,
        path.resolve('src', 'uploads', 'avatars', req.file.filename),
      );
      avatar = `http://localhost:3000/avatars/${req.file.filename}`;
    }
  }

  const updatedContact = await updateContact(contactId, req.user.id, {
    ...req.body,
    avatar,
  });

  res.status(200).json({
    status: 200,
    message: 'Successfully patched a contact!',
    data: updatedContact,
  });
};

export const deleteContactController = async (req, res, next) => {
  const { contactId } = req.params;

  const contact = await getContactById(contactId, req.user.id);

  if (!contact) {
    return next(createHttpError(404, 'Contact not found'));
  }

  if (contact.ownerId.toString() !== req.user.id.toString()) {
    return next(
      createHttpError(403, 'You are not allowed to delete this contact'),
    );
  }

  await deleteContact(contactId, req.user.id);

  res.status(204).send();
};

//---------------------------------------put---------------------------------------//

export const replaceContsctController = async (req, res, next) => {
  const { contactId } = req.params;
  const contact = await getContactById(contactId, req.user.id);

  if (contact && contact.ownerId.toString() !== req.user.id.toString()) {
    return next(
      createHttpError(403, 'You are not allowed to replace this contact'),
    );
  }

  const { value, updatedExisting } = await replaceContact(
    contactId,
    req.user.id,
    {
      ...req.body,
      ownerId: req.user.id,
    },
  );

  if (updatedExisting === true) {
    res.status(200).json({
      status: 200,
      message: 'Contact updated successfully',
      data: value,
    });
  }

  res.status(201).json({
    status: 201,
    message: `Successfully upserted a contact!`,
    data: value,
  });
};
