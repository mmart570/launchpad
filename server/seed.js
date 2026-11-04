require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./Schemas/User.js");
const WorkOrder = require("./Schemas/WorkOrder.js");
const Session = require("./Schemas/session.js");

const MONGODB_URI = process.env.MONGODB_URI;
const dbName = process.env.MONGO_DB_NAME || "Launchpad";

 const mockWorkOrders = [
  {
    seedKey: "workOrder1",
    title: "Finishing up Launchpad",
    description: "Finishing up the Launchpad project.",
    category: "Fullstack Development",
    budget: 1000,
    status: "in_progress",
    deadline: new Date(),
  },
  {
    seedKey: "workOrder2",
    title: "Finishing up database integration",
    description: "Make website smooth with DB",
    category: "Backend Development",
    budget: 75,
    status: "open",
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
  },
 ];

 async function seed() {

  if (!MONGODB_URI) {
    throw new Error ("MONGODB_URI is required.");
  }

  await mongoose.connect(MONGODB_URI, { dbName });
  console.log("Connected to MongoDB");
  const passwordHash = await bcrypt.hash("secrets567",10);

  const businessUser = await User.findOneAndUpdate( 
    { email: "kirby@frontier.com"},
    {
      $set: {
        email: "kirby@frontier.com", passwordHash, role: "business",
        businessProfile: {
          companyName: "Kirby Performance", projectLead: "Bruce Wayne", industry: "Defense Engineering", companyWebsite: "https://kirbyperformance.com", companyNum:"760-900-4241",
        },
      },
    },
    { upsert: true, new: true }
  );

  const studentUser = await User.findOneAndUpdate(
    { email: "newstudent@uni.edu" }, 
    {
      $set: {
        email: "newstudent@uni.edu", passwordHash, role: "student", 
        studentProfile: {
          firstName: "The", lastName: "Joker", major: "Computer Science", skills: ["React", "MongoDB", "Node.js", "HTML", "CSS"],
        },
      },
    },
    { upsert: true, new: true }
  );

  await WorkOrder.deleteMany({});

  const ordersToInsert = mockWorkOrders.map((order) => ({
    ...order, businessId: businessUser._id,
  }));

  await WorkOrder.create(ordersToInsert);

 const exToken = "testing-token456";
 await Session.findOneAndUpdate(
  { token: exToken },
  {
    $set: {
      token: exToken, userId: studentUser._id,
    },
  },
  { upsert: true, new: true }
 );

 await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Failed to seed MongoDB', err.message);
  process.exit(1);
});