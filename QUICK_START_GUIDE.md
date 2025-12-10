# Quick Start Guide - OS Escape Game

## Prerequisites

1. **Node.js** (v14 or higher)
2. **MongoDB** (v4.4 or higher)
3. **npm** or **yarn**

---

## Installation & Setup

### 1. Start MongoDB

```powershell
# If MongoDB is installed as a service (Windows)
net start MongoDB

# Or start manually
mongod --dbpath "C:\data\db"
```

Verify MongoDB is running:
```powershell
mongo --eval "db.version()"
```

---

### 2. Install Dependencies

#### Server (Backend)
```powershell
cd server
npm install
```

**Expected packages**:
- express
- mongoose
- bcryptjs
- jsonwebtoken
- cors
- helmet
- express-rate-limit
- dotenv

#### Client (Frontend)
```powershell
cd client
npm install
```

**Expected packages**:
- react
- react-dom
- vite
- axios

---

### 3. Configure Environment Variables

Create `server/.env`:
```env
MONGO_URI=mongodb://localhost:27017/oscape
JWT_SECRET=your_secret_key_change_this_in_production
PORT=4000
NODE_ENV=development
```

**Important**: Change `JWT_SECRET` to a secure random string in production!

---

### 4. Seed Database (Optional)

If you want to start with sample data:

```powershell
cd server
node src/seed/seed.js
```

This creates:
- Sample user accounts
- Initial workspace structures
- Test data for all rounds

---

## Running the Application

### Start Backend Server

```powershell
# From project root
cd server
npm start
```

**Expected output**:
```
Server running on port 4000
MongoDB connected successfully
```

**Verify backend is running**:
- Open browser: http://localhost:4000
- Should see: "OS Escape API Server"

---

### Start Frontend Client

```powershell
# Open new terminal from project root
cd client
npm run dev
```

**Expected output**:
```
VITE v4.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Access application**:
- Open browser: http://localhost:5173

---

## First-Time Usage

### 1. Register New Account

1. Click "Need an account?" button
2. Fill in:
   - Username (min 3 characters)
   - Email (valid format)
   - Password (min 6 characters)
   - Confirm password
3. Click "CREATE ACCOUNT"

**Validation Errors to Watch For**:
- ❌ Username too short
- ❌ Invalid email format
- ❌ Password too short
- ❌ Passwords don't match

### 2. Login

1. Enter username and password
2. Click "> LOGIN"
3. You'll be taken to the Round Selection Menu

### 3. Round Selection Menu

You'll see three round cards:

**Round 1: File System Navigation** 💻
- **Status**: Always unlocked
- **Goal**: Master Linux terminal commands
- **Completion**: Reach the `flag.txt` file

**Round 2: Banker's Algorithm** 🔄
- **Status**: Locked until Round 1 complete
- **Goal**: Manage resources safely using Banker's Algorithm
- **Completion**: Successfully allocate resources without deadlock

**Round 3: Comprehension Quiz** 📚
- **Status**: Locked until Round 2 complete
- **Goal**: Answer OS concept questions
- **Completion**: Answer all questions correctly

---

## Playing Each Round

### Round 1: File System Navigation

**Available Commands**:
```bash
ls          # List directory contents
cd <path>   # Change directory
pwd         # Print working directory
cat <file>  # Display file contents
touch <file> # Create new file
mkdir <dir> # Create directory
rm <path>   # Remove file/directory
chmod <mode> <file> # Change permissions
ps          # List processes
kill <pid>  # Terminate process
./script.sh # Execute script
```

**Tips**:
- Click "?" button to see CheatSheet
- Use `ls -la` to see hidden files
- Read `README.md` files for hints
- Look for scripts to execute
- Find and cat the `flag.txt` to complete

**Scoring**: Based on commands executed efficiently

---

### Round 2: Banker's Algorithm

**Objective**: Manage system resources safely

**Interface**:
- **System State Table**: Shows processes and their resource allocation
- **Resource Status**: Available resources
- **Request Panel**: Make resource requests

**Actions**:
1. Select a process from dropdown
2. Enter resource request amounts
3. Click "Execute Request"
4. System checks if request is safe
5. If safe, resources are allocated

**Tips**:
- Use "Check Safety" to verify system state
- Click "Release" to free resources
- Watch the safe sequence
- Avoid deadlock scenarios

**Scoring**: Based on successful allocations and efficiency

---

### Round 3: Comprehension Quiz

**Format**: Multiple choice questions

**Topics**:
- Process management
- Memory management
- File systems
- Deadlock handling
- Scheduling algorithms

**How to Play**:
1. Read the passage
2. Answer questions by selecting options
3. Click "Submit Answer"
4. Get immediate feedback
5. Move to next passage

**Scoring**:
- ✅ Correct answer: +5 points
- ❌ Incorrect answer: -2 points
- Minimum score: 0

---

## Troubleshooting

### Backend Issues

#### "MongoDB connection failed"
```powershell
# Check if MongoDB is running
mongo --eval "db.version()"

