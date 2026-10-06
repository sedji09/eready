// Default export middleware that ensures the user is authenticated
// and attaches req.user for downstream handlers.
// Adjust the session/JWT retrieval logic as needed for your app.

module.exports = function auth(req, res, next) {
  try {
    // Session-based example: expects req.session.user to be set at login
    if (req.session && req.session.user) {
      // Normalize to ensure id and username are present for auditing
      const { id, username, ...rest } = req.session.user || {};
      if (!id || !username) {
        // If essential fields are missing, still pass the session object
        req.user = req.session.user;
      } else {
        req.user = { id, username, ...rest };
      }
      return next();
    }

    // If you use JWT, place your token verification here and set req.user accordingly.
    // Example skeleton (disabled by default):
    // const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    // if (token) {
    //   const payload = jwt.verify(token, process.env.JWT_SECRET);
    //   req.user = { id: payload.id, username: payload.username };
    //   return next();
    // }

    // Block unauthenticated access
    return res.status(401).json({ error: 'Unauthorized' });
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};
