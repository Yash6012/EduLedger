import sqlite3
from datetime import datetime

def init_db():
    conn = sqlite3.connect('eduledger.db')
    cursor = conn.cursor()

    # Create Students table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        unique_id TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        branch TEXT NOT NULL,
        year INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Create Faculty table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS faculty (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        unique_id TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        research_area TEXT,
        post TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Create Subjects table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        credits INTEGER NOT NULL
    )
    ''')

    # Create Faculty-Student Assignments table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS faculty_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        faculty_id INTEGER,
        subject_id INTEGER,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students (id),
        FOREIGN KEY (faculty_id) REFERENCES faculty (id),
        FOREIGN KEY (subject_id) REFERENCES subjects (id)
    )
    ''')

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db() 