const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const fs = require('fs');

const env = require('./config/env');
const v1Routes = require('./routes/v1');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { protectCsrf } = require('./middleware/csrf');

const app = express();

// The deployed app sits behind one reverse proxy (for example Vercel). This
// makes req.ip represent the visitor rather than the proxy for IP lockouts.
app.set('trust proxy', 1);

// Security headers (Helmet) + CORS restricted to the storefront's origin,
// since cookies are used for auth (credentials: true requires an explicit
// origin rather than "*").
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.clientUrls.includes(origin.replace(/\/$/, ''))) return callback(null, true);
      return callback(new Error('Origin is not allowed by CORS.'));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.cookieSecret));
app.use(protectCsrf);
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

// UPLOAD_DIR points at the Render persistent-disk mount in production and
// at the repository's uploads directory locally.
fs.mkdirSync(env.uploadDir, { recursive: true });
app.use('/uploads', express.static(env.uploadDir));

app.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));

app.use('/api/v1', v1Routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
