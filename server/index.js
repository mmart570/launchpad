require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { randomBytes } = require("crypto");
const mongoose = require("mongoose");

const Session = require("./Schemas/session.js");
const User = require("./Schemas/User.js");
const WorkOrder = require("./Schemas/WorkOrder.js");
const Application = require("./Schemas/Application.js");

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
      res.json({ workOrders });
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
  
  // Student submits an application to an open work order.
  app.post(
    "/api/work-orders/:id/applications",
    requireUser,
    requireRole("student"),
    async (req, res) => {
      try {
        const { id } = req.params;
        const { message } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            error: "Invalid work order ID.",
          });
        }

        if (typeof message !== "string" || !message.trim()) {
          return res.status(400).json({
            error: "Please include an application message.",
          });
        }

        const workOrder = await WorkOrder.findById(id);

        if (!workOrder) {
          return res.status(404).json({
            error: "Work order not found.",
          });
        }

        if (workOrder.status !== "open") {
          return res.status(400).json({
            error: "This work order is no longer accepting applications.",
          });
        }

        const existingApplication = await Application.findOne({
          workOrderId: id,
          studentId: req.userId,
        });

        if (existingApplication) {
          return res.status(409).json({
            error: "You have already applied to this work order.",
          });
        }

        const application = await Application.create({
          workOrderId: id,
          studentId: req.userId,
          message: message.trim(),
        });

        res.status(201).json(application);
      } catch (error) {
        if (error.code === 11000) {
          return res.status(409).json({
            error: "You have already applied to this work order.",
          });
        }

        console.error("Application submission error:", error);

        res.status(500).json({
          error: "Unable to submit application.",
        });
      }
    },
  );

  // Student views their own applications.
  app.get(
    "/api/applications/my",
    requireUser,
    requireRole("student"),
    async (req, res) => {
      try {
        const applications = await Application.find({
          studentId: req.userId,
        })
          .populate({
            path: "workOrderId",
            select: "title description category budget status businessId assignedStudentId",
            populate: {
              path: "businessId",
              select: "businessProfile.companyName",
            },
          })
          .sort({ createdAt: -1 });

        res.json(applications);
      } catch (error) {
        console.error("My applications error:", error);

        res.status(500).json({
          error: "Unable to load applications.",
        });
      }
    },
  );

  // Business views applications for one of its own work orders.
  app.get(
    "/api/work-orders/:id/applications",
    requireUser,
    requireRole("business"),
    async (req, res) => {
      try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            error: "Invalid work order ID.",
          });
        }

        const workOrder = await WorkOrder.findById(id);

        if (!workOrder) {
          return res.status(404).json({
            error: "Work order not found.",
          });
        }

        if (String(workOrder.businessId) !== req.userId) {
          return res.status(403).json({
            error: "You cannot view applications for this work order.",
          });
        }

        const applications = await Application.find({
          workOrderId: id,
        })
          .populate(
            "studentId",
            "studentProfile.firstName studentProfile.lastName studentProfile.major email",
          )
          .sort({ createdAt: -1 });

        res.json(applications);
      } catch (error) {
        console.error("Business applications error:", error);

        res.status(500).json({
          error: "Unable to load applicants.",
        });
      }
    },
  );
  
  // Business accepts or rejects an application.
  app.patch(
    "/api/applications/:id/status",
    requireUser,
    requireRole("business"),
    async (req, res) => {
      try {
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            error: "Invalid application ID.",
          });
        }

        if (!["accepted", "rejected"].includes(status)) {
          return res.status(400).json({
            error: "Status must be accepted or rejected.",
          });
        }

        const application = await Application.findById(id);

        if (!application) {
          return res.status(404).json({
            error: "Application not found.",
          });
        }

        const workOrder = await WorkOrder.findById(
          application.workOrderId,
        );

        if (!workOrder) {
          return res.status(404).json({
            error: "Work order not found.",
          });
        }

        if (String(workOrder.businessId) !== req.userId) {
          return res.status(403).json({
            error: "You cannot manage applications for this work order.",
          });
        }

        if (application.status !== "pending") {
          return res.status(409).json({
            error: "This application has already been reviewed.",
          });
        }

        if (status === "accepted") {
          // Atomically claim the work order if it is still open.
          // This prevents two simultaneous requests from assigning
          // different students to the same work order.
          const updatedOrder = await WorkOrder.findOneAndUpdate(
            {
              _id: workOrder._id,
              status: "open",
              assignedStudentId: null,
            },
            {
              $set: {
                status: "in_progress",
                assignedStudentId: application.studentId,
              },
            },
            { new: true },
          );

          if (!updatedOrder) {
            return res.status(409).json({
              error: "This work order already has an assigned student or is no longer open.",
            });
          }

          application.status = "accepted";
          await application.save();

          // Other pending applications are no longer eligible.
          await Application.updateMany(
            {
              workOrderId: workOrder._id,
              _id: { $ne: application._id },
              status: "pending",
            },
            { $set: { status: "rejected" } },
          );

          return res.json({
            message: "Application accepted successfully.",
            application,
            workOrder: updatedOrder,
          });
        }

        // Rejecting an application does not close the work order.
        application.status = "rejected";
        await application.save();

        return res.json({
          message: "Application rejected successfully.",
          application,
        });
      } catch (error) {
        console.error("Application status update error:", error);

        res.status(500).json({
          error: "Unable to update application status.",
        });
      }
    },
  );
  
  // Return all work orders belonging to the logged-in business.
  app.get(
    "/api/business/work-orders",
    requireUser,
    requireRole("business"),
    async (req, res) => {
      try {
        const workOrders = await WorkOrder.find({
          businessId: req.userId,
        }).sort({ createdAt: -1 });

        res.json(workOrders);
      } catch (error) {
        console.error("Business work orders error:", error);

        res.status(500).json({
          error: "Unable to load business work orders.",
        });
      }
    },
  );

  // Update the logged-in student's profile.
  app.patch(
    "/api/students/me/profile",
    requireUser,
    requireRole("student"),
    async (req, res) => {
      try {
        const {
          firstName,
          lastName,
          school,
          major,
          graduationYear,
          skills,
          bio,
        } = req.body;

        if (
          typeof firstName !== "string" ||
          typeof lastName !== "string" ||
          typeof school !== "string" ||
          typeof major !== "string" ||
          typeof bio !== "string" ||
          !Array.isArray(skills) ||
          !skills.every((skill) => typeof skill === "string")
        ) {
          return res.status(400).json({
            error: "Invalid profile information.",
          });
        }

        const cleanedSkills = [
          ...new Set(
            skills
              .map((skill) => skill.trim())
              .filter(Boolean),
          ),
        ];

        if (cleanedSkills.length > 20) {
          return res.status(400).json({
            error: "You can add up to 20 skills.",
          });
        }

        let year = undefined;

        if (
          graduationYear !== "" &&
          graduationYear !== null &&
          graduationYear !== undefined
        ) {
          year = Number(graduationYear);

          if (
            !Number.isInteger(year) ||
            year < 1950 ||
            year > 2100
          ) {
            return res.status(400).json({
              error: "Enter a valid graduation year.",
            });
          }
        }

      const updatedFields = {
        "studentProfile.firstName": firstName.trim(),
        "studentProfile.lastName": lastName.trim(),
        "studentProfile.school": school.trim(),
        "studentProfile.major": major.trim(),
        "studentProfile.bio": bio.trim(),
        "studentProfile.skills": cleanedSkills,
      };

      const update = {
        $set: updatedFields,
      };

      if (year === undefined) {
        update.$unset = {
          "studentProfile.graduationYear": "",
        };
      } else {
        update.$set["studentProfile.graduationYear"] = year;
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.userId,
        update,
        {
          new: true,
          runValidators: true,
        },
      ).select("-passwordHash");

      if (!updatedUser) {
        return res.status(404).json({
          error: "Student account not found.",
        });
      }

      return res.json(updatedUser);

      } catch (error) {
        console.error("Student profile update error:", error);

        return res.status(500).json({
          error: "Unable to update student profile.",
        });
      }
    },
  );

  // Businesses can view profiles of students who applied
  // to one of their work orders.
  app.get(
    "/api/business/students/:id",
    requireUser,
    requireRole("business"),
    async (req, res) => {
      try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            error: "Invalid student ID.",
          });
        }

        // Verify that this student applied to a work order
        // belonging to the logged-in business.
        const businessOrders = await WorkOrder.find({
          businessId: req.userId,
        }).select("_id");

        const hasApplied = await Application.exists({
          studentId: id,
          workOrderId: {
            $in: businessOrders.map((order) => order._id),
          },
        });

        if (!hasApplied) {
          return res.status(403).json({
            error: "You do not have permission to view this student.",
          });
        }

        const student = await User.findOne({
          _id: id,
          role: "student",
        }).select(
          "studentProfile.firstName studentProfile.lastName studentProfile.school studentProfile.major studentProfile.graduationYear studentProfile.skills studentProfile.bio",
        );

        if (!student) {
          return res.status(404).json({
            error: "Student not found.",
          });
        }

        const completedOrders = await WorkOrder.find({
          assignedStudentId: id,
          status: "completed",
        })
          .select("title description category businessId")
          .populate(
            "businessId",
            "businessProfile.companyName",
          );

        const businessIds = new Set(
          completedOrders
            .map((order) => String(order.businessId?._id || ""))
            .filter(Boolean),
        );

        return res.json({
          _id: student._id,
          studentProfile: student.studentProfile,
          completedOrders: completedOrders.length,
          businessesWorkedWith: businessIds.size,
          projects: completedOrders,
        });
      } catch (error) {
        console.error("Business student profile error:", error);

        return res.status(500).json({
          error: "Unable to load student profile.",
        });
      }
    },
  );

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
