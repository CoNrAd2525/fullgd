"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.redisClient = exports.pgPool = exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const pg_1 = require("pg");
const redis_1 = require("redis");
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// MongoDB connection
const connectMongoDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error('MongoDB URI is not defined in environment variables');
        }
        await mongoose_1.default.connect(mongoURI);
        console.log('MongoDB connected successfully');
    }
    catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};
// PostgreSQL connection
const pgPool = new pg_1.Pool({
    connectionString: process.env.POSTGRES_URI,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
exports.pgPool = pgPool;
const connectPostgres = async () => {
    try {
        await pgPool.connect();
        console.log('PostgreSQL connected successfully');
    }
    catch (error) {
        console.error('PostgreSQL connection error:', error);
        process.exit(1);
    }
};
// Redis connection
const redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URI
});
exports.redisClient = redisClient;
const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log('Redis connected successfully');
    }
    catch (error) {
        console.error('Redis connection error:', error);
        process.exit(1);
    }
};
// Prisma client
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
// Connect to all databases
const connectDatabase = async () => {
    try {
        // Connect to databases based on configuration
        if (process.env.USE_MONGODB === 'true') {
            await connectMongoDB();
        }
        else {
            console.log('MongoDB connection skipped based on configuration');
        }
        if (process.env.USE_POSTGRES === 'true') {
            await connectPostgres();
        }
        else {
            console.log('PostgreSQL connection skipped based on configuration');
        }
        if (process.env.USE_REDIS === 'true') {
            await connectRedis();
        }
        else {
            console.log('Redis connection skipped based on configuration');
        }
        console.log('All database connections established');
    }
    catch (error) {
        console.error('Database connection error:', error);
        // Don't exit the process in development mode
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
};
exports.connectDatabase = connectDatabase;
