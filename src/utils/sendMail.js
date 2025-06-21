import nodemailer from 'nodemailer';
import { SMTP } from '../constants/index.js';

const transporter = nodemailer.createTransport({
  host: SMTP.SMTP_HOST,
  port: Number(SMTP.SMTP_PORT),
  secure: false,
  auth: {
    user: SMTP.SMTP_AUTH_USER,
    pass: SMTP.SMTP_AUTH_PASSWORD,
  },
});

export const sendEmail = async (options) => {
  return await transporter.sendMail(options);
};
