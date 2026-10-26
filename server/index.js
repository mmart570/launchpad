require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { randomBytes } = require('crypto');
const mongoose = require('mongoose');
const Session = require('./Schemas/session.js');

const port = Number(process.env.PORT) || 3000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.MONGODB_DB || 'Launchpad';

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  async function createSession(userId) {
    const token = randomBytes(32).toString('hex');
    await Session.create({ token, userId });
    return token;
  }

  app.post( '/api/test', async (req, res) => {
    try {
      const testUserId = 'test-user-id';
      const token = await createSession(testUserId);
      res.json({ message: 'The test session was successful!', token})
    } catch (error) {
      res.status(500).json({ error: 'The est session failed...', })
    }
  });
  return app;
}

async function startServer() {
  try {
    await mongoose.connect(mongoUri, { dbName });
    console.log('Successfully connected to MongoDB!');
  
    const app = createApp();
    app.listen(port, () => {
      console.log(`Backend server is running on port http://localhost:${port}`);
    });
  } catch (error) {
    console.log('Failed to connect to MongoDB', error);
  }
}

startServer()
