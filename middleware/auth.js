const jwt = require('jsonwebtoken');
const config = require('config');
const res = require('express/lib/response');

module.exports = (req, res, next) => {
  const token = req.header('x-auth-token');

  if (!token) {
    return res
      .status(401)
      .json({ errors: [{ msg: 'no token, authorization denied' }] });
  }

  try {
    const decoded = jwt.verify(token, config.get('jwtSecret'));

    req.user = decoded.user;
    next();
  } catch (error) {
    return res.status(401).json({ errors: [{ msg: 'token is invalid' }] });
  }
};
