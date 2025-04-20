const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { Block, Blockchain } = require('./blockchain');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// API routes
app.use('/api', (req, res, next) => {
    console.log(`API Request: ${req.method} ${req.path}`);
    next();
});

// Admin credentials
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// Database setup
const db = new sqlite3.Database('eduledger.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to the SQLite database.');
        initDatabase();
    }
});

// Initialize blockchain
const gradeChain = new Blockchain();

function initDatabase() {
    db.serialize(() => {
        // Create Students table
        db.run(`
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                unique_id TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                branch TEXT NOT NULL,
                year INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create Faculty table
        db.run(`
            CREATE TABLE IF NOT EXISTS faculty (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                unique_id TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                research_area TEXT,
                post TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create Subjects table
        db.run(`
            CREATE TABLE IF NOT EXISTS subjects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                code TEXT UNIQUE NOT NULL,
                credits INTEGER NOT NULL
            )
        `, [], (err) => {
            if (err) {
                console.error('Error creating subjects table:', err);
            } else {
                // Only initialize default subjects after table is created
                initDefaultSubjects();
            }
        });

        // Create Faculty-Student Assignments table
        db.run(`
            CREATE TABLE IF NOT EXISTS faculty_assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                faculty_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                grade TEXT,
                FOREIGN KEY (faculty_id) REFERENCES faculty(id),
                FOREIGN KEY (student_id) REFERENCES students(id)
            )
        `, (err) => {
            if (err) {
                console.error('Error creating faculty_assignments table:', err);
            } else {
                console.log('Faculty assignments table created or already exists');
            }
        });

        // Check if grade column exists, if not add it
        db.all("PRAGMA table_info(faculty_assignments)", [], (err, columns) => {
            if (err) {
                console.error('Error checking table columns:', err);
                return;
            }
            
            const hasGradeColumn = columns && columns.some(col => col.name === 'grade');
            if (!hasGradeColumn) {
                db.run('ALTER TABLE faculty_assignments ADD COLUMN grade TEXT', (err) => {
                    if (err) {
                        console.error('Error adding grade column:', err);
                    } else {
                        console.log('Grade column added successfully');
                    }
                });
            }
        });
    });
}

// Initialize default subjects
function initDefaultSubjects() {
    const defaultSubjects = [
        { name: 'Mathematics', code: 'MATH101', credits: 4 },
        { name: 'Physics', code: 'PHY101', credits: 4 },
        { name: 'Chemistry', code: 'CHEM101', credits: 4 },
        { name: 'Computer Science', code: 'CS101', credits: 4 },
        { name: 'English', code: 'ENG101', credits: 3 },
        { name: 'Economics', code: 'ECO101', credits: 3 },
        { name: 'Biology', code: 'BIO101', credits: 4 },
        { name: 'History', code: 'HIS101', credits: 3 }
    ];

    // First check if subjects already exist
    db.get('SELECT COUNT(*) as count FROM subjects', [], (err, row) => {
        if (err) {
            console.error('Error checking subjects:', err);
            return;
        }
        
        // Only add default subjects if table is empty
        if (row.count === 0) {
            const stmt = db.prepare('INSERT INTO subjects (name, code, credits) VALUES (?, ?, ?)');
            defaultSubjects.forEach(subject => {
                stmt.run(subject.name, subject.code, subject.credits);
            });
            stmt.finalize();
            console.log('Default subjects initialized successfully');
        }
    });
}

// Initialize test data
function initTestData() {
    // First check if we have a student and faculty
    db.get('SELECT COUNT(*) as count FROM students', [], (err, studentRow) => {
        if (err) {
            console.error('Error checking students:', err);
            return;
        }
        
        if (studentRow.count === 0) {
            // Add test student
            db.run(`
                INSERT INTO students (name, unique_id, email, branch, year)
                VALUES ('Test Student', 'ST001', 'test.student@example.com', 'Computer Science', 2)
            `, function(err) {
                if (err) {
                    console.error('Error adding test student:', err);
                    return;
                }
                console.log('Test student added with ID:', this.lastID);
            });
        }

        db.get('SELECT COUNT(*) as count FROM faculty', [], (err, facultyRow) => {
            if (err) {
                console.error('Error checking faculty:', err);
                return;
            }
            
            if (facultyRow.count === 0) {
                // Add test faculty
                db.run(`
                    INSERT INTO faculty (name, unique_id, email, department)
                    VALUES ('Test Faculty', 'F001', 'test.faculty@example.com', 'Computer Science')
                `, function(err) {
                    if (err) {
                        console.error('Error adding test faculty:', err);
                        return;
                    }
                    console.log('Test faculty added with ID:', this.lastID);
                });
            }

            // Now check faculty assignments
            db.get('SELECT COUNT(*) as count FROM faculty_assignments', [], (err, assignmentRow) => {
                if (err) {
                    console.error('Error checking faculty assignments:', err);
                    return;
                }
                
                if (assignmentRow.count === 0) {
                    // Add test assignment
                    db.run(`
                        INSERT INTO faculty_assignments (faculty_id, student_id, grade)
                        VALUES (1, 1, NULL)
                    `, function(err) {
                        if (err) {
                            console.error('Error adding test faculty assignment:', err);
                        } else {
                            console.log('Test faculty assignment added successfully');
                        }
                    });
                }
            });
        });
    });
}

// Admin login route
app.post('/api/admin_login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.json({ success: false, message: 'Invalid username or password' });
    }
});

