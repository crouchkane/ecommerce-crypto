const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const generateVerificationCode = () => {
  return Math.random().toString().substring(2, 8);
};

module.exports = {
  hashPassword,
  comparePassword,
  generateRandomToken,
  generateVerificationCode,
};
