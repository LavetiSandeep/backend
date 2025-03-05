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
const fs = require("fs");


fs.rmSync("./temp", { recursive: true, force: true });

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
const { MongoClient, ConnectionCheckOutFailedEvent } = require('mongodb');
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

    const currentTime = new Date().toTimeString().split(" ")[0];
    const updatedParticipant = await Participant.findOneAndUpdate(
      { email },
      {  $set: { 
        level2Score, 
        level2submissiontime: currentTime // Store only the time
      }  },
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


app.post("/updateCode", async (req, res) => {
  const { email, submittedCode } = req.body;

  if (!email || !submittedCode) {
    return res.status(400).json({ message: "Email and code are required." });
  }

  try {
    const updatedParticipant = await Participant.findOneAndUpdate(
      { email },
      { $set: { submittedcode: submittedCode} },
      { new: true, runValidators: true }
    );

    if (!updatedParticipant) {
      return res.status(404).json({ message: "Participant not found." });
    }
    console.log("Myrecord",updatedParticipant);
    res.json({ message: "Code updated successfully", updatedParticipant });
  } catch (error) {
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
app.post("/compilecode", (
  req, res) => {
  try {
    let { code, input, inputRadio, lang } = req.body;
    console.log("Received code:", code);
    console.log("Received code:", input);
    console.log("Received code:", inputRadio);
    console.log("Received code:", lang);
    
    if (!code) {
      return res.status(400).json({ error: "No code provided" });
    }
    if (lang !== "C") {
      return res.status(400).json({ error: "Unsupported language" });
    }

    const handleCompile = (data) => {
      if (!data) {
          console.error("Compilation failed: No response data received.");
          return res.status(500).json({ error: "Compilation service error." });
      }
      if (data.error) {
          console.error("Compilation Error:", data.error);
          return res.status(400).json({ error: data.error });
      }
      res.json({ output: data.output });
  };

    if (inputRadio === true) {  
      console.log("selftest");
      if (typeof input !== "string") {
        input = String(input); // Convert to string
      }

      compilex.compileCPPWithInput(envData, code, input, handleCompile);
    } else {
      compilex.compileCPP(envData, code, handleCompile);
    }
  } catch (error) {
    console.error("Unexpected Server Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/leaderboard", async (req, res) => {
  try {
    const leaderboard = await Participant.find()
      .sort([
        ["level3Score", -1],            // Highest Level 3 score first
        ["level3submissiontime", 1],    // If same Level 3 score, earliest submission wins
        ["finalScore", -1],             // If no Level 3 score, use finalScore
        ["level2submissiontime", 1],    // If same finalScore, earliest Level 2 submission wins
        ["level1Score", -1],            // If no finalScore, use level1Score
        ["level1submissiontime", 1]     // If same Level 1 score, earliest Level 1 submission wins
      ])
      .select("email level3Score level3submissiontime finalScore level2submissiontime level1Score level1submissiontime")
      .limit(10); // Get top 10 participants

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

app.post("/submitcode", async (req, res) => {
  try {
    console.log("Received request:", req.body); // Debugging

    const { code, testCases, lang ,email} = req.body;
    if (!code || !testCases || !Array.isArray(testCases) || lang !== "C") {
      console.error("Invalid input data");
      return res.status(400).json({ error: "Invalid input data" });
    }

    let passed = 0;
    let failed = 0;

    const envData = { OS: "windows", cmd: "g++", options: "-o output.exe" };

    const runTest = (testCase) => {
      return new Promise((resolve, reject) => {
        compilex.compileCPPWithInput(envData, code, testCase.input, (data) => {
          if (!data) {
            console.error("Compilation failed: No response data received.");
            return reject("Compilation failed: No response data received.");
          }
          if (data.error) {
            console.error("Compilation Error:", data.error);
            return reject(`Compilation Error: ${data.error}`);
          }
          if (!data.output) {
            console.error("Execution Error: No output received.");
            return reject("Execution Error: No output received.");
          }

          try {
            const output = data.output.trim();
            const expected = testCase.expectedOutput.trim();
            console.log("Output:", output);
            console.log("Expected:", expected);

            if (output === expected) {
              passed++;
              console.log("Pass:", passed);
            } else {
              failed++;
              console.log("Fail:", failed);
            }
            console.log("Trimmed Output:", output);
            resolve();
          } catch (err) {
            console.error("Error processing output:", err.message);
            reject(err);
          }
        });
      });
    };

    // Run all test cases concurrently and wait for all to complete
    await Promise.all(testCases.map((testCase) => runTest(testCase)));

    console.log("Final Count - Passed:", passed, "Failed:", failed);
    if (passed === testCases.length) {
      const score = passed * 10;
    
      try {
        // Debugging: Check if email exists
        const existingUser = await Participant.findOne({ email: email });
        if (!existingUser) {
          console.error("User not found in database:", email);
          return res.status(404).json({ error: "User not found" });
        }
    
        console.log("User found, updating score...");
        const currentTime = new Date().toTimeString().split(" ")[0];
        // Update level3Score
        const updatedParticipant = await Participant.findOneAndUpdate(
          { email: email },
          { $set: { 
            level3Score: score,
            submittedcode: code,
            level3submissiontime:currentTime,
            passed:passed,
            failed:failed
          }  },
          { new: true } // Return the updated document
        );
       
    
        if (!updatedParticipant) {
          console.error("Failed to update score for:", email);
          return res.status(500).json({ error: "Score update failed" });
        }
    
        console.log("Score updated successfully:", updatedParticipant);
      } catch (error) {
        console.error("Database error while updating score:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    }
    else{
      const score = passed * 10;
      const existingUser = await Participant.findOne({ email: email });
      if (!existingUser) {
        console.error("User not found in database:", email);
        return res.status(404).json({ error: "User not found" });
      }
      const updated = await Participant.findOneAndUpdate(
        { email: email },
        { $set: { 
          level3Score: score,
          submittedcode: code,
          passed:passed,
          failed:failed
        }  },
        { new: true } // Return the updated document
      );
    }

    res.json({
      message: passed === testCases.length ? "Success" : "Some test cases failed",
      nopass: passed,
      nofail: failed, 
      score:passed*10,
    });
  } catch (error) {
    console.error("Unexpected Server Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/getLevel3Score", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await Participant.findOne({ email: email });
    console.log(user);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ pass:user.passed, fail:user.failed, code:user.submittedcode, level3Score: user.level3Score || 0 }); // Return score, default to 0 if not found
  } catch (error) {
    console.error("Error fetching level3Score:", error);
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

    const currentTime = new Date().toTimeString().split(" ")[0];
    const updatedUser = await Participant.findOneAndUpdate(
    { email }, // Find participant by email
      { 
        $set: { 
          level1Score, 
          level1submissiontime: currentTime // Store current timestamp
        } 
      },
      { new: true, runValidators: true }   );

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
