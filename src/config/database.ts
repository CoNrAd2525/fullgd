import mongoose from 'mongoose';
import { Pool } from 'pg';
import { createClient } from 'redis';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection
const connectMongoDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }
    
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// PostgreSQL connection
const pgPool = new Pool({
  connectionString: process.env.POSTGRES_URI,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const connectPostgres = async (): Promise<void> => {
  try {
    await pgPool.connect();
    console.log('PostgreSQL connected successfully');
  } catch (error) {
    console.error('PostgreSQL connection error:', error);
    process.exit(1);
  }
};

// Redis connection
const redisClient = createClient({
  url: process.env.REDIS_URI
});

const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    console.log('Redis connected successfully');
  } catch (error) {
    console.error('Redis connection error:', error);
    process.exit(1);
  }
};

// Prisma client
const prisma = new PrismaClient();

// Connect to all databases
const connectDatabase = async (): Promise<void> => {
  try {
    // Connect to databases based on configuration
    if (process.env.USE_MONGODB === 'true') {
      await connectMongoDB();
    } else {
      console.log('MongoDB connection skipped based on configuration');
    }
    
    if (process.env.USE_POSTGRES === 'true') {
      await connectPostgres();
    } else {
      console.log('PostgreSQL connection skipped based on configuration');
    }
    
    if (process.env.USE_REDIS === 'true') {
      await connectRedis();
    } else {
      console.log('Redis connection skipped based on configuration');
    }
    
    console.log('All database connections established');
  } catch (error) {
    console.error('Database connection error:', error);
    // Don't exit the process in development mode
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export {
  connectDatabase,
  pgPool,
  redisClient,
  prisma
};