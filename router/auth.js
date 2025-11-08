const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const { v4: uuidv4 } = require("uuid");

router.post("/register", async (req, res) => {
  try {
    const { email, password, fullName, role, user_details } = req.body;
    const {age,gender,height_cm,weight_kg, phone, address} = user_details;

    // Validate input
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and name are required",
      });
    }

    // Check if user already exists
    const userExists = await pool.query(
      "SELECT 1 FROM users WHERE email = $1",
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const id = uuidv4();
    const result = await pool.query(
      "INSERT INTO users (id, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id",
      [id, email, hashedPassword,role || "user"]
    );

    const newUser = result.rows[0];
    const createPatientDeatils = await pool.query(
      "INSERT INTO patient_details(user_id, fullname,age, gender, weight_in_kg, height_cm,phone,address) VALUES($1, $2, $3,$4,$5,$6,$7,$8) RETURNING user_id",
      [id, fullName, age, gender, weight_kg,height_cm, phone, address ]
    );
    res.status(200).send(createPatientDeatils).end();
    // // Generate JWT token
    // const token = jwt.sign(
    //   { id: newUser.id, email: newUser.email, role: newUser.role },
    //   process.env.JWT_SECRET,
    //   { expiresIn: '7d' }
    // );

    // res.status(201).json({
    //   success: true,
    //   message: 'User registered successfully',
    //   data: {
    //     user: newUser,
    //     token
    //   }
    // });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    delete user.password;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// // Get current user profile
router.get('/whoMI', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(403).json({
      success: false,
      message: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
}

module.exports = router;
