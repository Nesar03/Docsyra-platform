import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";
import userModel from "../models/userModel.js"
import { cancelAndReleaseSlot, removeTempFile } from "../utils/slots.js"

// API for admin login
const loginAdmin = async (req, res) => {
    try {

        const { email, password } = req.body

        const envEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
        const envPassword = (process.env.ADMIN_PASSWORD || '').trim()

        if (
            email &&
            String(email).trim().toLowerCase() === envEmail &&
            password &&
            String(password).trim() === envPassword
        ) {
            const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' })
            return res.json({ success: true, token })
        } else {
            return res.json({ success: false, message: "Invalid credentials" })
        }

    } catch (error) {
        res.json({ success: false, message: error.message })
    }

}

// API for adding Doctor
const addDoctor = async (req, res) => {
  const imageFile = req.file;
  try {
    const { name, email, password, speciality, degree, experience, about, fees, address } = req.body;

    if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address) {
      return res.status(400).json({ success: false, message: "Missing Details" });
    }

    if (!imageFile) {
      return res.status(400).json({ success: false, message: "Doctor image is required" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email" });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Please enter a strong password" });
    }

    if (Number.isNaN(Number(fees)) || Number(fees) < 0) {
      return res.status(400).json({ success: false, message: "Invalid fees" });
    }

    let parsedAddress;
    try { parsedAddress = JSON.parse(address); } catch { return res.status(400).json({ success: false, message: "Invalid address" }); }

    if (await doctorModel.findOne({ email })) {
      return res.status(400).json({ success: false, message: "Doctor already exists with this email" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
    const imageUrl = imageUpload.secure_url;

    const doctorData = {
      name,
      email,
      image: imageUrl,
      password: hashedPassword,
      speciality,
      degree,
      experience,
      about,
      fees: Number(fees),
      address: parsedAddress,
      date: Date.now(),
      isApproved: true // added by the admin, so no extra approval step is needed
    };

    const newDoctor = new doctorModel(doctorData);
    await newDoctor.save();

    res.status(200).json({ success: true, message: "Doctor Added" });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Doctor already exists with this email" });
    }
    res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  } finally {
    removeTempFile(imageFile);
  }
};

// API for appointment cancellation (atomic, releases the slot exactly once)
const appointmentCancel = async (req, res) => {
    try {

        const { appointmentId } = req.body

        const cancelled = await cancelAndReleaseSlot({ _id: appointmentId })
        if (!cancelled) {
            return res.json({ success: false, message: 'Appointment not found, already cancelled or completed' })
        }

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// API for admin to toggle a doctor's availability
const changeAvailability = async (req, res) => {
    try {
        const { docId } = req.body
        if (!docId) {
            return res.status(400).json({ success: false, message: "Doctor ID missing" })
        }

        const docData = await doctorModel.findById(docId)
        if (!docData) {
            return res.status(404).json({ success: false, message: "Doctor not found" })
        }

        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })

        res.json({ success: true, message: "Availability changed successfully" })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

const allDoctors = async (req, res) => {
    try {

        const doctors = await doctorModel.find({}).select('-password')
        res.json({ success: true, doctors })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// API to remove Doctor
const removeDoctor = async (req, res) => {
    try {
        const { docId } = req.body
        // cancel the doctor's open appointments so patients don't keep bookings with a deleted doctor
        await appointmentModel.updateMany({ docId, cancelled: false, isCompleted: false }, { cancelled: true })
        await doctorModel.findByIdAndDelete(docId)
        res.json({ success: true, message: 'Doctor Removed Successfully' })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
    try {

        const appointments = await appointmentModel.find({})
        res.json({ success: true, appointments })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }

}

// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
    try {

        const [doctors, patients, appointments, latestAppointments] = await Promise.all([
            doctorModel.countDocuments({}),
            userModel.countDocuments({}),
            appointmentModel.countDocuments({}),
            appointmentModel.find({}).sort({ date: -1 }).limit(5)
        ])

        const dashData = { doctors, appointments, patients, latestAppointments }

        res.json({ success: true, dashData })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// API to get all pending (unverified) doctors
const pendingDoctors = async (req, res) => {
    try {
        const doctors = await doctorModel.find({ isApproved: false }).select('-password')
        res.json({ success: true, doctors })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// API to approve a doctor
const approveDoctor = async (req, res) => {
    try {
        const { docId } = req.body
        await doctorModel.findByIdAndUpdate(docId, { isApproved: true })
        res.json({ success: true, message: 'Doctor Approved Successfully' })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}


export {loginAdmin, addDoctor, changeAvailability, allDoctors, appointmentsAdmin, appointmentCancel, adminDashboard, removeDoctor, pendingDoctors, approveDoctor}