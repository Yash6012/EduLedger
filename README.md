# EduLedger - University Management System

EduLedger is a comprehensive university management system that combines traditional database management with blockchain technology for secure and transparent grade management. The system provides a robust platform for managing student records, grades, and academic information.

## Features

- **Student Management**: Add, update, and manage student records
- **Grade Management**: Secure grade recording using blockchain technology
- **Subject Management**: Organize and manage academic subjects
- **Admin Dashboard**: Comprehensive administrative controls
- **Secure Authentication**: Protected admin access
- **RESTful API**: Well-documented API endpoints for system integration
- **Database Integration**: SQLite database for efficient data storage
- **Blockchain Integration**: Secure and immutable grade records

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Blockchain**: Custom implementation
- **Frontend**: HTML, CSS, JavaScript
- **Containerization**: Docker support

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Docker (optional, for containerized deployment)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/eduledger.git
cd eduledger
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

For development:
```bash
npm run dev
```

## Docker Deployment

To run the application using Docker:

```bash
docker build -t eduledger .
docker run -p 3000:3000 eduledger
```

## API Endpoints

### Student Management
- `POST /api/students` - Add a new student
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `PUT /api/students/:id` - Update student information
- `DELETE /api/students/:id` - Delete a student

### Grade Management
- `POST /api/grades` - Add a new grade
- `GET /api/grades/:studentId` - Get grades for a student
- `GET /api/grades/blockchain` - View blockchain grade records

### Subject Management
- `POST /api/subjects` - Add a new subject
- `GET /api/subjects` - Get all subjects
- `PUT /api/subjects/:id` - Update subject information

## Database Schema

### Students Table
- id (INTEGER, PRIMARY KEY)
- name (TEXT)
- unique_id (TEXT, UNIQUE)
- email (TEXT, UNIQUE)

### Subjects Table
- id (INTEGER, PRIMARY KEY)
- name (TEXT)
- code (TEXT, UNIQUE)
- credits (INTEGER)

### Grades Table
- id (INTEGER, PRIMARY KEY)
- student_id (INTEGER)
- subject_id (INTEGER)
- grade (TEXT)
- semester (TEXT)

## Security

- Admin authentication required for sensitive operations
- Blockchain integration for immutable grade records
- CORS protection enabled
- Input validation and sanitization

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For any queries or support, please contact the development team.

## Acknowledgments

- Express.js team for the amazing framework
- SQLite team for the lightweight database solution
- All contributors who have helped shape this project 