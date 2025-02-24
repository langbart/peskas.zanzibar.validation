import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.VITE_MONGODB_URI;
const DB_NAME = 'zanzibar-dev';

let client: MongoClient;

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(MONGODB_URI!);
    await client.connect();
    console.log('Connected to MongoDB');
  }
  return client;
}

// Simple login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  // Add proper authentication later
  if (username && password) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Get survey data endpoint
app.get('/api/surveys', async (req, res) => {
  try {
    const client = await connectToMongo();
    const collection = client.db(DB_NAME).collection('surveys_flags');
    
    const data = await collection.find({}).toArray();
    
    // Process submissions
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

    res.json(Object.values(submissions));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 