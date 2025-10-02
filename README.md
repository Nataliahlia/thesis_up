# Thesis Management System (Thesis_up)

A web-based thesis management system for the university of Patras, designed to streamline the thesis presentation and grading process. The system manages students, professors, and administrative staff through role-based dashboards. This implementation is the semester project for a class. 

## Table of Contents

- [Features](#features)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [File Upload System](#file-upload-system)
- [Caching Strategy](#caching-strategy)
- [Project Structure](#project-structure)
- [License](#license)

## Features

### Student Features
- **Profile Management**: Complete student profile with contact information
- **Thesis Submission**: Upload thesis documents and progress files
- **Committee Management**: View thesis committee members
- **Grades & Feedback**: Access thesis grades and committee feedback
- **Event Calendar**: View thesis presentation schedules and announcements
- **Real-time Notifications**: Stay updated on thesis status changes

### Professor Features
- **Dashboard Analytics**: Comprehensive statistics on supervised theses
- **Student Management**: Overview of assigned students and their progress
- **Committee Participation**: Manage committee memberships and evaluations
- **Grading System**: Submit grades and feedback for thesis evaluations
- **File Review**: Download and review student submissions

### Secretary Features
- **User Management**: Create and manage student and professor accounts
- **Thesis Oversight**: Monitor all thesis submissions and progress
- **System Administration**: Bulk operations and data management
- **Report Generation**: Generate comprehensive system reports

## System Architecture

- **Backend**: Node.js with Express.js framework
- **Database**: MySQL with utf8mb4 character set
- **Frontend**: HTML5, CSS3, JavaScript with Bootstrap 5
- **Session Management**: Express-session with secure configuration
- **File Handling**: Multer for file uploads with organized storage
- **Authentication**: Bcrypt for password hashing
- **PDF Generation**: Puppeteer for dynamic PDF creation

## Prerequisites

Before running this application, ensure you have:

- **Node.js** (v14 or higher)
- **MySQL** (v8.0 or higher)
- **npm** (comes with Node.js)
- **Git** (for version control)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Nataliahlia/thesis_up.git
   cd thesis_up
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Verify installation**
   ```bash
   npm list
   ```

## Database Setup

1. **Start MySQL server**
   ```bash
   # Windows (if MySQL is installed as service)
   net start mysql
   
   # Or start MySQL manually
   mysqld --console
   ```

2. **Create the database**
   ```sql
   mysql -u root -p < database/database_schema_fixed.sql
   ```

3. **Verify database creation**
   ```sql
   mysql -u root -p
   USE thesis_up;
   SHOW TABLES;
   ```

4. **Load sample data (optional)**
   ```bash
   # Load sample professors and students
   node scripts/loadSampleData.js
   ```

## Configuration

1. **Database Configuration**
   
   Edit `db.js` to match your MySQL configuration:
   ```javascript
   const connection = mysql.createConnection({
     host: '127.0.0.1',
     port: 3306,
     user: 'your_username',
     password: 'your_password',
     database: 'thesis_up',
     connectTimeout: 60000,
     multipleStatements: true
   });
   ```

2. **Session Configuration**
   
   Update the session secret in `server.js`:
   ```javascript
   app.use(session({
     secret: 'your-strong-secret-key',
     resave: false,
     saveUninitialized: false
   }));
   ```

3. **Environment Variables (Recommended)**
   
   Create a `.env` file:
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=thesis_up
   SESSION_SECRET=your-strong-secret-key
   PORT=3000
   ```

## Usage

1. **Start the application**
   ```bash
   npm start
   ```

2. **Access the system**
   - Open your browser and navigate to `http://localhost:3000`
   - You'll be redirected to the login page

3. **Default Login Credentials**
   
   After loading sample data:
   ```
   Secretary: sec1@ac.upatras.gr / sec1@2025
   Professor: prof1@ac.upatras.gr / prof_prof1@2025
   Student: up1234567@ac.upatras.gr / stud1234567@2025
   ```

4. **First-time Setup**
   - Login as secretary to create initial users
   - Configure system settings
   - Upload initial student/professor data

## API Endpoints

### Authentication
- `POST /auth/login` - User authentication
- `POST /auth/logout` - User logout
- `GET /session-info` - Get current session information

### Student Endpoints
- `GET /student/dashboard` - Student dashboard
- `GET /student/profile` - Student profile management
- `POST /student/upload-progress` - Upload progress files
- `GET /student/grades` - View thesis grades
- `GET /student/committee` - View committee members

### Professor Endpoints
- `GET /professor/dashboard` - Professor dashboard
- `GET /professor/statistics` - Get supervision statistics
- `POST /professor/grade-thesis` - Submit thesis grades
- `GET /professor/students` - View assigned students

### Secretary Endpoints
- `GET /secretary/dashboard` - Administrative dashboard
- `POST /secretary/create-user` - Create new users
- `GET /secretary/reports` - Generate system reports
- `POST /secretary/bulk-upload` - Bulk user creation

## File Upload System

The system handles multiple file types:

### Upload Directories
```
uploads/
├── thesis-pdfs/          # Final thesis documents
├── progress_files/       # Progress reports and drafts
└── temp/                # Temporary upload processing
```

### Supported File Types
- **Documents**: PDF, DOC, DOCX, TXT
- **Images**: PNG, JPG, JPEG, GIF
- **Archives**: ZIP, RAR
- **Development**: Various source code files

### File Naming Convention
Files are automatically renamed using timestamps:
```
{timestamp}-{original_filename}
```

## Caching Strategy

The system implements intelligent caching for optimal performance:

### Static Assets (30 days)
- Images, fonts, icons
- `Cache-Control: public, max-age=2592000, immutable`

### Dynamic Content (No cache)
- API responses, user data
- `Cache-Control: no-cache, no-store, must-revalidate`

### CSS/JS Files (Development: No cache)
- Ensures fresh UI for different user roles
- `Cache-Control: no-cache, no-store, must-revalidate`

## Project Structure

```
thesis_up/
├── server.js                 # Main application server
├── db.js                     # Database connection configuration
├── package.json              # Dependencies and scripts
├── package-lock.json         # Dependency lock file
├── cookies.txt               # Session configuration (ignore in git)
├── .gitignore               # Git ignore patterns
│
├── database/                 # Database schema and diagrams
│   ├── database_schema_fixed.sql
│   └── EER_diagram.png
│
├── routes/                   # API route handlers
│   ├── auth.routes.js        # Authentication routes
│   ├── dashboard.routes.js   # Dashboard routes
│   ├── professor.routes.js   # Professor-specific routes
│   ├── secretary/            # Secretary route modules
│   │   ├── index.routes.js
│   │   ├── theses.routes.js
│   │   └── users.routes.js
│   └── student/              # Student route modules
│       ├── index.routes.js
│       ├── profile.routes.js
│       ├── thesis_core.routes.js
│       └── grades.routes.js
│
├── thesis_up/                # Frontend assets
│   ├── pages/                # HTML pages
│   │   ├── index.html
│   │   ├── login.html
│   │   ├── dashboardStudent.html
│   │   ├── dashboardProfessor.html
│   │   └── dashboardSecretary.html
│   ├── css/                  # Stylesheets
│   │   ├── style.css
│   │   ├── student.css
│   │   ├── professor.css
│   │   └── secretary.css
│   ├── js/                   # Client-side JavaScript
│   │   ├── student.js
│   │   ├── professor.js
│   │   └── secretary.js
│   └── images/               # Static images and logos
│
├── uploads/                  # File upload storage
│   ├── thesis-pdfs/
│   └── progress_files/
│
├── sample_data/              # Sample data for testing
│   ├── sample_professors.json
│   ├── sample_students.json
│   └── pds_web/              # Sample thesis texts
│
├── scripts/                  # Utility scripts
│   └── updatePasswords.js    # Password management script
│
└── Cached/                   # Cache documentation
    └── readMe.md             # Caching strategy documentation
```

## Development

### Running in Development Mode
```bash
# Install development dependencies
npm install --dev

# Start with nodemon for auto-restart
npx nodemon server.js

# Or use the start script
npm start
```

### Database Migrations
```bash
# Reset database (WARNING: This will delete all data)
mysql -u root -p -e "DROP DATABASE thesis_up;"
mysql -u root -p < database/database_schema_fixed.sql

# Update passwords for existing users
node scripts/updatePasswords.js
```

### Testing
```bash
# Run basic connection tests
node -e "require('./db.js')"

# Test server startup
npm start
```

## License

This project is licensed under the ISC License - see the package.json file for details.

---