const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('./')); // Serve static frontend files from current directory

// 1. Initial connection to MySQL (without selecting a specific database yet)
const rootConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Sai2306@2005'
});

rootConnection.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL Server:', err.message);
        return;
    }
    console.log('Connected to MySQL Server successfully!');

    // Initialize Database and Table
    rootConnection.query(`CREATE DATABASE IF NOT EXISTS nexgen_careers`, (err) => {
        if (err) {
            console.error('Error creating database:', err.message);
            return;
        }
        console.log('Database "nexgen_careers" ensured.');
        
        // Connect specifically to the created database
        const db = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Sai2306@2005',
            database: 'nexgen_careers'
        });

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'student',
                job_status VARCHAR(50) DEFAULT 'Not Placed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        db.query(createTableQuery, (err) => {
            if (err) console.error('Error creating users table:', err.message);
            else {
                console.log('Table "users" ensured.');
                
                // Alter table backward compatibility
                db.query(`ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'student'`, () => {});
                db.query(`ALTER TABLE users ADD COLUMN job_status VARCHAR(50) DEFAULT 'Not Placed'`, () => {});

                // Seed Admin
                const adminEmail = 'admin@nexgen.com';
                db.query('SELECT id FROM users WHERE email = ?', [adminEmail], async (err, results) => {
                    if (!err && results.length === 0) {
                        const salt = await bcrypt.genSalt(10);
                        const hashed = await bcrypt.hash('admin123', salt);
                        db.query("INSERT INTO users (name, email, password, role) VALUES ('Admin', ?, ?, 'admin')", [adminEmail, hashed], (err) => {
                            if (!err) console.log('Admin seeded: admin@nexgen.com / admin123');
                        });
                    }
                });
            }
        });

        // Setup API Routes that use `db` connection

        // Registration Route
        app.post('/api/register', async (req, res) => {
            const { name, email, password } = req.body;
            
            if (!name || !email || !password) {
                return res.status(400).json({ error: 'All fields are required.' });
            }

            try {
                // Check if user exists
                db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
                    if (err) return res.status(500).json({ error: 'Database error.' });
                    if (results.length > 0) return res.status(409).json({ error: 'Email already registered.' });

                    // Hash password
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(password, salt);

                    // Insert User
                    db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword], (err, results) => {
                        if (err) return res.status(500).json({ error: 'Failed to insert user.' });
                        res.status(201).json({ message: 'User registered successfully!' });
                    });
                });
            } catch (error) {
                res.status(500).json({ error: 'Server error' });
            }
        });

        // Login Route
        app.post('/api/login', (req, res) => {
            const { email, password } = req.body;
            
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required.' });
            }

            db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
                if (err) return res.status(500).json({ error: 'Database error.' });
                
                if (results.length === 0) {
                    return res.status(401).json({ error: 'Invalid credentials.' });
                }

                const user = results[0];
                const isMatch = await bcrypt.compare(password, user.password);

                if (!isMatch) {
                    return res.status(401).json({ error: 'Invalid credentials.' });
                }

                res.status(200).json({ message: 'Login successful!', user: { name: user.name, email: user.email, role: user.role }});
            });
        });

        // Admin Routes
        app.get('/api/admin/users', (req, res) => {
            db.query('SELECT id, name, email, role, job_status, created_at FROM users WHERE role != "admin"', (err, results) => {
                if (err) return res.status(500).json({ error: 'Database error.' });
                res.json(results);
            });
        });

        app.put('/api/admin/users/:id', (req, res) => {
            const { job_status } = req.body;
            db.query('UPDATE users SET job_status = ? WHERE id = ?', [job_status, req.params.id], (err, results) => {
                if (err) return res.status(500).json({ error: 'Database error.' });
                res.json({ message: 'User updated successfully' });
            });
        });

        app.delete('/api/admin/users/:id', (req, res) => {
            db.query('DELETE FROM users WHERE id = ?', [req.params.id], (err, results) => {
                if (err) return res.status(500).json({ error: 'Database error.' });
                res.json({ message: 'User deleted successfully' });
            });
        });

        // Start server only after DB setup
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    });
});
