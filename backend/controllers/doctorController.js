import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";
import { cancelAndReleaseSlot, removeTempFile } from "../utils/slots.js";

// Doctor login
const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    const user = await doctorModel.findOne({ email: cleanEmail }) || await doctorModel.findOne({ email });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isApproved) {
      return res.status(403).json({ success: false, message: "Your account is waiting for admin approval" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get doctor's appointments
const appointmentsDoctor = async (req, res) => {
  try {
    const docId = req.user.id;
    const appointments = await appointmentModel.find({ docId });
    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel appointment (atomic: only this doctor's own, not already cancelled/completed; frees the slot)
const appointmentCancel = async (req, res) => {
  try {
    const docId = req.user.id;
    const { appointmentId } = req.body;

    const cancelled = await cancelAndReleaseSlot({ _id: appointmentId, docId });
    if (!cancelled) {
      return res.status(400).json({ success: false, message: "Appointment not found, already cancelled or completed" });
    }

    res.json({ success: true, message: "Appointment Cancelled" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Complete appointment (atomic: can't complete a cancelled or already completed appointment)
const appointmentComplete = async (req, res) => {
  try {
    const docId = req.user.id;
    const { appointmentId } = req.body;

    const completed = await appointmentModel.findOneAndUpdate(
      { _id: appointmentId, docId, cancelled: false, isCompleted: false },
      { isCompleted: true }
    );
    if (!completed) {
      return res.status(400).json({ success: false, message: "Appointment not found, cancelled or already completed" });
    }

    res.json({ success: true, message: "Appointment Completed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const doctorList = async (req, res) => {
  try {
    const doctors = await doctorModel.find({ isApproved: true }).select("-password -email");
    res.json({ success: true, doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const registerDoctor = async (req, res) => {
  const tempFile = req.file;
  try {
    const { name, email, password, speciality, degree, experience, about, fees, address } = req.body;
    const imageFile = req.file;

    if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address) {
      return res.status(400).json({ success: false, message: "Missing Details" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email" });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Please enter a strong password" });
    }

    const existingDoctor = await doctorModel.findOne({ email: cleanEmail }) || await doctorModel.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({ success: false, message: "Doctor already exists with this email" });
    }

    if (Number.isNaN(Number(fees)) || Number(fees) < 0) {
      return res.status(400).json({ success: false, message: "Invalid fees" });
    }

    let parsedAddress;
    try {
      parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
    } catch {
      return res.status(400).json({ success: false, message: "Invalid address" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let imageUrl = "";
    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
      imageUrl = imageUpload.secure_url;
    }

    const doctorData = {
      name,
      email: cleanEmail,
      image: imageUrl,
      password: hashedPassword,
      speciality,
      degree,
      experience,
      about,
      fees: Number(fees),
      address: parsedAddress,
      date: Date.now(),
      isApproved: false // explicitly set as unapproved
    };

    const newDoctor = new doctorModel(doctorData);
    await newDoctor.save();

    res.status(200).json({ success: true, message: "Registration successful. Please wait for Admin approval." });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Doctor already exists with this email" });
    }
    res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  } finally {
    removeTempFile(tempFile);
  }
};


const changeAvailability = async (req, res) => {
  try {
    const docId = req.user.id;

    const docData = await doctorModel.findById(docId);
    if (!docData) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    await doctorModel.findByIdAndUpdate(docId, { available: !docData.available });

    res.json({ success: true, message: "Availability changed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get doctor's profile
const doctorProfile = async (req, res) => {
  try {
    const docId = req.user.id;
    const profile = await doctorModel.findById(docId).select("-password");
    res.json({ success: true, profileData: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update doctor's profile (only the fields that were actually sent are written,
// so an old copy of the profile page can't overwrite fields it didn't change)
const updateDoctorProfile = async (req, res) => {
  try {
    const docId = req.user.id;
    const { fees, address, available, about } = req.body;

    const update = {};
    if (fees !== undefined) {
      if (Number.isNaN(Number(fees)) || Number(fees) < 0) {
        return res.status(400).json({ success: false, message: "Invalid fees" });
      }
      update.fees = Number(fees);
    }
    if (address !== undefined) update.address = address;
    if (about !== undefined) update.about = about;
    if (available !== undefined) update.available = Boolean(available);

    if (Object.keys(update).length) {
      await doctorModel.findByIdAndUpdate(docId, { $set: update });
    }

    res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Get dashboard data
const doctorDashboard = async (req, res) => {
  try {
    const docId = req.user.id;
    const appointments = await appointmentModel.find({ docId });

    let earnings = 0;
    const patientSet = new Set();

    appointments.forEach((a) => {
      if (!a.cancelled && (a.isCompleted || a.payment)) earnings += a.amount;
      patientSet.add(a.userId.toString());
    });

    const dashData = {
      earnings,
      appointments: appointments.length,
      patients: patientSet.size,
      latestAppointments: [...appointments].reverse().slice(0, 5),
    };

    res.json({ success: true, dashData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  loginDoctor,
  appointmentsDoctor,
  appointmentCancel,
  appointmentComplete,
  doctorList,
  changeAvailability,
  doctorProfile,
  updateDoctorProfile,
  doctorDashboard,
  registerDoctor,
};