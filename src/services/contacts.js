import { ContactsCollection } from '../bd/models/contactSchema.js';
import { calculatePaginationData } from '../utils/calculatePaginationData.js';

export const getAllContacts = async ({
  page,
  perPage,
  sortBy,
  sortOrder,
  filter,
  ownerId,
}) => {
  const limit = perPage;
  const skip = (page - 1) * perPage;

  const contactsQery = ContactsCollection.find();
  contactsQery.where('ownerId').equals(ownerId);

  if (filter.type) {
    contactsQery.where('contactType').equals(filter.type);
  }

  if (filter.isFavourite) {
    contactsQery.where('isFavourite').equals(filter.isFavourite);
  }

  const contactsCount = await ContactsCollection.find()
    .merge(contactsQery)
    .countDocuments();

  const contacts = await contactsQery
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder })
    .exec();
  const paginationData = calculatePaginationData(contactsCount, page, perPage);

  return {
    data: contacts,
    ...paginationData,
  };
};
export const getContactById = async (contactId) => {
  const contact = await ContactsCollection.findById(contactId);
  return contact;
};

export const createContact = async (payload) => {
  const contact = await ContactsCollection.create(payload);
  return contact;
};

export const updateContact = async (contactId, payload) => {
  const contact = await ContactsCollection.findByIdAndUpdate(
    contactId,
    payload,
    {
      new: true,
    },
  );
  return contact;
};

export const deleteContact = async (contactId) => {
  const contact = await ContactsCollection.findByIdAndDelete(contactId);
  return contact;
};

//----------------------------------------put--------------------------------------//

export const replaceContact = async (contactId, payload) => {
  const contact = await ContactsCollection.findByIdAndUpdate(
    contactId,
    payload,
    { new: true, upsert: true, includeResultMetadata: true },
  );
  return {
    value: contact.value,
    updatedExisting: contact.lastErrorObject.updatedExisting,
  };
};
