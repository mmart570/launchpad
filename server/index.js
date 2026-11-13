// ============================================================================
// LAUNCHPAD SERVER - Main Express API Server
// ============================================================================
// This file implements the backend API for the Launchpad platform
// which connects students with businesses for freelance work opportunities.

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { randomBytes } = require("crypto");
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Thread = require("./Schemas/Thread.js");

// Import database schemas
const Session = require("./Schemas/session.js");
const User = require("./Schemas/User.js");
const WorkOrder = require("./Schemas/WorkOrder.js");
const Application = require("./Schemas/Application.js");
const WorkSubmission = require("./Schemas/WorkSubmission.js");
const Message = require("./Schemas/Message.js");
const Report = require("./Schemas/Report.js");
const Notification = require("./Schemas/Notification.js");

// ============================================================================
// CONFIGURATION
// ============================================================================
const port = Number(process.env.PORT) || 3000;
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.MONGODB_DB || "Launchpad";
const { rateLimit } = require("express-rate-limit");

// ============================================================================
// MIDDLEWARE: AUTHENTICATION & AUTHORIZATION
// ============================================================================

// Middleware to verify user session from Bearer token
async function requireUser(req, res, next) {
  const auth = req.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Must be logged in!" });
  }
  try {
    // Find valid session with non-expired token
    const session = await Session.findOne({
      token,
      expiresAt: { $gt: new Date() },
    }).populate("userId");
    if (!session || !session.userId) {
      return res.status(401).json({ error: "Invalid session." });
    }
    req.user = session.userId;
    req.userId = session.userId._id.toString();
    next();
  } catch (error) {
    res.status(500).json({ error: "Error with validating session." });
  }
}

// Middleware to check if authenticated user has required role
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: "Permission denied." });
    }
    next();
  };
}

// ============================================================================
// FILE UPLOAD CONFIGURATION
// ============================================================================
// Private upload directory: do not expose this through express.static.
const uploadDirectory = path.join(__dirname, "private_uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });

// Allowed file types for work submissions
const permittedExtensions = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".md",
  ".csv",
  ".xlsx",
  ".pptx",
  ".zip",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".css",
  ".json",
  ".py",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".html",
  ".sql",
  ".xml",
  ".sh",
]);

// Multer configuration for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDirectory),
    filename: (_req, _file, cb) => cb(null, randomBytes(20).toString("hex")),
  }),
  limits: {
    files: 10,
    fileSize: 20 * 1024 * 1024,
    fields: 5,
    fieldSize: 10000,
  },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!permittedExtensions.has(extension))
      return cb(new Error("Unsupported file type: " + extension));
    cb(null, true);
  },
}).array("files", 10);

// Clean up uploaded files in case of error
function cleanupUploads(files = []) {
  return Promise.all(
    files.map((file) => fs.promises.unlink(file.path).catch(() => {})),
  );
}

