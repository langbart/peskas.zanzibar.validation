# Fishery Validation Portal

Web application for validating fishery catch data from Zanzibar. Built with React, Express, and MongoDB.

## Quick Start

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev
```

## Environment Variables

Required in `.env`:
```env
VITE_API_URL=http://localhost:3001
VITE_MONGODB_URI=mongodb+srv://${MONGODB_USER}:${MONGODB_PASSWORD}@your-cluster.mongodb.net
MONGODB_USER=your_mongodb_username
MONGODB_PASSWORD=your_mongodb_password
JWT_SECRET=your_jwt_secret
```

## Development

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

## API Endpoints

- `POST /api/login` - Authentication
- `GET /api/surveys` - Fetch survey data (requires auth)

## Default Login

- Username: `admin`
- Password: `password`

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Express + Node.js
- Database: MongoDB
- Authentication: JWT

## License

MIT 