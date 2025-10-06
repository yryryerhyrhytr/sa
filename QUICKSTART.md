# 🚀 Quick Start Guide - Student Nursing Center

## For VPS Deployment (Recommended)

### 1. One-Command Setup
```bash
npm run setup && npm install && npm run build && npm run db:push && npm start
```

### 2. Step-by-Step Setup

1. **Setup PostgreSQL Database:**
   ```bash
   npm run setup
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Test Database Connection:**
   ```bash
   npm run db:test
   ```

4. **Build Application:**
   ```bash
   npm run build
   ```

5. **Initialize Database Schema:**
   ```bash
   npm run db:push
   ```

6. **Start Application:**
   ```bash
   npm start
   ```

## Default Login Credentials

**Teacher Account:**
- Phone: `01762602056`
- Password: `sir@123@`

**Super User Account:**
- Phone: `01818291546`
- Password: `sahidx@123`

## Application URLs

- **Application:** http://your-vps-ip:5000
- **Login Page:** http://your-vps-ip:5000/login

## Key Features

✅ **Local PostgreSQL Database** - No external dependencies  
✅ **Session-based Authentication** - Secure local authentication  
✅ **Student Management** - Add, edit, manage students  
✅ **Attendance Tracking** - Mark and track attendance  
✅ **Fee Management** - Track student fees and payments  
✅ **Exam Management** - Create and manage exams  
✅ **SMS Notifications** - Send SMS to students/parents  
✅ **Monthly Reports** - Generate monthly exam reports  
✅ **Online Exams** - Conduct online examinations  

## Production Checklist

- [ ] Change default passwords
- [ ] Set strong SESSION_SECRET
- [ ] Configure SSL certificates
- [ ] Set up regular database backups
- [ ] Configure firewall rules
- [ ] Set up monitoring/logging
- [ ] Test SMS configuration (if using)

## Support

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

---

🎉 **Your local authentication system is ready!**