// Express middleware for receiving file uploads
function receiveFiles(req, res, next) {
  upload(req, res, async (err) => {
    if (err) {
      await cleanupUploads(req.files);
      return res
        .status(400)
        .json({ error: err.message || "Invalid attachments." });
    }
    next();
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Validate MongoDB ObjectId format
function validId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

// Validate project URL format (HTTP or HTTPS)
function validProjectUrl(value) {
  if (!value) return true;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function createApp() {
  const app = express();

  // Configure CORS to allow requests from frontend
  const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ];

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
      },
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.use(express.json());

  // Rate limiter for login attempts
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error: "Too many login attempts. Please try again in 15 minutes.",
    },
  });

  // ========================================================================
  // SESSION MANAGEMENT
  // ========================================================================

  // Create a new session token for authenticated user
  async function createSession(userId) {
    const token = randomBytes(32).toString("hex");

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await Session.create({
      token,
      userId,
      expiresAt,
    });

    return token;
  }

  // ========================================================================
  // NOTIFICATIONS
  // ========================================================================
  // Notifications are best-effort: a notification failure must not undo a successful action.
  async function notify(recipientId, type, title, message, link, eventKey) {
    try {
      await Notification.updateOne(
        { recipientId, eventKey },
        { $setOnInsert: { recipientId, type, title, message, link, eventKey } },
        { upsert: true },
      );
    } catch (error) {
      console.error("Notification creation failed:", error);
    }
  }

  // ========================================================================
  // NOTIFICATION ENDPOINTS
  // ========================================================================

  // GET: Retrieve all notifications for the current user
  app.get("/api/notifications", requireUser, async (req, res) => {
    try {
      const notifications = await Notification.find({ recipientId: req.userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      const unreadCount = await Notification.countDocuments({
        recipientId: req.userId,
        read: false,
      });
      return res.json({ notifications, unreadCount });
    } catch (error) {
      return res.status(500).json({ error: "Unable to load notifications." });
    }
  });

  // PATCH: Mark a specific notification as read
  app.patch("/api/notifications/:id/read", requireUser, async (req, res) => {
    try {
      if (!validId(req.params.id))
        return res.status(400).json({ error: "Invalid notification ID." });
      const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, recipientId: req.userId },
        { $set: { read: true } },
        { new: true },
      );
      if (!notification)
        return res.status(404).json({ error: "Notification not found." });
      return res.json(notification);
    } catch (error) {
      return res.status(500).json({ error: "Unable to update notification." });
    }
  });

  // PATCH: Mark all notifications as read for current user
  app.patch("/api/notifications/read-all", requireUser, async (req, res) => {
    try {
      await Notification.updateMany(
        { recipientId: req.userId, read: false },
        { $set: { read: true } },
      );
      return res.json({ message: "Notifications marked as read." });
    } catch (error) {
      return res.status(500).json({ error: "Unable to update notifications." });
    }
  });

  // ========================================================================
  // AUTHENTICATION ENDPOINTS
  // ========================================================================

  // POST: Register a new user (student or business)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, role, studentProfile, businessProfile } =
        req.body;
      if (!email || !password || !role) {
        return res
          .status(400)
          .json({ error: "Email, password, and role are required." });
      }

      // Check if user with this email already exists
      const currUser = await User.findOne({ email });
      if (currUser) {
        return res
          .status(400)
          .json({ error: "User with the provided email already exists." });
      }

      // Hash password and create new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create({
        email,
        passwordHash: hashedPassword,
        role,
        studentProfile,
        businessProfile,
      });

      // Create session token for the new user
      const token = await createSession(newUser._id);
      res
        .status(201)
        .json({ userId: newUser._id.toString(), role: newUser.role, token });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error encountered while creating account." });
    }
  });

  // POST: User login with email and password
  app.post("/api/auth/login", loginLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;

      // Verify email and password match
      const user = await User.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      // Create session token for logged-in user
      const token = await createSession(user._id);
      res.json({ userId: user._id.toString(), role: user.role, token });
    } catch (error) {
      res.status(500).json({ error: "Ran into an error while logging in." });
    }
  });

  // POST: Logout and invalidate the current session token
  app.post("/api/auth/logout", requireUser, async (req, res) => {
    try {
      const auth = req.get("authorization") || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

      // Delete the session from the database
      await Session.deleteOne({
        token,
        userId: req.userId,
      });

      return res.json({
        message: "Logged out successfully.",
      });
    } catch (error) {
      return res.status(500).json({
        error: "Unable to log out.",
      });
    }
  });

  // ========================================================================
  // WORK ORDER ENDPOINTS - Browse & Display
  // ========================================================================

  // GET: Retrieve all open work orders
  app.get("/api/work-orders", async (req, res) => {
    try {
      const workOrders = await WorkOrder.find({ status: "open" })
        .populate("businessId", "businessProfile.companyName email")
        .sort({ createdAt: -1 });
      res.json({ workOrders });
    } catch (error) {
      res.status(500).json({ error: "Error in fetching work orders." });
    }
  });

  // ========================================================================
  // USER PROFILE ENDPOINTS
  // ========================================================================

  // GET: Retrieve current authenticated user's profile
  app.get("/api/auth/me", requireUser, async (req, res) => {
    res.json({
      _id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      studentProfile: req.user.studentProfile,
      businessProfile: req.user.businessProfile,
    });
  });

  // ========================================================================
  // WORK ORDER MANAGEMENT - Helper Functions & Routes
  // ========================================================================

  // Parse and validate work order fields from request body
  function parseWorkOrderFields(body, isDraft) {
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const category = String(body.category ?? "").trim();
    const serviceType = String(body.serviceType ?? "").trim();
    const submissionInstructions = String(
      body.submissionInstructions ?? "",
    ).trim();
    const allowEmptySubmission = body.allowEmptySubmission === true;

    const budget =
      body.budget === "" || body.budget == null ? null : Number(body.budget);

    const estimatedHours =
      body.estimatedHours === "" || body.estimatedHours == null
        ? null
        : Number(body.estimatedHours);

    const skills = Array.isArray(body.skills)
      ? body.skills.map((skill) => String(skill).trim()).filter(Boolean)
      : [];

    const deadline = body.deadline ? new Date(body.deadline) : null;

    // Validate numeric fields
    if (budget !== null && (!Number.isFinite(budget) || budget <= 0)) {
      throw new Error("Budget must be greater than zero.");
    }

    if (
      estimatedHours !== null &&
      (!Number.isFinite(estimatedHours) || estimatedHours < 0)
    ) {
      throw new Error("Estimated hours must be zero or greater.");
    }

    // Validate deadline
    if (deadline && Number.isNaN(deadline.getTime())) {
      throw new Error("Invalid deadline.");
    }

    // Enforce required fields for published work orders
    if (!isDraft) {
      if (!title || !description || !category || budget === null) {
        throw new Error(
          "Title, description, category, and budget are required.",
        );
      }

      if (!deadline || deadline.getTime() <= Date.now()) {
        throw new Error("Please select a future deadline.");
      }
    }

    return {
      title,
      description,
      category,
      budget,
      deadline,
      serviceType,
      skills,
      estimatedHours,
      submissionInstructions,
      allowEmptySubmission,
    };
  }

  // POST: Create a new work order (draft or published)
  app.post(
    "/api/work-orders",
    requireUser,
    requireRole("business"),
    async (req, res) => {
      try {
        const isDraft = req.body.status === "draft";

        // Validate status
        if (
          req.body.status !== undefined &&
          !["draft", "open"].includes(req.body.status)
        ) {
          return res.status(400).json({
            error: "New work orders must be drafts or open.",
          });
        }

        // Parse and validate fields
        const fields = parseWorkOrderFields(req.body, isDraft);

        // Create work order
        const workOrder = await WorkOrder.create({
          ...fields,
          status: isDraft ? "draft" : "open",
          businessId: req.userId,
        });

        return res.status(201).json(workOrder);
      } catch (error) {
        return res.status(400).json({
          error: error.message || "Unable to save work order.",
        });
      }
    },
  );

  // GET: Retrieve a specific work order by ID
  app.get("/api/work-orders/:id", async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Work order ID is not valid." });
      }
      const workOrder = await WorkOrder.findById(req.params.id)
        .populate("businessId", "businessProfile email")
        .populate("assignedStudentId", "studentProfile email");
      if (!workOrder || workOrder.status === "draft") {
        return res.status(404).json({
          error: "Work order was not found.",
        });
      }
      res.json(workOrder);
    } catch (error) {
      res.status(500).json({ error: "Error whilst fetching work order." });
    }
  });

  // ========================================================================
  // USER PROFILE ENDPOINTS
  // ========================================================================

  // GET: Retrieve a specific user's profile information
  app.get("/api/users/:id", requireUser, async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid user ID." });
      }

      // Users can only view their own profile
      if (String(id) !== req.userId) {
        return res.status(403).json({
          error: "You do not have permission to view this user.",
        });
      }

      const user = await User.findById(id).select("-passwordHash");

      if (!user) {
        return res.status(404).json({ error: "User was not found." });
      }

      return res.json(user);
    } catch (error) {
      return res.status(500).json({
        error: "Unable to retrieve user information.",
      });
    }
  });

  // ========================================================================
  // APPLICATION ENDPOINTS - Student Applications to Work Orders
  // ========================================================================

  // POST: Student submits an application to an open work order
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

        // Validate application message
        if (typeof message !== "string" || !message.trim()) {
          return res.status(400).json({
            error: "Please include an application message.",
          });
        }

        // Verify work order exists and is open
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

        // Prevent duplicate applications from same student
        const existingApplication = await Application.findOne({
          workOrderId: id,
          studentId: req.userId,
        });

        if (existingApplication) {
          return res.status(409).json({
            error: "You have already applied to this work order.",
          });
        }

        // Create application
        const application = await Application.create({
          workOrderId: id,
          studentId: req.userId,
          message: message.trim(),
        });

        // Notify business owner about new application
        await notify(
          workOrder.businessId,
          "application",
          "New application",
          "A student applied to " + workOrder.title,
          "/business-dashboard",
          "application:" + application._id,
        );
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

  // PATCH: Update pending application message (students only, before business decision)
  app.patch(
    "/api/applications/:id",
    requireUser,
    requireRole("student"),
    async (req, res) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
          return res.status(400).json({ error: "Invalid application ID." });
        }
        const message = req.body?.message;
        if (
          typeof message !== "string" ||
          !message.trim() ||
          message.length > 10000
        ) {
          return res
            .status(400)
            .json({ error: "Please enter a valid application message." });
        }
        // Atomic check ensures status is still pending before updating
        const application = await Application.findOneAndUpdate(
          { _id: req.params.id, studentId: req.userId, status: "pending" },
          { $set: { message: message.trim() } },
          { new: true, runValidators: true },
        );
        if (!application) {
          return res.status(409).json({
            error:
              "Application not found or no longer pending. Refresh to see its status.",
          });
        }
        return res.json(application);
      } catch (error) {
        console.error("Edit application error:", error);
        return res.status(500).json({ error: "Unable to edit application." });
      }
    },
  );

  // GET: Student retrieves their own submitted applications
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
            select:
              "title description category budget status businessId assignedStudentId submissionInstructions allowEmptySubmission",
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

  // GET: Business retrieves all applications to one of their work orders
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

        // Ensure business owns this work order
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

  // ========================================================================
  // APPLICATION REVIEW - Business Accepts/Rejects Applications
  // ========================================================================

  // PATCH: Business accepts or rejects an application
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

        const workOrder = await WorkOrder.findById(application.workOrderId);

        if (!workOrder) {
          return res.status(404).json({
            error: "Work order not found.",
          });
        }

        // Verify business owns this work order
        if (String(workOrder.businessId) !== req.userId) {
          return res.status(403).json({
            error: "You cannot manage applications for this work order.",
          });
        }

        // Check application hasn't already been reviewed
        if (application.status !== "pending") {
          return res.status(409).json({
            error: "This application has already been reviewed.",
          });
        }

        if (status === "accepted") {
          // Atomically update work order to assign student
          // This prevents race conditions if multiple applications are accepted simultaneously
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
              error:
                "This work order already has an assigned student or is no longer open.",
            });
          }

          // Mark this application as accepted
          application.status = "accepted";
          await application.save();

          await Thread.findOneAndUpdate(
            {
              workOrderId: workOrder._id,
            },
            {
              $setOnInsert: {
                workOrderId: workOrder._id,
                businessId: workOrder.businessId,
                studentId: application.studentId,
                messages: [],
              },
            },
            { upsert: true, new: true },
          );

          // Reject all other pending applications for this work order
          await Application.updateMany(
            {
              workOrderId: workOrder._id,
              _id: { $ne: application._id },
              status: "pending",
            },
            { $set: { status: "rejected" } },
          );

          // Notify accepted student
          await notify(
            application.studentId,
            "application_accepted",
            "Application accepted",
            "You were selected for " + workOrder.title,
            "/work-orders/" + workOrder._id,
            "application-accepted:" + application._id,
          );

          // Notify all rejected applicants
          const otherApplications = await Application.find({
            workOrderId: workOrder._id,
            _id: { $ne: application._id },
            status: "rejected",
          });
          await Promise.all(
            otherApplications.map((other) =>
              notify(
                other.studentId,
                "application_rejected",
                "Application not selected",
                "The position for " + workOrder.title + " has been filled",
                "/my-applications",
                "application-rejected:" + other._id,
              ),
            ),
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

        await notify(
          application.studentId,
          "application_rejected",
          "Application not selected",
          "Your application for " + workOrder.title + " was not selected",
          "/my-applications",
          "application-rejected:" + application._id,
        );
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

  // Completion is only possible through approving a submission.
  app.patch(
    "/api/business/work-orders/:id/complete",
    requireUser,
    requireRole("business"),
    (_req, res) => {
      return res.status(409).json({
        error:
          "Review and approve the student's latest submission to complete this work order.",
      });
    },
  );

  // Edit a draft, open, or in-progress work order.
  app.patch(
    "/api/business/work-orders/:id",
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

        const order = await WorkOrder.findOne({
          _id: id,
          businessId: req.userId,
        });

        if (!order) {
          return res.status(404).json({
            error: "Work order not found.",
          });
        }

        if (["completed", "closed"].includes(order.status)) {
          return res.status(409).json({
            error: "Completed or closed work orders cannot be edited.",
          });
        }

        // Editing never changes status or student assignment.
        const fields = parseWorkOrderFields(req.body, order.status === "draft");

        Object.assign(order, fields);
        await order.save();

        return res.json(order);
      } catch (error) {
        return res.status(400).json({
          error: error.message || "Unable to update work order.",
        });
      }
    },
  );

  // Publish an existing draft.
  app.patch(
    "/api/business/work-orders/:id/publish",
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

        const order = await WorkOrder.findOne({
          _id: id,
          businessId: req.userId,
        });

        if (!order) {
          return res.status(404).json({
            error: "Work order not found.",
          });
        }

        if (order.status !== "draft") {
          return res.status(409).json({
            error: "Only drafts can be published.",
          });
        }

        parseWorkOrderFields(order.toObject(), false);

        const published = await WorkOrder.findOneAndUpdate(
          {
            _id: id,
            businessId: req.userId,
            status: "draft",
          },
          { $set: { status: "open" } },
          { new: true, runValidators: true },
        );

        if (!published) {
          return res.status(409).json({
            error: "This draft has already been published or changed.",
          });
        }

        return res.json(published);
      } catch (error) {
        return res.status(400).json({
          error: error.message || "Unable to publish draft.",
        });
      }
    },
  );

  // Business deletes its own draft or open work order.
  // Open orders with applications cannot be deleted.
  app.delete(
    "/api/business/work-orders/:id",
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

        const workOrder = await WorkOrder.findOne({
          _id: id,
          businessId: req.userId,
        });

        if (!workOrder) {
          return res.status(404).json({
            error: "Work order not found.",
          });
        }

        if (!["draft", "open"].includes(workOrder.status)) {
          return res.status(409).json({
            error: "Only draft and open work orders can be deleted.",
          });
        }

        const applicationCount = await Application.countDocuments({
          workOrderId: id,
        });

        if (applicationCount > 0) {
          return res.status(409).json({
            error: "This work order has applications and cannot be deleted.",
          });
        }

        if (workOrder.assignedStudentId) {
          return res.status(409).json({
            error: "Assigned work orders cannot be deleted.",
          });
        }

        const deleted = await WorkOrder.findOneAndDelete({
          _id: id,
          businessId: req.userId,
          status: { $in: ["draft", "open"] },
          assignedStudentId: null,
        });

        if (!deleted) {
          return res.status(409).json({
            error: "Work order can no longer be deleted.",
          });
        }

        return res.json({
          message: "Work order deleted successfully.",
        });
      } catch (error) {
        console.error("Delete work order error:", error);

        return res.status(500).json({
          error: "Unable to delete work order.",
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
          ...new Set(skills.map((skill) => skill.trim()).filter(Boolean)),
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

          if (!Number.isInteger(year) || year < 1950 || year > 2100) {
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

        const updatedUser = await User.findByIdAndUpdate(req.userId, update, {
          new: true,
          runValidators: true,
        }).select("-passwordHash");

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
          .populate("businessId", "businessProfile.companyName");

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

  // The assigned student and owning business can view submission history.
  app.get("/api/work-orders/:id/submissions", requireUser, async (req, res) => {
    try {
      if (!validId(req.params.id))
        return res.status(400).json({ error: "Invalid work order ID." });
      const order = await WorkOrder.findById(req.params.id);
      if (!order)
        return res.status(404).json({ error: "Work order not found." });
      const isBusiness =
        req.user.role === "business" && String(order.businessId) === req.userId;
      const isStudent =
        req.user.role === "student" &&
        String(order.assignedStudentId) === req.userId;
      if (!isBusiness && !isStudent)
        return res
          .status(403)
          .json({ error: "Not authorized to view submissions." });
      const history = await WorkSubmission.find({
        workOrderId: order._id,
      }).sort({ submissionNumber: -1 });
      return res.json(history);
    } catch (err) {
      console.error("Submission history error:", err);
      return res.status(500).json({ error: "Unable to load submissions." });
    }
  });

  // Fetch message threads for user
  app.get("/api/threads", requireUser, async (req, res) => {
    try {
      const query =
        req.user.role === "business"
          ? { businessId: req.userId }
          : { studentId: req.userId };

      const threads = await Thread.find(query)
        .populate("workOrderId", "title status")
        .populate("businessId", "businessProfile.companyName email")
        .populate(
          "studentId",
          "studentProfile.firstName studentProfile.lastName email",
        )
        .sort({ updatedAt: -1 });

      const formatted = threads.map((t) => {
        const isBusiness = req.user.role === "business";
        const firstName = t.studentId?.studentProfile?.firstName || "";
        const lastName = t.studentId?.studentProfile?.lastName || "";
        const studentName = `${firstName} ${lastName}`.trim();

        const otherPerson = isBusiness
          ? studentName || t.studentId?.email || "Student"
          : t.businessId?.businessProfile?.companyName ||
            t.businessId?.email ||
            "Business";

        return {
          _id: t._id,
          workOrderId: t.workOrderId?._id,
          workOrderTitle: t.workOrderId?.title || "Work Order",
          otherPerson,
          messages: t.messages || [],
        };
      });

      return res.json(formatted);
    } catch (error) {
      console.error("Fetch threads error:", error);
      return res.status(500).json({ error: "Unable to load messages." });
    }
  });

  // Posts new message to thread
  app.post("/api/threads/:id/messages", requireUser, async (req, res) => {
    try {
      if (!validId(req.params.id)) {
        return res.status(400).json({ error: "Invalid thread ID." });
      }

      const text =
        typeof req.body.text === "string" ? req.body.text.trim() : "";
      if (!text) {
        return res.status(400).json({ error: "Message cannot be empty." });
      }
      if (text.length > 2000) {
        return res
          .status(400)
          .json({ error: "Message is too long (max 2000 characters)." });
      }

      const thread = await Thread.findById(req.params.id);
      if (!thread) {
        return res.status(404).json({ error: "Conversation not found." });
      }

      // Verify the logged-in user is either the business or student on this thread
      const isMember =
        String(thread.businessId) === req.userId ||
        String(thread.studentId) === req.userId;
      if (!isMember) {
        return res
          .status(403)
          .json({ error: "Not authorized to post in this conversation." });
      }

      thread.messages.push({
        senderId: req.userId,
        text,
        sentAt: new Date(),
      });

      await thread.save();

      const savedMessage = thread.messages[thread.messages.length - 1];
      return res.status(201).json(savedMessage);
    } catch (error) {
      console.error("Send message error:", error);
      return res.status(500).json({ error: "Unable to send message." });
    }
  });

  // Multipart/form-data: notes, projectUrl, and repeated files fields.
  app.post(
    "/api/work-orders/:id/submissions",
    requireUser,
    requireRole("student"),
    receiveFiles,
    async (req, res) => {
      let saved = false;
      try {
        if (!validId(req.params.id))
          return res.status(400).json({ error: "Invalid work order ID." });
        const order = await WorkOrder.findById(req.params.id);
        if (!order)
          return res.status(404).json({ error: "Work order not found." });
        if (
          order.status !== "in_progress" ||
          String(order.assignedStudentId) !== req.userId
        ) {
          return res.status(403).json({
            error:
              "Only the assigned student can submit to an in-progress work order.",
          });
        }
        const notes =
          typeof req.body.notes === "string" ? req.body.notes.trim() : "";
        const projectUrl =
          typeof req.body.projectUrl === "string"
            ? req.body.projectUrl.trim()
            : "";
        if (
          notes.length > 10000 ||
          projectUrl.length > 2048 ||
          !validProjectUrl(projectUrl)
        ) {
          return res
            .status(400)
            .json({ error: "Invalid notes or project URL." });
        }
        const hasNotes = Boolean(String(notes || "").trim());
        const hasProjectUrl = Boolean(String(projectUrl || "").trim());
        const hasFiles = (req.files?.length || 0) > 0;

        if (
          !order.allowEmptySubmission &&
          !hasNotes &&
          !hasProjectUrl &&
          !hasFiles
        ) {
          return res.status(400).json({
            error:
              "This work order requires notes, a project link, or an attachment.",
          });
        }
        const latest = await WorkSubmission.findOne({
          workOrderId: order._id,
        }).sort({ submissionNumber: -1 });
        if (latest && latest.status !== "changes_requested") {
          return res
            .status(409)
            .json({ error: "Wait for feedback before resubmitting." });
        }
        const submission = await WorkSubmission.create({
          workOrderId: order._id,
          studentId: req.userId,
          submissionNumber: latest ? latest.submissionNumber + 1 : 1,
          notes,
          projectUrl,
          attachments: (req.files || []).map((file) => ({
            originalName: path.basename(file.originalname),
            storageName: file.filename,
            mimeType: file.mimetype,
            size: file.size,
          })),
        });
        saved = true;
        await notify(
          order.businessId,
          "submission",
          "Work submitted for review",
          "A student submitted work for " + order.title,
          "/business/work-orders/" + order._id + "/submissions",
          "submission:" + submission._id,
        );
        return res.status(201).json(submission);
      } catch (err) {
        if (err.code === 11000)
          return res.status(409).json({
            error: "A submission was already created. Refresh and try again.",
          });
        console.error("Submission create error:", err);
        return res.status(500).json({ error: "Unable to submit work." });
      } finally {
        if (!saved) await cleanupUploads(req.files);
      }
    },
  );

  app.patch(
    "/api/submissions/:id/review",
    requireUser,
    requireRole("business"),
    async (req, res) => {
      try {
        if (!validId(req.params.id))
          return res.status(400).json({ error: "Invalid submission ID." });
        const { status } = req.body;
        const feedback =
          typeof req.body.feedback === "string" ? req.body.feedback.trim() : "";
        if (!["approved", "changes_requested"].includes(status))
          return res.status(400).json({ error: "Invalid review status." });
        if (status === "changes_requested" && !feedback)
          return res
            .status(400)
            .json({ error: "Feedback is required when requesting changes." });
        if (feedback.length > 10000)
          return res.status(400).json({ error: "Feedback is too long." });
        const submission = await WorkSubmission.findById(req.params.id);
        if (!submission)
          return res.status(404).json({ error: "Submission not found." });
        const order = await WorkOrder.findOne({
          _id: submission.workOrderId,
          businessId: req.userId,
          status: "in_progress",
        });
        if (!order)
          return res
            .status(403)
            .json({ error: "This work order is not available for review." });
        const latest = await WorkSubmission.findOne({
          workOrderId: order._id,
        }).sort({ submissionNumber: -1 });
        if (
          !latest ||
          String(latest._id) !== String(submission._id) ||
          submission.status !== "pending_review"
        ) {
          return res.status(409).json({
            error: "Only the latest pending submission can be reviewed.",
          });
        }
        const updated = await WorkSubmission.findOneAndUpdate(
          { _id: submission._id, status: "pending_review" },
          { $set: { status, feedback, reviewedAt: new Date() } },
          { new: true },
        );
        if (!updated)
          return res
            .status(409)
            .json({ error: "This submission has already been reviewed." });
        if (status === "approved") {
          const completed = await WorkOrder.findOneAndUpdate(
            {
              _id: order._id,
              businessId: req.userId,
              status: "in_progress",
              assignedStudentId: submission.studentId,
            },
            { $set: { status: "completed" } },
            { new: true },
          );
          if (!completed)
            return res.status(409).json({
              error:
                "Submission approved, but the work order could not be completed. Contact an administrator.",
            });
          await notify(
            submission.studentId,
            "submission_approved",
            "Work approved",
            "Your work for " + order.title + " was approved",
            "/student/work-orders/" + order._id + "/submit",
            "review:" + submission._id,
          );
          return res.json({ submission: updated, workOrder: completed });
        }
        await notify(
          submission.studentId,
          "changes_requested",
          "Changes requested",
          "The business requested changes to " + order.title,
          "/student/work-orders/" + order._id + "/submit",
          "review:" + submission._id,
        );
        return res.json({ submission: updated });
      } catch (err) {
        console.error("Submission review error:", err);
        return res.status(500).json({ error: "Unable to review submission." });
      }
    },
  );

  // Download only after checking membership of the owning business or assigned student.
  app.get(
    "/api/submissions/:submissionId/attachments/:attachmentId",
    requireUser,
    async (req, res) => {
      try {
        const { submissionId, attachmentId } = req.params;
        if (!validId(submissionId) || !validId(attachmentId))
          return res.status(400).json({ error: "Invalid attachment ID." });
        const submission = await WorkSubmission.findById(submissionId);
        if (!submission)
          return res.status(404).json({ error: "Submission not found." });
        const order = await WorkOrder.findById(submission.workOrderId);
        if (!order)
          return res.status(404).json({ error: "Work order not found." });
        const allowed =
          (req.user.role === "business" &&
            String(order.businessId) === req.userId) ||
          (req.user.role === "student" &&
            String(order.assignedStudentId) === req.userId);
        if (!allowed)
          return res
            .status(403)
            .json({ error: "Not authorized to download this file." });
        const attachment = submission.attachments.id(attachmentId);
        if (!attachment)
          return res.status(404).json({ error: "Attachment not found." });
        const filePath = path.join(uploadDirectory, attachment.storageName);
        if (!/^[a-f0-9]{40}$/.test(attachment.storageName))
          return res.status(400).json({ error: "Invalid stored filename." });
        return res.download(filePath, attachment.originalName, (err) => {
          if (err && !res.headersSent)
            res.status(404).json({ error: "File not found on server." });
        });
      } catch (err) {
        console.error("Attachment download error:", err);
        return res
          .status(500)
          .json({ error: "Unable to download attachment." });
      }
    },
  );

  // Private work-order conversations. Only applicants and the owning business participate.
  async function conversationAccess(req, res, next) {
    try {
      if (!validId(req.params.id))
        return res.status(400).json({ error: "Invalid work order ID." });
      const order = await WorkOrder.findById(req.params.id);
      if (!order || order.status === "draft")
        return res.status(404).json({ error: "Work order not found." });
      if (
        req.user.role === "business" &&
        String(order.businessId) === req.userId
      ) {
        req.conversationOrder = order;
        return next();
      }
      if (req.user.role === "student") {
        const application = await Application.exists({
          workOrderId: order._id,
          studentId: req.userId,
        });
        if (application) {
          req.conversationOrder = order;
          return next();
        }
      }
      return res.status(403).json({
        error:
          "Only an applicant or the owning business can access these messages.",
      });
    } catch (error) {
      console.error("Conversation access error:", error);
      return res
        .status(500)
        .json({ error: "Unable to verify conversation access." });
    }
  }

  app.get(
    "/api/work-orders/:id/conversations",
    requireUser,
    requireRole("business"),
    conversationAccess,
    async (req, res) => {
      try {
        const applications = await Application.find({
          workOrderId: req.conversationOrder._id,
        })
          .populate(
            "studentId",
            "studentProfile.firstName studentProfile.lastName email",
          )
          .sort({ createdAt: -1 });
        return res.json(
          applications
            .map((a) => ({
              studentId: a.studentId?._id,
              name:
                [
                  a.studentId?.studentProfile?.firstName,
                  a.studentId?.studentProfile?.lastName,
                ]
                  .filter(Boolean)
                  .join(" ") ||
                a.studentId?.email ||
                "Student",
              applicationStatus: a.status,
            }))
            .filter((a) => a.studentId),
        );
      } catch (error) {
        console.error("Conversation list error:", error);
        return res.status(500).json({ error: "Unable to load conversations." });
      }
    },
  );

  async function resolveConversation(req, res, next) {
    const studentId =
      req.user.role === "student"
        ? req.userId
        : req.query.studentId || req.body?.studentId;
    if (!validId(studentId))
      return res
        .status(400)
        .json({ error: "Select a valid student conversation." });
    if (req.user.role === "business") {
      const applied = await Application.exists({
        workOrderId: req.conversationOrder._id,
        studentId,
      });
      if (!applied)
        return res
          .status(403)
          .json({ error: "That student has not applied to this work order." });
    }
    req.conversationStudentId = studentId;
    next();
  }

  app.get(
    "/api/work-orders/:id/messages",
    requireUser,
    conversationAccess,
    resolveConversation,
    async (req, res) => {
      try {
        const messages = await Message.find({
          workOrderId: req.conversationOrder._id,
          studentId: req.conversationStudentId,
        })
          .sort({ createdAt: 1 })
          .limit(500)
          .lean();
        return res.json(messages);
      } catch (error) {
        console.error("Load messages error:", error);
        return res.status(500).json({ error: "Unable to load messages." });
      }
    },
  );

  app.post(
    "/api/work-orders/:id/messages",
    requireUser,
    conversationAccess,
    resolveConversation,
    async (req, res) => {
      try {
        const body = req.body?.body;
        if (
          typeof body !== "string" ||
          !body.trim() ||
          body.trim().length > 5000
        ) {
          return res
            .status(400)
            .json({ error: "Enter a message between 1 and 5000 characters." });
        }
        const message = await Message.create({
          workOrderId: req.conversationOrder._id,
          studentId: req.conversationStudentId,
          senderId: req.userId,
          senderRole: req.user.role,
          body: body.trim(),
        });
        const recipientId =
          req.user.role === "student"
            ? req.conversationOrder.businessId
            : req.conversationStudentId;
        const link =
          req.user.role === "student"
            ? "/business/work-orders/" +
              req.conversationOrder._id +
              "/messages?studentId=" +
              req.conversationStudentId
            : "/work-orders/" + req.conversationOrder._id + "?tab=messages";
        await notify(
          recipientId,
          "message",
          "New message",
          "You received a message about " + req.conversationOrder.title,
          link,
          "message:" + message._id,
        );
        return res.status(201).json(message);
      } catch (error) {
        console.error("Send message error:", error);
        return res.status(500).json({ error: "Unable to send message." });
      }
    },
  );

  // Reports are private and are not automatically shared with the reported business.
  app.post(
    "/api/work-orders/:id/reports",
    requireUser,
    requireRole("student"),
    async (req, res) => {
      try {
        if (!validId(req.params.id))
          return res.status(400).json({ error: "Invalid work order ID." });
        const order = await WorkOrder.findById(req.params.id);
        if (!order || order.status === "draft")
          return res.status(404).json({ error: "Work order not found." });
        const reason = req.body?.reason;
        const description = req.body?.description;
        if (
          !["communication", "payment", "scope", "conduct", "other"].includes(
            reason,
          )
        ) {
          return res
            .status(400)
            .json({ error: "Choose a valid report reason." });
        }
        if (
          typeof description !== "string" ||
          description.trim().length < 10 ||
          description.trim().length > 5000
        ) {
          return res.status(400).json({
            error: "Description must be between 10 and 5000 characters.",
          });
        }
        const report = await Report.create({
          workOrderId: order._id,
          studentId: req.userId,
          reason,
          description: description.trim(),
        });
        return res.status(201).json({
          _id: report._id,
          status: report.status,
          createdAt: report.createdAt,
        });
      } catch (error) {
        console.error("Report submission error:", error);
        return res.status(500).json({ error: "Unable to submit report." });
      }
    },
  );

  app.get(
    "/api/reports/my",
    requireUser,
    requireRole("student"),
    async (req, res) => {
      try {
        return res.json(
          await Report.find({ studentId: req.userId })
            .sort({ createdAt: -1 })
            .select("workOrderId reason description status createdAt"),
        );
      } catch (error) {
        return res.status(500).json({ error: "Unable to load reports." });
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
