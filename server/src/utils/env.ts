import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // Also check local directory

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/smartfarmer?schema=public',
  SQLITE_DATABASE_URL: process.env.SQLITE_DATABASE_URL || 'file:./dev.db',
  JWT_SECRET: process.env.JWT_SECRET || 'smart_farmer_dev_secret_key_change_in_prod_at_least_32_chars',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  
  // External APIs
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
  DATA_GOV_API_KEY: process.env.DATA_GOV_API_KEY || '',
  
  // AI
  AI_PROVIDER: (process.env.AI_PROVIDER || 'gemini').toLowerCase(),
  AI_API_KEY: process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  
  // Twilio
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
  TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER || '',
  
  // WhatsApp
  WHATSAPP_PROVIDER: process.env.WHATSAPP_PROVIDER || '',
  WHATSAPP_API_URL: process.env.WHATSAPP_API_URL || '',
  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN || '',
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  
  // Firebase Push
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || '',

  // Free SMS & Mobile Notification Channels
  ANDROID_SMS_GATEWAY_URL: process.env.ANDROID_SMS_GATEWAY_URL || '',
  ANDROID_SMS_GATEWAY_KEY: process.env.ANDROID_SMS_GATEWAY_KEY || '',
  FAST2SMS_API_KEY: process.env.FAST2SMS_API_KEY || '',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '8927569233:AAEhn5gU6Gwnx5GsvPpoPdv_Qmclp-QV4C8',
  TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME || 'Kisan_kendra_bot',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',
  TELEGRAM_GATEWAY_TOKEN: process.env.TELEGRAM_GATEWAY_TOKEN || '',
};

