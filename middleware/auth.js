// middleware/auth.js
function isLoggedIn(req, res, next) {
  // Check if authentication method exists and user is authenticated
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  // Check for API requests
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Redirect for regular browser requests
  return res.redirect('/users/login');
}

module.exports = { isLoggedIn };