/*require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const compilex = require('compilex');
const cp = require('child_process');
const { MongoClient } = require('mongodb');
const connectDB = require('./servx.js'); // Custom module to connect to your DB
const Participant = require('./models/Participant'); // Ensure this file exports your Participant model
const mongoose = require('mongoose');
const authRoutes = require('./routes');
const app = express();
const PORT = 5000;

// Connect to the database using your custom connectDB function
connectDB();
console.log("Environment variables:", process.env);

// Additionally, connect using MongoClient to verify connection (optional)
MongoClient.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected successfully via MongoClient");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

// CORS configuration (adjust origin if necessary)
const corsOptions = {
  origin: "http://localhost:5173", // Allow frontend origin
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize compilex (using temporary directory and stats enabled)
compilex.init({ stats: true });

// Monkey-patch child_process.exec to replace "./" with ".\\" on Windows
const originalExec = cp.exec;
cp.exec = function(command, options, callback) {
  if (process.platform === "win32" && command.startsWith("./")) {
    command = command.replace(/^\.\/+/, ".\\");
  }
  return originalExec(command, options, callback);
};

// Environment data for Windows using gcc
let envData = { OS: "windows", cmd: "gcc" };

// Compile C code endpoint using compilex
app.post("/compilecode", (req, res) => {
  try {
    const { code, input, inputRadio, lang } = req.body;
    console.log("Received code:", code);

    if (!code) {
      return res.status(400).json({ error: "No code provided" });
    }
    if (lang !== "C") {
      return res.status(400).json({ error: "Unsupported language" });
    }

    // Callback to handle compilation results
    const handleCompile = (data) => {
      if (data.error) {
        console.error("Compilation Error:", data.error);
        return res.status(400).json({ error: data.error });
      }
      // Return the compilation output
      res.json({ output: data.output });
    };

    // Use compileCPP functions even for C code (gcc can handle both C and C++ code)
    if (inputRadio === "true") {
      compilex.compileCPPWithInput(envData, code, input, handleCompile);
    } else {
      compilex.compileCPP(envData, code, handleCompile);
    }
  } catch (error) {
    console.error("Unexpected Server Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Registration Endpoint: Save participant email and password
app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    // Check if a participant already exists with that email
    const existingParticipant = await Participant.findOne({ email });
    if (existingParticipant) {
      return res.status(400).json({ error: "A participant with this email already exists." });
    }

    // Create and save the new participant (password is hashed in the pre-save hook)
    const participant = new Participant({ email, password });
    await participant.save();

    res.status(201).json({ message: "Registration successful." });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error during registration." });
  }
});

// Basic route to check server status
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Cleanup: flush temporary files on process exit
process.on("exit", () => {
  compilex.flush(() => {
    console.log("Temporary files deleted.");
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
*/
const cp = require('child_process');
const originalExec = cp.exec;
cp.exec = function(command, options, callback) {
  if (process.platform === "win32" && command.startsWith("./")) {
    command = command.replace(/^\.\/+/, ".\\");
  }
  return originalExec(command, options, callback);
};

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const compilex = require('compilex');
// import compiler from compilex;
// const cp = require('child_process');
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const Participant = require('./models/Participant'); // Our model
const connectDB = require('./servx.js'); // Your custom DB connection module, if you have one

const app = express();
const PORT = 5000;

// Connect to the database using your custom connectDB function (if available)
connectDB();
console.log("Environment variables:", process.env);

// Optionally, verify connection using MongoClient
MongoClient.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected successfully via MongoClient");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

// CORS configuration
const corsOptions = {
  origin: "http://localhost:5173", // Allow your frontend origin
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize compilex (if needed for code compilation)
compilex.init({ stats: true, tempDir: "temp", });

// // Monkey-patch child_process.exec for Windows (if needed)
// const cp = require('child_process');
// const originalExec = cp.exec;
// cp.exec = function(command, options, callback) {
//   if (process.platform === "win32" && command.startsWith("./")) {
//     // Replace leading "./" with ".\"
//     command = command.replace(/^\.\/+/, ".\\");
//   }
//   return originalExec(command, options, callback);
// };

// Environment data for Windows using gcc (for compilex)
let envData = { OS: "windows", cmd: "g++" ,options: { timeout: 5000 }};

app.post("/api/update-level2score", async (req, res) => {
  const { email, level2Score } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  if (typeof level2Score !== "number") {
    return res.status(400).json({ message: "Invalid score value" });
  }

  try {
    const updatedParticipant = await Participant.findOneAndUpdate(
      { email },
      { $set: { level2Score } },
      { new: true, runValidators: true }
    );

    if (!updatedParticipant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    res.status(200).json({
      message: "Level 2 score updated successfully",
      participant: updatedParticipant,
    });
  } catch (error) {
    console.error("Error updating level2 score:", error);
    res.status(500).json({ message: "Server error", error });
  }
});
app.get("/api/get-scores", async (req, res) => {
  const { email } = req.query; // email passed as a query parameter
  
  if (!email) {
    return res.status(400).json({ message: "Email parameter is required" });
  }

  try {
    const participant = await Participant.findOne({ email });
    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }
    participant.finalScore=participant.level1Score+ participant.level2Score;
    await participant.save();


    res.status(200).json({
      level1Score: participant.level1Score,
      level2Score: participant.level2Score,
      finalScore:participant.finalScore,
    });
  } catch (error) {
    console.error("Error retrieving scores:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Compile C code endpoint using compilex (if required)
app.post("/compilecode", (req, res) => {
  try {
    const { code, input, inputRadio, lang } = req.body;
    console.log("Received code:", code);

    if (!code) {
      return res.status(400).json({ error: "No code provided" });
    }
    if (lang !== "C") {
      return res.status(400).json({ error: "Unsupported language" });
    }

    const handleCompile = (data) => {
        console.log(data);
      if (data.error) {
        console.error("Compilation Error:", data.error);
        return res.status(400).json({ error: data.error });
      }
      res.json({ output: data.output });
    };

    if (inputRadio === "true") {
      compilex.compileCPPWithInput(envData, code, input, handleCompile);
    } else {
      compilex.compileCPP(envData, code, handleCompile);
    }
  } catch (error) {
    console.error("Unexpected Server Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Registration Endpoint: Save participant email and password
app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    // Check if a participant already exists with that email
    const existingParticipant = await Participant.findOne({ email });
    if (existingParticipant) {
      return res.status(400).json({ error: "A participant with this email already exists." });
    }

    // Create and save the new participant (password will be hashed automatically)
    const participant = new Participant({ email, password });
    await participant.save();

    res.status(201).json({ message: "Registration successful." });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error during registration." });
  }
});

// Basic route to check server status
app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.post("/api/update-score", async (req, res) => {
  const { email, level1Score } = req.body;
  console.log("score",level1Score);

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // const user = await Participant.findOne({ email });

    const updatedUser = await Participant.findOneAndUpdate(
      { email }, // Find participant by email
      { $set: { level1Score } }, // Force update level1Score
      { new: true, runValidators: true } // Return updated document
    );

    res.status(200).json({
      message: "Score updated successfully",
      participant: updatedUser,
    });
  } catch (error) {
    console.error("Error updating score:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    // Find user by email
    const user = await Participant.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare password (assuming passwords are hashed)
    if (password.trim() === user.password.trim()) {
      res.status(200).json({ 
        message: "Login successful", 
        email: user.email 
      });
    } else {
      return res.status(400).json({ message: "Check your password" });
    }
    
       

    // res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Cleanup: flush compilex temporary files on process exit
process.on("exit", () => {
  compilex.flush(() => {
    console.log("Temporary files deleted.");
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
