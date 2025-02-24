import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'jsonwebtoken';
const { sign, verify } = pkg;
import bcrypt from 'bcryptjs';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not defined in environment variables');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// Use non-VITE env vars for backend
const MONGODB_URI = process.env.VITE_MONGODB_URI;
const DB_NAME = process.env.VITE_DB_NAME || 'zanzibar-dev';
const JWT_SECRET = process.env.JWT_SECRET;

// Add debug logging
console.log('Environment:', {
  MONGODB_URI: MONGODB_URI?.substring(0, 20) + '...',
  DB_NAME,
  JWT_SECRET: JWT_SECRET ? 'set' : 'not set'
});

let client: MongoClient | null = null;

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(MONGODB_URI!, {
      maxPoolSize: 10,
      minPoolSize: 1,
      retryWrites: true,
      w: 'majority',
      connectTimeoutMS: 30000
    });
    await client.connect();
    console.log(`Connected to MongoDB (${DB_NAME})`);
  }
  return client;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
  process.exit(0);
});

// Improved login with JWT
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Add proper validation here
  if (username === 'admin' && password === 'password') {
    const token = sign({ username }, JWT_SECRET!, { expiresIn: '1h' });
    res.json({ success: true, token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Auth middleware
const auth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader); // Debug log

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token:', token); // Debug log

    const decoded = verify(token, JWT_SECRET!);
    console.log('Decoded token:', decoded); // Debug log
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Paginated surveys endpoint
app.get('/api/surveys', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const client = await connectToMongo();
    const collection = client.db(DB_NAME).collection('surveys_flags');
    
    const [data, total] = await Promise.all([
      collection.find({})
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments()
    ]);
    
    const submissions = data
      .filter(doc => doc.submission_id)
      .reduce((acc: any, doc) => {
        const id = doc.submission_id;
        if (!acc[id]) {
          acc[id] = {
            submission_id: id,
            catches: [],
            total_alerts: 0
          };
        }
        acc[id].catches.push({
          n_catch: doc.n_catch,
          alert_flag: doc.alert_flag
        });
        if (doc.alert_flag) {
          acc[id].total_alerts++;
        }
        return acc;
      }, {});

    res.json({
      data: Object.values(submissions),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default app;

if (process.env.NODE_ENV !== 'production') {
  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
} 