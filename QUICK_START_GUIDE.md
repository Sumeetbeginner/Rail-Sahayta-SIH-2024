# Rail Sahayta - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

This guide will help you set up and run the Rail Sahayta system on your local machine.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.10 or higher) - [Download](https://python.org/)
- **MongoDB** (v6.0 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/)

---

## 🔧 Installation Steps

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-repo/rail-sahayta.git
cd rail-sahayta
```

### Step 2: Set Up MongoDB
```bash
# Start MongoDB service
mongod --dbpath /path/to/your/data/directory

# Or if installed as a service
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
# Start MongoDB service from Services (Windows)
```

### Step 3: Set Up Backend Server
```bash
cd server
npm install
npm start
```
Backend will run on: `https://rail-sahayta-final-1.onrender.com`

### Step 4: Set Up Frontend Client
```bash
cd client
npm install
npm run dev
```
Frontend will run on: `http://localhost:5173`

### Step 5: Set Up ML Server
```bash
cd mlserver
pip install -r requirements.txt
python api_flow.py
```
ML Server will run on: `http://localhost:9898`

### Step 6 (Optional): Set Up YOLO Server
```bash
cd yoloserver4
pip install -r requirements.txt
python yoloApi.py
```
YOLO Server will run on: `http://localhost:8000`

### Step 7 (Optional): Set Up Chatbot
```bash
cd chatbot
pip install -r requirements.txt
python railbot_api.py
```
Chatbot Server will run on: `http://localhost:5000`

### Step 8 (Optional): Set Up WebRTC Server
```bash
cd webRTCserver3
npm install
npm run dev
```

---

## 🌐 Access the Application

Open your browser and navigate to:
- **User Interface:** `http://localhost:5173`
- **Admin/Staff Login:** `http://localhost:5173` (Use login buttons)

---

## 👤 Default Credentials

### Admin Login
```
Email: admin@railway.com
Password: Admin@123
Department: Mechanical (or your choice)
```

### Staff Login
```
Email: staff@railway.com
Password: Staff@123
Department: Mechanical
```

### User Registration
Users need to sign up with email/password

---

## 🗄️ Database Setup

### Create Admin User (MongoDB)
```javascript
use railsahayta

db.admins.insertOne({
  name: "Admin User",
  email: "admin@railway.com",
  password: "$2a$10$YourHashedPasswordHere",  // Use bcrypt to hash
  dept: "Mechanical",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### Create Sample Staff
```javascript
db.staff.insertOne({
  name: "Staff User",
  email: "staff@railway.com",
  password: "$2a$10$YourHashedPasswordHere",
  dept: "Mechanical",
  dutyShift: "morning",
  compAssigned: [],
  compSolved: [],
  avgRating: 0,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

---

## 🧪 Testing the System

### 1. User Flow
1. Sign up as a new user
2. Submit a complaint with text/image
3. Wait for automatic processing (~2-5 seconds)
4. View complaint status on dashboard

### 2. Staff Flow
1. Login as staff
2. View assigned complaints
3. Update status to "In Process" then "Completed"
4. Check improvement suggestions

### 3. Admin Flow
1. Login as admin
2. View dashboard with charts
3. Navigate to Staff Management
4. Add new staff member
5. View all complaints

---

## 🛠️ Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 3002 (backend)
lsof -ti:3002 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3002  # Windows (then use taskkill)
```

### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in `server/index.js`
- Verify MongoDB port (default: 27017)

### ML Server Not Loading Models
- Check if model files exist in `mlserver/models/`
- Ensure Python dependencies are installed
- Check console for errors

### CORS Errors
- Ensure backend server is running
- Check CORS configuration in `server/index.js`
- Verify API URLs in frontend code

---

## 📦 Environment Variables

### Backend (.env file in /server)
```env
PORT=3002
MONGODB_URI=mongodb://localhost:27017/railsahayta
JWT_SECRET=your_super_secret_key_here
ML_SERVER_URL=http://localhost:9898
```

### Frontend (vite.config.js or .env)
```env
VITE_API_URL=https://rail-sahayta-final-1.onrender.com
VITE_ML_URL=http://localhost:9898
```

---

## 🎨 Key Features to Test

### 1. Image Upload & Analysis
- Upload a seat/window damage image
- System automatically detects category
- Severity calculated using ML model

### 2. Text Analysis
- Write complaint description
- System categorizes using NLP
- Sentiment analyzed in feedback

### 3. Staff Assignment
- Complaint auto-assigned to available staff
- Load balancing active
- Shift-based filtering

### 4. Dashboard Charts
- Category distribution (Doughnut)
- Severity levels (Bar chart)
- Status trends (Line chart)
- Recurring issue predictions (LSTM)

### 5. Feedback System
- Submit rating (1-5 stars)
- Write text feedback
- Sentiment auto-detected
- Staff rating updated

---

## 🔄 Update & Sync

```bash
# Pull latest changes
git pull origin main

# Update dependencies
cd server && npm install
cd ../client && npm install
cd ../mlserver && pip install -r requirements.txt
```

---

## 📚 Next Steps

1. **Read Full Documentation:** `SYSTEM_DOCUMENTATION.md`
2. **API Reference:** See API section in documentation
3. **Customize:** Modify categories, departments, workflows
4. **Deploy:** Follow deployment guide for production

---

## 🐛 Common Issues

### Issue: Charts Not Showing
**Solution:** Ensure Chart.js is installed and imported correctly
```bash
cd client
npm install chart.js react-chartjs-2
```

### Issue: Image Upload Fails
**Solution:** Check Multer configuration and upload directory permissions
```bash
mkdir -p server/uploads
chmod 777 server/uploads
```

### Issue: ML Model Inference Slow
**Solution:** Use GPU acceleration or optimize models
```bash
pip install tensorflow-gpu  # If CUDA available
```

---

## 📞 Support

For issues or questions:
- Check `SYSTEM_DOCUMENTATION.md` for detailed information
- Review error logs in console
- Contact development team

---

## ✅ Verification Checklist

- [ ] MongoDB running
- [ ] Backend server running (port 3002)
- [ ] Frontend running (port 5173)
- [ ] ML server running (port 9898)
- [ ] Can sign up new user
- [ ] Can submit complaint
- [ ] Can view dashboard
- [ ] Charts displaying correctly
- [ ] Staff can login
- [ ] Admin can login

---

**Congratulations! Your Rail Sahayta system is ready to use! 🎉**
