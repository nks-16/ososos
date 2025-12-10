# API Endpoints Documentation

Complete reference for all backend API endpoints in the OS Escape game.

## Base URL
```
http://localhost:4000/api
```

---

## Authentication Endpoints

### POST `/auth/register`
**Purpose**: Register a new user account  
**Body**:
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```
**Response**:
```json
{
  "token": "jwt_token",
  "workspaceId": "workspace_id",
  "username": "string",
  "sessionId": "user_id",
  "progress": {
    "round1Complete": false,
    "round2Complete": false,
    "round3Complete": false,
    "round1Score": 0,
    "round2Score": 0,
    "round3Score": 0,
    "totalScore": 0
  }
}
```
**Validation**:
- Username: min 3 characters
- Email: valid format
- Password: min 6 characters

---

### POST `/auth/login`
**Purpose**: Authenticate existing user  
**Body**:
```json
{
  "username": "string",
  "password": "string"
}
```
**Response**: Same as register
**Errors**:
- 401: Invalid credentials
- 404: User not found

---

## Round 1 - File System Endpoints

### POST `/commands/execute`
**Purpose**: Execute terminal command in Round 1  
**Headers**: `Authorization: Bearer <token>`  
**Body**:
```json
{
  "command": "ls -la",
  "workspaceId": "workspace_id"
}
```
**Response**:
```json
{
  "output": "command output",
  "success": true,
  "newPath": "/current/path"
}
```
**Supported Commands**:
- `ls` - List directory contents
- `cd <path>` - Change directory
- `pwd` - Print working directory
- `cat <file>` - Display file contents
- `touch <file>` - Create file
- `mkdir <dir>` - Create directory
- `rm <path>` - Remove file/directory
- `chmod <mode> <file>` - Change permissions
- `ps` - List processes
- `kill <pid>` - Kill process
- `./script.sh` - Execute script
- `nano/vim <file>` - Edit file

---

## Round 2 - Banker's Algorithm Endpoints

### POST `/bankers/initialize`
**Purpose**: Initialize a new Banker's Algorithm game session  
**Headers**: `Authorization: Bearer <token>`  
**Body**:
```json
{
  "sessionId": "user_id",
  "difficulty": "easy"
}
```
**Response**:
```json
{
  "state": {
    "sessionId": "user_id",
    "processes": [...],
    "resources": {...},
    "allocation": [...],
    "maxDemand": [...],
    "available": [...],
    "history": [],
    "score": 0,
    "completed": false
  }
}
```
**Difficulty Levels**:
- `easy`: 3 processes, 3 resources
- `medium`: 5 processes, 4 resources
- `hard`: 7 processes, 5 resources

---

### GET `/bankers/state/:sessionId`
**Purpose**: Retrieve current game state  
**Headers**: `Authorization: Bearer <token>`  
**Response**: Same as initialize

---

### POST `/bankers/check-safety`
**Purpose**: Check if system is in safe state  
**Headers**: `Authorization: Bearer <token>`  
**Body**:
```json
{
  "sessionId": "user_id"
}
```
**Response**:
```json
{
  "isSafe": true,
  "safeSequence": ["P0", "P1", "P2"]
}
```

---

### POST `/bankers/request`
**Purpose**: Request resources for a process  
**Headers**: `Authorization: Bearer <token>`  
**Body**:
```json
{
  "sessionId": "user_id",
  "processId": "P0",
  "request": [1, 0, 2]
}
```
**Response**:
```json
{
  "success": true,
  "message": "Request granted",
  "state": {...},
  "isSafe": true,
  "safeSequence": ["P0", "P1", "P2"]
}
```
**Possible Errors**:
- Request exceeds need
- Request exceeds available resources
- Would lead to unsafe state

---

### POST `/bankers/release`
**Purpose**: Release resources from a process  
**Headers**: `Authorization: Bearer <token>`  
**Body**:
```json
{
  "sessionId": "user_id",
  "processId": "P0",
  "release": [1, 0, 2]
}
```
**Response**:
```json
{
  "success": true,
  "message": "Resources released",
  "state": {...}
}
```

---

### POST `/bankers/reset`
**Purpose**: Reset game to initial state  
**Headers**: `Authorization: Bearer <token>`  
**Body**:
```json
{
  "sessionId": "user_id"
}
```
**Response**: New initial state

---

### POST `/bankers/complete`
**Purpose**: Complete Round 2 and save score  
**Headers**: `Authorization: Bearer <token>`  
**Body**:
```json
{
  "sessionId": "user_id"
}
```
**Response**:
```json
{
  "score": 85,
  "message": "Round 2 completed!"
}
```

---

## Round 3 - Quiz Endpoints

### POST `/round3/initialize`
**Purpose**: Initialize quiz session  
**Headers**: `Authorization: Bearer <token>`  
**Body**:
```json
{
  "sessionId": "user_id"
}
```
**Response**:
```json
{
  "state": {
    "sessionId": "user_id",
    "currentPassageIndex": 0,
    "passages": [
      {
        "title": "Process Management",
        "content": "passage text...",
        "questions": [
          {
            "id": "q1",
            "question": "What is a process?",
            "options": ["A", "B", "C", "D"],
            "correctAnswer": 0
          }
        ]
      }
    ],
    "answers": [],
    "score": 0,
    "completed": false
  }
}
```

---

### GET `/round3/state/:sessionId`
**Purpose**: Get current quiz state  
**Headers**: `Authorization: Bearer <token>`  
**Response**: Same as initialize

---

### POST `/round3/submit-answer`
**Purpose**: Submit answer for a question  
**Headers**: `Authorization: Bearer <token>`  
**Body**:
```json
{
  "sessionId": "user_id",
  "questionId": "q1",
  "answer": 0
}
```
**Response**:
```json
{
  "correct": true,
  "score": 5,
  "totalScore": 5,
  "completed": false,
  "correctAnswer": 0
}
```
**Scoring**:
- Correct answer: +5 points
- Incorrect answer: -2 points
- Minimum score: 0

---

## Progress Tracking Endpoints

### GET `/progress/progress/:username`
**Purpose**: Get user's overall progress  
**Headers**: `Authorization: Bearer <token>`  
**Response**:
```json
{
  "round1Complete": true,
  "round2Complete": false,
  "round3Complete": false,
  "round1Score": 100,
  "round2Score": 0,
  "round3Score": 0,
  "totalScore": 100
}
```

---

### POST `/progress/complete-round`
**Purpose**: Mark a round as complete with score  
**Headers**: `Authorization: Bearer <token>`  
**Body**:
```json
{
  "username": "string",
  "round": 1,
  "score": 100
}
```
**Response**:
```json
{
  "message": "Round 1 completed!",
  "progress": {
    "round1Complete": true,
    "round1Score": 100,
    "totalScore": 100
  }
}
```

---

### GET `/progress/can-access/:username/:round`
**Purpose**: Check if user can access a specific round  
**Headers**: `Authorization: Bearer <token>`  
**Params**:
- `username`: User's username
- `round`: Round number (1, 2, or 3)
**Response**:
```json
{
  "canAccess": true,
  "message": "Access granted"
}
```
**Logic**:
- Round 1: Always accessible
- Round 2: Requires Round 1 completion
- Round 3: Requires Round 2 completion

---

### GET `/progress/leaderboard`
**Purpose**: Get top 10 users by total score  
**Headers**: `Authorization: Bearer <token>`  
**Response**:
```json
[
  {
    "username": "player1",
    "totalScore": 300,
    "round1Score": 100,
    "round2Score": 100,
    "round3Score": 100,
    "round1Complete": true,
    "round2Complete": true,
    "round3Complete": true
  }
]
```

---

## Admin Endpoints

### GET `/admin/users`
**Purpose**: List all users (admin only)  
**Headers**: `Authorization: Bearer <admin_token>`  
**Response**:
```json
[
  {
    "id": "user_id",
    "username": "string",
    "email": "string",
    "createdAt": "timestamp"
  }
]
```

---

## Error Responses

All endpoints may return these standard errors:

### 400 Bad Request
```json
{
  "error": "Missing required field: username"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or missing token"
}
```

### 403 Forbidden
```json
{
  "error": "You must complete Round 1 first"
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Database connection failed"
}
```

---

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Tokens are obtained from `/auth/login` or `/auth/register` endpoints and should be stored in localStorage on the client side.

---

## Rate Limiting

- **General endpoints**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP

Exceeding rate limits returns:
```json
{
  "error": "Too many requests, please try again later"
}
```

---

## CORS

The API accepts requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (alternative port)

Production deployment should update CORS settings in `server/src/server.js`.

---

## Database Models

### User Model
```javascript
{
  username: String,
  email: String,
  password: String (bcrypt hashed),
  round1Complete: Boolean,
  round2Complete: Boolean,
  round3Complete: Boolean,
  round1Score: Number,
  round2Score: Number,
  round3Score: Number,
  totalScore: Number,
  createdAt: Date
}
```

### Workspace Model (Round 1)
```javascript
{
  userId: ObjectId,
  name: String,
  rootNode: FileNode,
  currentPath: String,
  processes: [Process],
  score: Number
}
```

### Round2State Model
```javascript
{
  sessionId: String,
  processes: [String],
  resources: Object,
  allocation: [[Number]],
  maxDemand: [[Number]],
  available: [Number],
  history: [String],
  score: Number,
  completed: Boolean
}
```

### Round3State Model
```javascript
{
  sessionId: String,
  currentPassageIndex: Number,
  passages: [Passage],
  answers: [Object],
  score: Number,
  completed: Boolean
}
```

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

### Execute Command (Round 1)
```bash
curl -X POST http://localhost:4000/api/commands/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"command":"ls","workspaceId":"YOUR_WORKSPACE_ID"}'
```

### Initialize Round 2
```bash
curl -X POST http://localhost:4000/api/bankers/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"sessionId":"YOUR_SESSION_ID","difficulty":"easy"}'
```

---

## Environment Variables

Required in `server/.env`:
```
MONGO_URI=mongodb://localhost:27017/oscape
JWT_SECRET=your_secret_key_here
PORT=4000
NODE_ENV=development
```

---

## Quick Reference

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/auth/register` | POST | No | Create account |
| `/auth/login` | POST | No | Login |
| `/commands/execute` | POST | Yes | Round 1 commands |
| `/bankers/initialize` | POST | Yes | Start Round 2 |
| `/bankers/state/:id` | GET | Yes | Get Round 2 state |
| `/bankers/request` | POST | Yes | Request resources |
| `/bankers/release` | POST | Yes | Release resources |
| `/bankers/complete` | POST | Yes | Finish Round 2 |
| `/round3/initialize` | POST | Yes | Start Round 3 |
| `/round3/state/:id` | GET | Yes | Get Round 3 state |
| `/round3/submit-answer` | POST | Yes | Answer question |
| `/progress/progress/:user` | GET | Yes | Get user progress |
| `/progress/complete-round` | POST | Yes | Complete round |
| `/progress/leaderboard` | GET | Yes | Get top scores |

---

**Last Updated**: Design Consistency Update  
**Server Version**: 1.0  
**API Version**: v1
