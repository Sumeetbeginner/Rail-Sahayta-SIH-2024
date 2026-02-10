import Admin from "../models/Admin.js";
import Cookies from "../models/Cookies.js"
import Complaint from "../models/Complaint.js"
import jwt from 'jsonwebtoken'
import Staff from "../models/Staff.js";

export const loginAdmin = async (req, res) =>{
  try {
    const { email, password } = req.body;

    // Check if email exists in the database
    const admin = await Admin.findOne({ email: email });

    if (!admin) {
      return res.status(400).json({ mess: "Admin doesn't exist!" });
    }

    // Hardcoded password comparison
    if (password !== admin.password) {
      return res.status(400).json({ mess: "Incorrect Password!" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(200).json({ admin, token });
  } catch (err) {
    res.status(401).json({ message: "Authentication failed", error: err.message });
  }
}

export const addStaff = async (req, res) =>{
  try {
    const {email, name, password, dept, trainNo, dutyShift} = req.body;

    // Check if user with same email exists
    const existingEmail = await Staff.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "Staff with this email already exists" });
    }

    const newStaff = new Staff({
      email,
      name,
      password,
      dept,
      trainNo,
      compAssigned : [],
      compSolved : [],
      avgRating : 0,
      dutyShift,
      cookiesId : []
    });

   // Save user data in mongoDB
   const savedStaff = await newStaff.save();

   return res.status(201).json({"message" : "Staff Registered Successfully"}); 
  } catch (err) {
    console.error("Error during registration:", err); 
    res.status(400).json({ message: err.message || "An unexpected error occurred during registration" });
  }
}

export const getCompByDept = async (req, res) => {
  try {
    const { dept, dept2 } = req.body; // Assuming dept is passed as a query parameter

    // If dept is 'railway', fetch all complaints
    if (dept.toLowerCase() === "railway") {
      const allComplaints = await Complaint.find().lean();
      
      // Populate staff names
      for (const comp of allComplaints) {
        if (comp.staffId) {
          const staff = await Staff.findById(comp.staffId).select("name dept email").lean();
          comp.staffName = staff ? staff.name : "Unassigned";
          comp.staffDept = staff ? staff.dept : "";
        }
        if (comp.staffId2) {
          const staff2 = await Staff.findById(comp.staffId2).select("name dept").lean();
          comp.staff2Name = staff2 ? staff2.name : "";
          comp.staff2Dept = staff2 ? staff2.dept : "";
        }
      }

      if (!allComplaints || allComplaints.length === 0) {
        return res.status(200).json({ message: "No complaints found", complaints: [] });
      }

      return res.status(200).json({
        message: "All complaints fetched successfully",
        complaints: allComplaints,
      });
    }

    // Otherwise, filter complaints by dept
    const complaintsByDept = await Complaint.find({
      $or: [{ dept : dept }, { dept2 : dept }]
    }).lean();

    // Populate staff names
    for (const comp of complaintsByDept) {
      if (comp.staffId) {
        const staff = await Staff.findById(comp.staffId).select("name dept email").lean();
        comp.staffName = staff ? staff.name : "Unassigned";
        comp.staffDept = staff ? staff.dept : "";
      }
      if (comp.staffId2) {
        const staff2 = await Staff.findById(comp.staffId2).select("name dept").lean();
        comp.staff2Name = staff2 ? staff2.name : "";
        comp.staff2Dept = staff2 ? staff2.dept : "";
      }
    }    

    if (!complaintsByDept || complaintsByDept.length === 0) {
      return res.status(200).json({ message: `No complaints found for ${dept} dept`, complaints: [] });
    }

    res.status(200).json({
      message: `${dept} complaints fetched successfully`,
      complaints: complaintsByDept,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch complaints",
      error: err.message,
    });
  }
};

export const getStaffByDept = async (req, res) => {
  try {
    const { dept } = req.body; // Assuming dept is passed in the body

    let staffInDept;
    
    if (dept === "Railway") {
      // Fetch all staff records if dept is "Railway"
      staffInDept = await Staff.find({});
    } else {
      // Fetch staff records for the specified dept
      staffInDept = await Staff.find({ dept });
    }

    if (!staffInDept || staffInDept.length === 0) {
      return res.status(200).json({
        message: dept === "Railway"
          ? "No staff records found"
          : `No staff found in ${dept} dept`,
        staff: [],
      });
    }

    res.status(200).json({
      message: dept === "Railway"
        ? "All staff records fetched successfully"
        : `${dept} dept staff fetched successfully`,
      staff: staffInDept,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch staff records",
      error: err.message,
    });
  }
};
