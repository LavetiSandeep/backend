const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // or use bcryptjs if needed

const participantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  submittedcode: { type: String, default:null},
  level1Score: { type: Number, default: 0 } ,
  level2Score: { type: Number, default: 0 },
  level3Score: { type: Number, default: 0 },
  finalScore: { type: Number, default: 0 },
  level1submissiontime: { type: String, default:null},
  level2submissiontime: { type: String, default:null},
  level3submissiontime: { type: String, default:null},
  passed: { type: Number, default: 0 },
  failed: { type: Number, default: 0 }, // New field for Level 1 score
});


module.exports = mongoose.model('Participant', participantSchema);
