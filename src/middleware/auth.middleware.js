const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { ApiError } = require('../utils/apiError');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Unauthorized, no token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    req.user = decoded; // { id, role, phone }
    next();
  } catch (error) {
    next(new ApiError(401, 'Unauthorized, invalid token'));
  }
};

module.exports = authenticate;
