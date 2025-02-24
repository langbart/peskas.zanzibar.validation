declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MONGODB_URI: string;
      DB_NAME: string;
      JWT_SECRET: string;
      NODE_ENV: 'development' | 'production';
    }
  }
}

export {} 