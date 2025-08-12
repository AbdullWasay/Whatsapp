const cors = require('cors');

module.exports = cors({
  origin:process.env.FRONTEND_URL,
});
