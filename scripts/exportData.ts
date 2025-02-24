import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const MONGODB_URI = process.env.VITE_MONGODB_URI;
const DB_NAME = 'zanzibar-dev';

async function exportSurveyFlags() {
  const client = new MongoClient(MONGODB_URI!, {
    ssl: true,
    tls: true,
    retryWrites: true,
    w: 'majority',
    connectTimeoutMS: 30000
  });

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    const collection = db.collection('surveys_flags');
    const data = await collection.find({}).toArray();
    
    // Process the data
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

    const processedData = Object.values(submissions);
    
    fs.writeFileSync(
      path.join('src', 'data', 'survey-flags.json'),
      JSON.stringify(processedData, null, 2)
    );
    
    console.log(`Exported ${processedData.length} submissions`);
  } catch (error) {
    console.error('Export error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

exportSurveyFlags(); 