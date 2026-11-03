require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { randomBytes } = require("crypto");
const mongoose = require("mongoose");

const Session = require("./Schemas/session.js");
const User = require("./Schemas/User.js");
const WorkOrder = require("./Schemas/WorkOrder.js");

const port = Number(process.env.PORT) || 3000;
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.MONGODB_DB || "Launchpad";

async function requireUser(req, res, next) { // Checking session token is valid
  const auth = req.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Must be logged in!"});
  }
  try {
    const session = await Session.findOne({ token}).populate("userId");
    if (!session || !session.userId) {
      return res.status(401).json({ error: "Invalid session."});
    }
    req.user = session.userId;
    req.userId = session.userId._id.toString();
    next();
  } catch (error) {
    res.status(500).json({ error: "Error with validating session."});
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: "Permission denied."});
    }
    next();
  };
}

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  async function createSession(userId) { // Signup page
    const token = randomBytes(32).toString("hex");
    await Session.create({ token, userId });
    return token;
  }

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, role, studentProfile, businessProfile } = req.body;
      if (!email || !password || !role) {
        return res.status(400).json({ error: "Email, password, and role are required." });
      }

      const currUser = await User.findOne({ email });
      if (currUser) {
        return res.status(400).json({ error: "User with the provided email already exists."});
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create( { email, passwordHash: hashedPassword, role, studentProfile, businessProfile });

      const token = await createSession(newUser._id);
      res.status(201).json({ userId: newUser._id.toString(), role: newUser.role, token});
    } catch (error) {
      res.status(500).json({ error: "Error encountered while creating account." });
    }
  });

  app.post("/api/auth/login", async (req, res) => { // Login page
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email});
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: "Invalid email or password." });
      }
      const token = await createSession(user._id);
      res.json({ userId: user._id.toString(), role: user.role, token});
    } catch (error) {
      res.status(500).json({ error: "Ran into an error while logging in."});
    }
  });

  app.get('/api/work-orders', async (req, res) => {
    try {
      const workOrders = await WorkOrder.find({ status: 'open'})
      .populate('businessId', 'businessProfile.companyName email')
      .sort({ createdAt: -1});
      res.json(workOrders);
    } catch (error) {
      res.status(500).json({ error: "Error in fetching work orders."});
    }
  });

app.get('/api/auth/me', requireUser, async (req, res) => {
  res.json( { _id: req.user._id, email: req.user.email, role: req.user.role, studentProfile: req.user.studentProfile, businessProfile: req.user.businessProfile,});
});

app.post('/api/work-orders', requireUser, requireRole('business'), async (req, res) => {
  try {
    const { title, description, category, budget, deadline } = req.body;
    if (!title || !description || !category || !budget) {
      return res.status(400).json({ error: "Title, description, category, and budget are all required fields."});
    }

    const workOrder = await WorkOrder.create({ title, description, category, budget: Number(budget), deadline, businessId: req.userId, });
    res.status(201).json(workOrder);
  } catch (error) {
    res.status(500).json({ error: "Failed to create a work order."});
  }
});

app.get('/api/work-orders/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Work order ID is not valid."});
    }
    const workOrder = await WorkOrder.findById(req.params.id)
    .populate ("businessId", "businessProfile email") 
    .populate ("assignedStudentId", "studentProfile email");
    if (!workOrder) {
      return res.status(404).json({ error: "Work order was not found."});
    }
    res.json(workOrder);
  } catch (error) {
    res.status(500).json({ error: "Error whilst fetching work order."});
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid user ID."});
    }
    const user = await User.findById(req.params.id).select("-passwordHash");
    if (!user){
      return res.status(404).json({ error: "User was not found."});
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Error occured whilst fetching user data."});
  }
});

  return app;
}

async function startServer() {
  try {
    await mongoose.connect(mongoUri, { dbName });
    console.log("Successfully connected to MongoDB!");

    const app = createApp();
    app.listen(port, () => {
      console.log(`Backend server is running on port http://localhost:${port}`);
    });
  } catch (error) {
    console.log("Failed to connect to MongoDB", error);
  }
}

startServer();
