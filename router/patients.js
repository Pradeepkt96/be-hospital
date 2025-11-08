const express = require('express');
const router = express.Router();
const pool = require('../config/database'); // adjust path
const { verifyToken, checkRole } = require('../middleware/auth');

// GET /api/patients
// Provider-only: list basic patient fields
router.get('/', verifyToken, checkRole('PROVIDER'), async (req, res) => {
  try {
    const q = `SELECT u.id as user_id, pd.full_name, pd.age, pd.gender, pd.phone, pd.created_at
               FROM users u JOIN patient_details pd ON pd.user_id = u.id
               WHERE u.role = 'PATIENT'
               ORDER BY pd.full_name NULLS LAST`;
    const r = await pool.query(q);
    return res.json({ success: true, data: r.rows });
  } catch (err) {
    console.error('List patients error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/patients/:user_id
// Provider or owner
router.get('/:user_id', verifyToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    if (req.user.role !== 'PROVIDER' && Number(req.user.id) !== Number(user_id)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const q = `SELECT u.id as user_id, u.email, pd.full_name, pd.age, pd.gender, pd.height_cm, pd.weight_kg, pd.phone, pd.address, pd.created_at, pd.updated_at
               FROM users u LEFT JOIN patient_details pd ON pd.user_id = u.id WHERE u.id = $1`;
    const r = await pool.query(q, [user_id]);
    if (r.rowCount === 0) return res.status(404).json({ success: false, message: 'Patient not found' });
    return res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error('Get patient error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/patients
// Provider-only: create patient_details for existing user_id
// Body: { user_id, full_name, age, gender, height_cm, weight_kg, phone, address }
router.post('/', verifyToken, checkRole('PROVIDER'), async (req, res) => {
  try {
    const { user_id, full_name, age, gender, height_cm, weight_kg, phone, address } = req.body;
    if (!user_id || !full_name) return res.status(400).json({ success: false, message: 'user_id and full_name required' });

    const q = `INSERT INTO patient_details (user_id, full_name, age, gender, height_cm, weight_kg, phone, address)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`;
    const r = await pool.query(q, [user_id, full_name, age, gender, height_cm, weight_kg, phone, address]);
    return res.status(201).json({ success: true, data: r.rows[0] });
  } catch (err) {
    // handle FK violation or duplicate
    if (err.code === '23503') return res.status(400).json({ success: false, message: 'User id does not exist' });
    if (err.code === '23505') return res.status(409).json({ success: false, message: 'Patient details already exist' });
    console.error('Create patient error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/patients/:user_id
// Provider or owner: update allowed fields
router.put('/:user_id', verifyToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    if (req.user.role !== 'PROVIDER' && Number(req.user.id) !== Number(user_id)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const allowed = ['full_name','age','gender','height_cm','weight_kg','phone','address'];
    const sets = [];
    const vals = [];
    let idx = 1;
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        sets.push(`${key} = $${idx++}`);
        vals.push(req.body[key]);
      }
    }
    if (sets.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });
    vals.push(user_id);
    const sql = `UPDATE patient_details SET ${sets.join(', ')}, updated_at = NOW() WHERE user_id = $${idx} RETURNING *`;
    const r = await pool.query(sql, vals);
    if (r.rowCount === 0) return res.status(404).json({ success: false, message: 'Patient details not found' });
    return res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error('Update patient error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;