require('dotenv').config();
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;
const token = jwt.sign(
  { userId: 'admin', username: 'admin', email: 'admin@soc.local', role: 'ADMIN', roleId: 'admin' },
  secret,
  { expiresIn: '365d' }
);
console.log(token);
process.exit(0);
