import createHttpError from 'http-errors';

export const validateBody = (schema) => async (req, res, next) => {
  try {
    await schema.validateAsync(req.body, { AbortEarly: false });
    next();
  } catch (e) {
    const errors = e.details.map((detail) => detail.message);

    next(createHttpError.BadRequest(errors));
  }
};
