import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.VITE_MONGODB_URI;
const DB_NAME = 'zanzibar-dev';

let client: MongoClient | null = null;

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(MONGODB_URI!);
    await client.connect();
  }
  return client;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const client = await connectToMongo();
      const collection = client.db(DB_NAME).collection('surveys_flags');
      const data = await collection.find({}).toArray();
      
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
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 