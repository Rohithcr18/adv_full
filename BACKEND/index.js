const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');  

const app = express();
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const uri = process.env.uri;

app.use(cors({
  origin: 'http://localhost:5173',     // frontend URL
  credentials: false
}));

app.use(express.json());

mongoose.connect(uri)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("Connected Error", err));

const studentSchema = new mongoose.Schema({
  rollNumber: { type: String, required: true, unique: true, trim: true },
  fullName: { type: String, required: true, trim: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Other' },
  dateOfBirth: { type: Date },
  className: { type: String, required: true, trim: true },
  section: { type: String, trim: true, default: 'A' },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  phone: { type: String, required: true },
  guardianName: { type: String, required: true, trim: true },
  guardianPhone: { type: String, required: true },
  address: { type: String, required: true, trim: true },
  enrollmentDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Active', 'Graduated', 'On Leave'], default: 'Active' }
}, { timestamps: true });

studentSchema.index({ rollNumber: 1 });
studentSchema.index({ fullName: 1 });

const Student = mongoose.model('Student', studentSchema);

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

//  JWT MIDDLEWARE (ADD THIS)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// AUTH ROUTES
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({ 
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FIXED: Now protected with middleware
app.get('/auth/profile', authenticateToken, async (req, res) => {
  res.json({ message: 'Protected route accessed', user: req.user });
});

const normalizeStudentPayload = (payload = {}) => {
  const normalized = { ...payload };

  if (normalized.rollNumber) {
    normalized.rollNumber = normalized.rollNumber.toString().trim().toUpperCase();
  }
  if (normalized.fullName) normalized.fullName = normalized.fullName.trim();
  if (normalized.className) normalized.className = normalized.className.trim();
  if (normalized.section) normalized.section = normalized.section.trim().toUpperCase();
  if (normalized.guardianName) normalized.guardianName = normalized.guardianName.trim();
  if (normalized.address) normalized.address = normalized.address.trim();
  if (normalized.email) normalized.email = normalized.email.trim().toLowerCase();

  return normalized;
};

const buildStudentFilters = ({ search = '', className, status }) => {
  const filters = {};
  if (search) {
    const regex = new RegExp(search, 'i');
    filters.$or = [
      { fullName: regex },
      { rollNumber: regex },
      { guardianName: regex }
    ];
  }
  if (className) filters.className = className;
  if (status) filters.status = status;
  return filters;
};

const handleMongooseError = (err, res) => {
  if (err.code === 11000) {
    const duplicatedField = Object.keys(err.keyValue || {})[0];
    return res.status(409).json({ error: `${duplicatedField} already exists` });
  }
  return res.status(400).json({ error: err.message });
};

// STUDENT ROUTES
app.post('/students', async (req, res) => {
  try {
    const student = new Student(normalizeStudentPayload(req.body));
    const saved = await student.save();
    res.status(201).json(saved);
  } catch (err) {
    handleMongooseError(err, res);
  }
});

app.get('/students', async (req, res) => {
  try {
    const filters = buildStudentFilters(req.query);
    const students = await Student.find(filters).sort({ rollNumber: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/students/summary', async (_req, res) => {
  try {
    const [statusCounts, classCounts, total] = await Promise.all([
      Student.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Student.aggregate([
        { $group: { _id: '$className', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Student.countDocuments()
    ]);

    const formatCounts = (collection = []) =>
      collection.reduce((acc, curr) => {
        acc[curr._id || 'Unknown'] = curr.count;
        return acc;
      }, {});

    res.json({
      total,
      status: formatCounts(statusCounts),
      classes: formatCounts(classCounts)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/students/:id', async (req, res) => {
  try {
    const normalized = normalizeStudentPayload(req.body);
    const updated = await Student.findByIdAndUpdate(
      req.params.id,
      normalized,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Student not found' });
    res.json(updated);
  } catch (err) {
    handleMongooseError(err, res);
  }
});

app.delete('/students/:id', async (req, res) => {
  try {
    const deleted = await Student.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server runs on: ${PORT}`);
});
