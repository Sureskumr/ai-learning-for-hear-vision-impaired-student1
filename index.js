import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Setup Multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_for_ai_platform_prototype';

// --- IN-MEMORY DATABASE (For Prototype) ---
const users = [];

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, role = 'user' } = req.body;
    
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now().toString(), email, password: hashedPassword, role };
    users.push(newUser);

    const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: newUser.id, email: newUser.email, role: newUser.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware to protect routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- ADMIN ROUTES ---
app.get('/api/admin/stats', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  
  res.json({
    totalUsers: users.length,
    activeSessions: Math.floor(Math.random() * 50) + 1,
    videosProcessed: Math.floor(Math.random() * 200) + 50
  });
});

app.get('/api/admin/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  
  const safeUsers = users.map(u => ({ id: u.id, email: u.email, role: u.role }));
  res.json(safeUsers);
});

// --- VIDEO PROCESSING ROUTE ---
app.post('/api/upload/video', authenticateToken, upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No video file uploaded' });
  }

  console.log(`[Video Process] Received file: ${req.file.filename}`);
  
  // SIMULATE PROCESSING (FFmpeg audio extraction -> STT API Call)
  setTimeout(() => {
    // Generate a mock transcript depending on the file name or just random
    const transcripts = [
      "Welcome to this advanced lesson on Artificial Intelligence.",
      "Today we are discussing the impact of machine learning on accessibility technologies.",
      "The global economy is seeing a shift towards automated processes."
    ];
    const mockTranscript = transcripts[Math.floor(Math.random() * transcripts.length)];
    
    console.log(`[Video Process] Extracted text: ${mockTranscript}`);
    
    res.json({
      status: 'success',
      message: 'Video processed successfully',
      filename: req.file.filename,
      transcript: mockTranscript
    });
  }, 2500); // 2.5 second simulated processing delay
});

// --- IOT ENDPOINTS ---
app.post('/api/iot/voice-command', (req, res) => {
  const { command } = req.body;
  console.log(`[IoT Simulation] Received Voice Command: ${command}`);
  res.json({ status: 'success', message: 'Command processed', response: `I heard you say: ${command}` });
});

app.post('/api/iot/sensor-data', (req, res) => {
  const { sensor, value } = req.body;
  console.log(`[IoT Simulation] Sensor Data - ${sensor}: ${value}`);
  res.json({ status: 'success', message: 'Data logged' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'AI Learning Platform API v2' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
