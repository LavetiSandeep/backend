const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // or use bcryptjs if needed

const participantSchema = new mongoose.Schema({
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


// Pre-save hook to hash the password before saving
participantSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare a candidate password with the stored hash
participantSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Participant', participantSchema);
