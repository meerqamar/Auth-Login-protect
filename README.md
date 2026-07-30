# Auth-Login-Protect API

A secure REST API that handles user authentication (Sign Up, Log In, Log Out) and protects specific routes using **Supabase Auth** and **JWT verification**.

## Tech Stack

- **Node.js** + **Express 5**
- **Supabase Auth** (Identity Provider)
- **Swagger UI** (API documentation at `/docs`)
- **JSON Web Tokens** (Bearer authentication)

## Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Auth-login-Protect
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
PORT=3000
```

You can find these values in your Supabase Dashboard under **Project Settings → API**.

### 4. Start the server

```bash
npm start
```

The server will log: `Server running and connected to Supabase on port 3000`

### 5. Open Swagger UI

Navigate to [http://localhost:3000/docs](http://localhost:3000/docs) to explore and test all endpoints.

## API Routes

| Method | Endpoint              | Auth Required | Description                       |
| ------ | --------------------- | ------------- | --------------------------------- |
| POST   | `/auth/signup`        | No            | Create a new user account         |
| POST   | `/auth/login`         | No            | Authenticate user & return JWT    |
| POST   | `/auth/logout`        | Yes (Bearer)  | Terminate the user session        |
| GET    | `/protected/profile`  | Yes (Bearer)  | Read private user profile data    |
| GET    | `/public/info`        | No            | Read public, unprotected data     |

## How Authentication Works

1. **Sign Up / Log In** → Client sends `email` + `password` to your server → Server forwards to Supabase → Supabase returns a JWT (access token).
2. **Protected Request** → Client attaches the JWT in the `Authorization: Bearer <token>` header → Server verifies the token with Supabase → If valid, returns protected data.
3. **Log Out** → Server verifies the token, then instructs the client to discard it.

## Testing

### Via Swagger UI

1. Call `POST /auth/signup` to create a user
2. Call `POST /auth/login` to get an `access_token`
3. Click the **Authorize** button → paste the token → click **Authorize**
4. Call `GET /protected/profile` — should return your user data
5. Call `GET /public/info` — works without authentication

### Via automated tests

```bash
# Make sure the server is running first in another terminal
npm start

# Then run the tests
npm test
```

## Project Structure

```
Auth-login-Protect/
├── server.js          # Main server with all routes + Swagger config
├── test/
│   └── auth.test.js   # Automated tests
├── .env               # Environment variables (not committed)
├── .gitignore         # Files excluded from Git
├── package.json       # Dependencies and scripts
└── README.md          # This file
```

## License

ISC
