from flask import Flask, request, jsonify
import sqlite3
from datetime import datetime

app = Flask(__name__)

def get_db_connection():
    conn = sqlite3.connect('eduledger.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/add_student', methods=['POST'])
def add_student():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO students (name, unique_id, email, branch, year)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['name'], data['unique_id'], data['email'], data['branch'], data['year']))
        conn.commit()
        return jsonify({'success': True, 'message': 'Student added successfully'})
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'message': 'Unique ID or Email already exists'})
    finally:
        conn.close()

@app.route('/api/add_faculty', methods=['POST'])
def add_faculty():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO faculty (name, unique_id, email, research_area, post)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['name'], data['unique_id'], data['email'], data['research_area'], data['post']))
        conn.commit()
        return jsonify({'success': True, 'message': 'Faculty added successfully'})
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'message': 'Unique ID or Email already exists'})
    finally:
        conn.close()

@app.route('/api/assign_faculty', methods=['POST'])
def assign_faculty():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO faculty_assignments (student_id, faculty_id, subject_id, start_date, end_date)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['student_id'], data['faculty_id'], data['subject_id'], 
              data['start_date'], data['end_date']))
        conn.commit()
        return jsonify({'success': True, 'message': 'Faculty assigned successfully'})
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'message': 'Assignment already exists'})
    finally:
        conn.close()

@app.route('/api/get_students', methods=['GET'])
def get_students():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM students')
    students = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(students)

@app.route('/api/get_faculty', methods=['GET'])
def get_faculty():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM faculty')
    faculty = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(faculty)

@app.route('/api/get_subjects', methods=['GET'])
def get_subjects():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM subjects')
    subjects = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(subjects)

if __name__ == '__main__':
    app.run(debug=True) 