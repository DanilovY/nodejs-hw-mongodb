import createHttpError from 'http-errors';
import { UserCollection } from '../bd/models/user.js';

import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { SessionCollection } from '../bd/models/session.js';
import {
  FIFTEEN_MINUTES,
  ONE_DAY,
  SMTP,
  TEMPLATES_DIR,
} from '../constants/index.js';
import { getEnvVar } from '../utils/getEnvVar.js';
import handlebars from 'handlebars';
import jwt from 'jsonwebtoken';
import fs from 'node:fs/promises';
import path from 'node:path';
import { sendEmail } from '../utils/sendMail.js';

export const registerUser = async (payload) => {
  const user = await UserCollection.findOne({ email: payload.email });
  const hashedPassword = await bcrypt.hash(payload.password, 10);

  if (user) throw createHttpError(409, 'Email in use');

  return await UserCollection.create({
    ...payload,
    password: hashedPassword,
  });
};

export const loginUser = async (payload) => {
  const user = await UserCollection.findOne({ email: payload.email });

  if (!user) throw createHttpError(401, 'User not found');

  const isEqual = await bcrypt.compare(payload.password, user.password);

  if (!isEqual) {
    throw createHttpError(401, 'Unauthorized');
  }

  await SessionCollection.deleteOne({ userId: user._id });

  const accessToken = randomBytes(30).toString('base64');
  const refreshToken = randomBytes(30).toString('base64');

  return await SessionCollection.create({
    userId: user._id,
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + ONE_DAY),
  });
};

const createSession = () => {
  const accessToken = randomBytes(30).toString('base64');
  const refreshToken = randomBytes(30).toString('base64');

  return {
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + ONE_DAY),
  };
};

export const refreshUsersSession = async ({ sessionId, refreshToken }) => {
  const session = await SessionCollection.findOne({
    _id: sessionId,
    refreshToken,
  });

  if (!session) {
    throw createHttpError(401, 'Session not found');
  }

  const isSessionTokenExpired =
    new Date() > new Date(session.refreshTokenValidUntil);

  if (isSessionTokenExpired) {
    throw createHttpError(401, 'Session token expired');
  }

  const newSession = createSession();

  await SessionCollection.deleteOne({ _id: sessionId, refreshToken });

  return await SessionCollection.create({
    userId: session.userId,
    ...newSession,
  });
};

export const logoutUser = async (sessionId) => {
  await SessionCollection.deleteOne({ _id: sessionId });
};

export const requestResetToken = async (email) => {
  const user = await UserCollection.findOne({ email });

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  const resetToken = jwt.sign(
    {
      sub: user._id,
      email,
    },
    getEnvVar('JWT_SECRET'),
    {
      expiresIn: '15m',
    },
  );

  const resetPasswordTemplatePath = path.join(
    TEMPLATES_DIR,
    'reset-password-email.html',
  );

  const templateSource = (
    await fs.readFile(resetPasswordTemplatePath)
  ).toString();

  const template = handlebars.compile(templateSource);

  const html = template({
    name: user.name,
    link: `${getEnvVar('APP_DOMAIN')}/reset-password?token=${resetToken}`,
  });

  await sendEmail({
    from: SMTP.SMTP_FROM,
    to: email,
    subject: 'Reset your password',
    html,
  });
};

export const resetPassword = async (password, token) => {
  try {
    const decoder = jwt.verify(token, getEnvVar('JWT_SECRET'));

    const user = await UserCollection.findById(decoder.sub);

    if (user === null) throw createHttpError.NotFound('User not found!');

    const hashPassword = await bcrypt.hash(password, 10);

    await UserCollection.findByIdAndUpdate(user._id, {
      password: hashPassword,
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new createHttpError.Unauthorized('Token is unauthorized');
    }

    if (error.name === 'TokenExpiredError') {
      throw new createHttpError.Unauthorized('Token is expired or invalid.');
    }

    throw error;
  }
};
