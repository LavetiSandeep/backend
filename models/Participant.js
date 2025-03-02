const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // or use bcryptjs if needed

const participantSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true }
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
