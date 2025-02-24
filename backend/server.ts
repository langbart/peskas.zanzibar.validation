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
    
    // Process submissions: group by submission_id and flatten catch details.
    const submissions = data
      .filter(doc => doc.submission_id) // ignore metadata documents
      .reduce((acc: any, doc) => {
        const id = doc.submission_id;
        if (!acc[id]) {
          // Initialize submission with top-level fields from the first catch
          acc[id] = {
            submission_id: id,
            n_catch: doc.n_catch,
            alert_flag: doc.alert_flag || null,
            catches: [],
            total_alerts: 0
          };
        }
        // Push each catch into the catches array
        acc[id].catches.push({
          n_catch: doc.n_catch,
          alert_flag: doc.alert_flag
        });
        // Update total alerts and (optionally) the top-level alert_flag if available.
        if (doc.alert_flag) {
          acc[id].total_alerts++;
          // You can choose whether to keep the first, last, or some computed value.
          acc[id].alert_flag = doc.alert_flag;
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