// Student routes
app.post('/api/add_student', (req, res) => {
    const { name, unique_id, email, branch, year } = req.body;
    
    // Validate input
    if (!name || !unique_id || !email || !branch || !year) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Validate year
    if (isNaN(year) || year < 1 || year > 4) {
        return res.status(400).json({ success: false, message: 'Year must be between 1 and 4' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    
    db.run(
        'INSERT INTO students (name, unique_id, email, branch, year) VALUES (?, ?, ?, ?, ?)',
        [name, unique_id, email, branch, year],
        function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    if (err.message.includes('unique_id')) {
                        res.json({ success: false, message: 'Student ID already exists' });
                    } else if (err.message.includes('email')) {
                        res.json({ success: false, message: 'Email already exists' });
                    } else {
                        res.json({ success: false, message: 'Error adding student' });
                    }
                } else {
                    res.json({ success: false, message: 'Error adding student' });
                }
            } else {
                res.json({ success: true, message: 'Student added successfully' });
            }
        }
    );
});

app.get('/api/get_students', (req, res) => {
    db.all('SELECT * FROM students', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Faculty routes
app.post('/api/add_faculty', (req, res) => {
    const { name, unique_id, email, research_area, post } = req.body;
    
    db.run(
        'INSERT INTO faculty (name, unique_id, email, research_area, post) VALUES (?, ?, ?, ?, ?)',
        [name, unique_id, email, research_area, post],
        function(err) {
            if (err) {
                res.json({ success: false, message: 'Unique ID or Email already exists' });
            } else {
                res.json({ success: true, message: 'Faculty added successfully' });
            }
        }
    );
});

app.get('/api/get_faculty', (req, res) => {
    db.all('SELECT * FROM faculty', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Subjects routes
app.get('/api/get_subjects', (req, res) => {
    db.all('SELECT * FROM subjects', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Assignment routes
app.get('/api/get_assignments', (req, res) => {
    db.all(`
        SELECT 
            fa.id,
            s.name as student_name,
            s.unique_id as student_id,
            s.email as student_email,
            s.branch as student_branch,
            s.year as student_year,
            f.name as faculty_name,
            f.unique_id as faculty_id,
            f.email as faculty_email,
            f.research_area as faculty_research,
            f.post as faculty_post,
            sub.name as subject_name,
            sub.code as subject_code,
            sub.credits as subject_credits,
            fa.start_date,
            fa.end_date
        FROM faculty_assignments fa
        JOIN students s ON fa.student_id = s.id
        JOIN faculty f ON fa.faculty_id = f.id
        JOIN subjects sub ON fa.subject_id = sub.id
        ORDER BY fa.start_date DESC
    `, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.delete('/api/delete_assignment/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM faculty_assignments WHERE id = ?', [id], function(err) {
        if (err) {
            res.json({ success: false, message: 'Error deleting assignment' });
        } else {
            res.json({ success: true, message: 'Assignment deleted successfully' });
        }
    });
});

app.post('/api/assign_faculty', (req, res, next) => {
    try {
        const { student_id, faculty_id, subject_id, start_date, end_date } = req.body;
        
        console.log('Received assignment data:', { student_id, faculty_id, subject_id, start_date, end_date });
        
        // Validate input
        if (!student_id || !faculty_id || !subject_id || !start_date || !end_date) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Validate dates
        const start = new Date(start_date);
        const end = new Date(end_date);
        if (start > end) {
            return res.status(400).json({ success: false, message: 'End date must be after start date' });
        }

        // Check if student exists
        db.get('SELECT id FROM students WHERE id = ?', [student_id], (err, student) => {
            if (err) {
                console.error('Error checking student:', err);
                return res.status(500).json({ success: false, message: 'Error checking student' });
            }
            if (!student) {
                return res.status(400).json({ success: false, message: 'Student not found' });
            }

            // Check if faculty exists
            db.get('SELECT id FROM faculty WHERE id = ?', [faculty_id], (err, faculty) => {
                if (err) {
                    console.error('Error checking faculty:', err);
                    return res.status(500).json({ success: false, message: 'Error checking faculty' });
                }
                if (!faculty) {
                    return res.status(400).json({ success: false, message: 'Faculty not found' });
                }

                // Check if subject exists
                db.get('SELECT id FROM subjects WHERE id = ?', [subject_id], (err, subject) => {
                    if (err) {
                        console.error('Error checking subject:', err);
                        return res.status(500).json({ success: false, message: 'Error checking subject' });
                    }
                    if (!subject) {
                        return res.status(400).json({ success: false, message: 'Subject not found' });
                    }

                    // Create the assignment
                    db.run(
                        'INSERT INTO faculty_assignments (student_id, faculty_id, subject_id, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
                        [student_id, faculty_id, subject_id, start_date, end_date],
                        function(err) {
                            if (err) {
                                console.error('Error creating assignment:', err);
                                if (err.code === 'SQLITE_CONSTRAINT') {
                                    res.status(400).json({ success: false, message: 'Assignment already exists' });
                                } else {
                                    res.status(500).json({ success: false, message: 'Error creating assignment' });
                                }
                            } else {
                                res.json({ success: true, message: 'Assignment created successfully' });
                            }
                        }
                    );
                });
            });
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get student subjects with faculty information
app.get('/api/get_student_subjects/:studentId', (req, res) => {
    const studentId = req.params.studentId;
    console.log('Fetching subjects for student ID:', studentId);
    
    // First check if student exists
    db.get('SELECT id FROM students WHERE id = ?', [studentId], (err, student) => {
        if (err) {
            console.error('Error checking student:', err);
            return res.status(500).json({ error: err.message });
        }
        
        if (!student) {
            console.log('Student not found with ID:', studentId);
            return res.status(404).json({ error: 'Student not found' });
        }

        console.log('Student found, fetching subjects...');
        
        db.all(`
            SELECT 
                fa.id,
                s.name as student_name,
                s.unique_id as student_id,
                s.email as student_email,
                s.branch as student_branch,
                s.year as student_year,
                f.name as faculty_name,
                f.email as faculty_email,
                sub.name as subject_name,
                sub.code as subject_code,
                fa.start_date,
                fa.end_date,
                fa.grade
            FROM faculty_assignments fa
            JOIN students s ON fa.student_id = s.id
            JOIN faculty f ON fa.faculty_id = f.id
            JOIN subjects sub ON fa.subject_id = sub.id
            WHERE s.id = ?
        `, [studentId], (err, rows) => {
            if (err) {
                console.error('Error fetching student subjects:', err);
                return res.status(500).json({ error: err.message });
            }
            
            console.log('Found subjects:', rows);
            res.json(rows);
        });
    });
});

// Get faculty information
app.get('/api/get_faculty/:id', (req, res) => {
    const facultyId = req.params.id;
    db.get('SELECT * FROM faculty WHERE id = ?', [facultyId], (err, faculty) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!faculty) {
            res.status(404).json({ error: 'Faculty not found' });
            return;
        }
        res.json(faculty);
    });
});

// Get students assigned to a faculty
app.get('/api/get_faculty_students/:facultyId', (req, res) => {
    const facultyId = req.params.facultyId;
    db.all(`
        SELECT 
            s.*,
            fa.grade,
            sub.name as subject_name,
            sub.code as subject_code
        FROM students s
        JOIN faculty_assignments fa ON s.id = fa.student_id
        JOIN subjects sub ON fa.subject_id = sub.id
        WHERE fa.faculty_id = ?
    `, [facultyId], (err, students) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(students);
    });
});

// Function to inspect database state
function inspectDatabase() {
    console.log('\nInspecting database state:');
    
    // Check students
    db.all('SELECT * FROM students', [], (err, students) => {
        if (err) {
            console.error('Error checking students:', err);
        } else {
            console.log('\nStudents:', students);
        }
    });

    // Check faculty
    db.all('SELECT * FROM faculty', [], (err, faculty) => {
        if (err) {
            console.error('Error checking faculty:', err);
        } else {
            console.log('\nFaculty:', faculty);
        }
    });

    // Check assignments
    db.all('SELECT * FROM faculty_assignments', [], (err, assignments) => {
        if (err) {
            console.error('Error checking assignments:', err);
        } else {
            console.log('\nAssignments:', assignments);
        }
    });
}

// Update the submit grade endpoint
app.post('/api/submit_grade', (req, res) => {
    const { studentId, facultyId, grade, subject } = req.body;
    
    if (!studentId || !facultyId || !grade || !subject) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing required fields' 
        });
    }

    try {
        const blockData = {
            studentId,
            facultyId,
            grade,
            subject,
            timestamp: Date.now()
        };

        const newBlock = gradeChain.addBlock(blockData);
        
        res.json({
            success: true,
            message: 'Grade added to blockchain',
            block: {
                hash: newBlock.hash,
                timestamp: newBlock.timestamp
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding grade to blockchain'
        });
    }
});

// Add new endpoint to verify grade
app.get('/api/verify_grade/:studentId/:facultyId/:grade', (req, res) => {
    const { studentId, facultyId, grade } = req.params;
    
    try {
        const blocks = gradeChain.getBlocksByStudent(studentId);
        const verifiedBlock = blocks.find(block => 
            block.data.facultyId === facultyId && 
            block.data.grade === grade
        );

        if (verifiedBlock) {
            res.json({
                verified: true,
                blockHash: verifiedBlock.hash,
                timestamp: verifiedBlock.timestamp
            });
        } else {
            res.json({
                verified: false,
                message: 'Grade not found in blockchain'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error verifying grade'
        });
    }
});

app.get('/api/blockchain/status', (req, res) => {
    try {
        const isValid = gradeChain.isChainValid();
        const blockCount = gradeChain.chain.length;
        
        res.json({
            isValid,
            blockCount,
            latestBlock: gradeChain.getLatestBlock()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting blockchain status'
        });
    }
});

// Serve the admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve the admin login page
app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// Serve the index page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// 404 handler for API routes
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Call inspectDatabase after initialization
db.serialize(() => {
    initDatabase();
    initTestData();
    inspectDatabase();
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Blockchain initialized with genesis block');
}); 