# If not running, start it
net start MongoDB
```

#### "Port 4000 already in use"
```powershell
# Find and kill process using port 4000
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Or change port in server/.env
PORT=4001
```

#### "JWT_SECRET not defined"
- Create `server/.env` file
- Add `JWT_SECRET=your_secret_key`

---

### Frontend Issues

#### "Cannot connect to server"
- Verify backend is running on http://localhost:4000
- Check CORS settings in `server/src/server.js`
- Ensure `api.js` points to correct base URL

#### "Vite port conflict"
```powershell
# Vite will auto-increment port if 5173 is busy
# Check terminal output for actual port
```

#### "Module not found errors"
```powershell
# Reinstall dependencies
rm -r node_modules package-lock.json
npm install
```

---

### Login Issues

#### "Invalid credentials"
- Verify username and password are correct
- Usernames are case-sensitive
- Check if user exists in database

#### "Token expired"
- Tokens expire after 24 hours
- Login again to get new token
- Clear localStorage if issues persist

#### "Cannot register user"
- Check if username already exists
- Verify email format is valid
- Ensure password meets minimum length

---

## Testing the System

### Manual Testing Checklist

**Authentication**:
- [ ] Register new user
- [ ] Login with credentials
- [ ] Logout
- [ ] Login again (session persistence)

**Round 1**:
- [ ] Execute basic commands (ls, cd, pwd)
- [ ] Create files and directories
- [ ] Use CheatSheet
- [ ] Complete round (find flag)

**Round 2**:
- [ ] Initialize game
- [ ] Request resources
- [ ] Check safety
- [ ] Release resources
- [ ] Complete round

**Round 3**:
- [ ] Navigate between passages
- [ ] Answer questions
- [ ] Get feedback
- [ ] Complete quiz

**Progress Tracking**:
- [ ] Round 2 unlocks after Round 1
- [ ] Round 3 unlocks after Round 2
- [ ] Scores accumulate correctly
- [ ] Total score displays on menu

---

## Database Inspection

### View Users
```javascript
mongo oscape
db.users.find().pretty()
```

### View Progress
```javascript
db.users.find({}, {
  username: 1,
  round1Complete: 1,
  round2Complete: 1,
  round3Complete: 1,
  totalScore: 1
}).pretty()
```

### Reset User Progress
```javascript
db.users.updateOne(
  { username: "testuser" },
  { $set: {
    round1Complete: false,
    round2Complete: false,
    round3Complete: false,
    round1Score: 0,
    round2Score: 0,
    round3Score: 0,
    totalScore: 0
  }}
)
```

### View Leaderboard
```javascript
db.users.find({}, {
  username: 1,
  totalScore: 1
}).sort({ totalScore: -1 }).limit(10).pretty()
```

---

## Development Tips

### Hot Reload

Both frontend and backend support hot reload:
- **Backend**: Uses `nodemon` (install with `npm install -D nodemon`)
- **Frontend**: Vite has built-in HMR

### Debug Mode

Enable verbose logging:
```env
# In server/.env
NODE_ENV=development
LOG_LEVEL=debug
```

### Browser DevTools

- F12 to open DevTools
- Check Console for errors
- Network tab for API calls
- Application tab for localStorage

---

## Production Deployment

### Environment Setup

1. Set production environment variables:
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/oscape
JWT_SECRET=secure_random_string_here
PORT=4000
```

2. Update CORS settings in `server/src/server.js`:
```javascript
const corsOptions = {
  origin: 'https://your-domain.com',
  credentials: true
};
```

3. Build frontend:
```powershell
cd client
npm run build
```

### Deployment Options

**Backend**:
- Heroku
- AWS EC2
- DigitalOcean
- Azure App Service

**Frontend**:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront

**Database**:
- MongoDB Atlas (free tier available)
- AWS DocumentDB
- Azure Cosmos DB

---

## Support & Resources

### Documentation Files
- `API_DOCUMENTATION.md` - Complete API reference
- `DESIGN_CONSISTENCY_COMPLETE.md` - Design system details
- `PROJECT_STRUCTURE.md` - Code organization
- `README.md` - Project overview

### Common Commands
```powershell
# Install dependencies
npm install

# Start development server
npm start (backend)
npm run dev (frontend)

# Run tests
npm test

# Build for production
npm run build

# Check for errors
npm run lint
```

---

## Quick Command Reference

```powershell
# MongoDB
net start MongoDB                      # Start MongoDB service
mongo oscape                          # Connect to database
db.users.find().pretty()              # View users

# Backend
cd server                             # Navigate to backend
npm install                           # Install dependencies
npm start                             # Start server
node src/seed/seed.js                 # Seed database

# Frontend
cd client                             # Navigate to frontend
npm install                           # Install dependencies
npm run dev                           # Start dev server
npm run build                         # Build for production

# Both
ctrl+C                                # Stop server
```

---

## Success Indicators

✅ **Backend Running**: "Server running on port 4000" + "MongoDB connected"  
✅ **Frontend Running**: "Local: http://localhost:5173/"  
✅ **Database Connected**: No connection errors in terminal  
✅ **Authentication Working**: Can register and login  
✅ **Rounds Accessible**: Can play all three rounds  
✅ **Progress Saving**: Scores and completion status persist  

---

## Getting Help

If you encounter issues:

1. Check terminal for error messages
2. Verify MongoDB is running
3. Ensure all dependencies are installed
4. Check browser console for frontend errors
5. Review API responses in Network tab
6. Consult documentation files

---

**Ready to play? Start the servers and open http://localhost:5173!** 🚀

**First time?** Register a new account and begin with Round 1!
