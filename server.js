require('dotenv').config();
const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_KEY in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

app.use(express.json());

// ─── Swagger Configuration ──────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth Login Protect API',
      version: '1.0.0',
      description:
        'Secure authentication API using Supabase Auth and JWT verification. ' +
        'Use the /auth/signup and /auth/login endpoints to obtain a Bearer token, ' +
        'then click **Authorize** above and paste the token to access protected routes.',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste the access_token you received from /auth/login',
        },
      },
    },
  },
  apis: ['./server.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Extract the Bearer token from the Authorization header.
 */
function getBearerToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return null;
  }
  return header.slice(7).trim();
}

/**
 * Middleware: verify the JWT via Supabase and attach req.user.
 */
async function verifyToken(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = data.user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

// ─── Public Routes ──────────────────────────────────────────────────

/**
 * @openapi
 * /public/info:
 *   get:
 *     tags:
 *       - Public
 *     summary: Public information endpoint
 *     description: Returns publicly available data. No authentication required.
 *     responses:
 *       200:
 *         description: Public data returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Welcome stranger! This info is public.
 */
app.get('/public/info', (req, res) => {
  res.json({ message: 'Welcome stranger! This info is public.' });
});

// ─── Auth Routes ────────────────────────────────────────────────────

/**
 * @openapi
 * /auth/signup:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Sign up a new user
 *     description: Creates a new user account via Supabase Auth. Returns user data and session.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongPassword123!
 *     responses:
 *       200:
 *         description: User signed up successfully
 *       400:
 *         description: Invalid request or signup error
 *       500:
 *         description: Internal server error
 */
app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      message: 'User signed up successfully',
      user: data.user,
      session: data.session,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Signup failed' });
  }
});

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Log in an existing user
 *     description: >
 *       Authenticates a user via Supabase Auth and returns a JWT access token.
 *       Copy the `access_token` from the response and paste it into the
 *       **Authorize** dialog to access protected endpoints.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongPassword123!
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 access_token:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      message: 'User logged in successfully',
      access_token: data.session?.access_token,
      user: data.user,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Log out the current user
 *     description: >
 *       Terminates the user session. The server verifies the token is valid,
 *       then instructs the client to discard it. In a stateless JWT architecture
 *       the client must delete the token on its side.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: User logged out successfully (no content)
 *       401:
 *         description: Missing or invalid token
 *       500:
 *         description: Internal server error
 */
app.post('/auth/logout', verifyToken, async (req, res) => {
  try {
    // The middleware already verified the token is valid.
    // Call Supabase signOut then return 204 No Content.
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('Supabase signOut warning:', error.message);
    }

    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Logout failed' });
  }
});

// ─── Protected Routes ───────────────────────────────────────────────

/**
 * @openapi
 * /protected/profile:
 *   get:
 *     tags:
 *       - Protected
 *     summary: Get the authenticated user's profile
 *     description: >
 *       Returns private profile data for the currently authenticated user.
 *       Requires a valid Bearer token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                     last_sign_in_at:
 *                       type: string
 *       401:
 *         description: Missing or invalid token
 */
app.get('/protected/profile', verifyToken, (req, res) => {
  res.json({
    message: 'Protected profile data',
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      created_at: req.user.created_at,
      last_sign_in_at: req.user.last_sign_in_at,
    },
  });
});

/**
 * @openapi
 * /protected/dashboard:
 *   get:
 *     tags:
 *       - Protected
 *     summary: Protected dashboard endpoint
 *     description: >
 *       Returns dashboard data for the authenticated user.
 *       Uses the reusable verifyToken middleware to validate the JWT.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 dashboard:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     welcome:
 *                       type: string
 *       401:
 *         description: Missing or invalid token
 */
app.get('/protected/dashboard', verifyToken, (req, res) => {
  res.json({
    message: 'Dashboard data',
    dashboard: {
      user_id: req.user.id,
      email: req.user.email,
      welcome: `Welcome back, ${req.user.email}!`,
    },
  });
});

// ─── Start Server ───────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`Server running and connected to Supabase on port ${port}`);
});

module.exports = { app, supabase };
