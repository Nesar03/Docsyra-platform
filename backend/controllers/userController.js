import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import jwt from "jsonwebtoken";
import {v2 as cloudinary} from 'cloudinary'
import { isReasonableSlotDate, normalizeSlotTime, slotTimeVariants, cancelAndReleaseSlot, removeTempFile } from '../utils/slots.js'

// API to register user
const registerUser = async (req, res) => {

    try {
        const { name, email, password } = req.body;

        // checking for all data to register user
        if (!name || !email || !password) {
            return res.json({ success: false, message: 'Missing Details' })
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }

        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }

        const salt = await bcrypt.genSalt(10); // the more no. round the more time it will take
        const hashedPassword = await bcrypt.hash(password, salt)

        const userData = {
            name,
            email: String(email).trim().toLowerCase(),
            password: hashedPassword,
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })

        res.json({ success: true, token })

    } catch (error) {
        if (error.code === 11000) {
            return res.json({ success: false, message: 'User already exists with this email' })
        }
        res.json({ success: false, message: error.message })
    }
}

// API to login user
const loginUser = async (req, res) => {

    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email: String(email || '').trim().toLowerCase() }) || await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "Invalid credentials" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
            res.json({ success: true, token })
        }
        else {
            res.json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// API to get user profile data
const getProfile = async (req, res) => {

    try {
        const { userId } = req.body
        const userData = await userModel.findById(userId).select('-password')

        res.json({ success: true, userData })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// API to update user profile
const updateProfile = async (req, res) => {

    const imageFile = req.file
    try {

        const { name, phone, address, dob, gender } = req.body
        const userId = req.userId

        if (!name || !phone || !dob || !gender) {
            return res.json({ success: false, message: "Data Missing" })
        }

        let parsedAddress
        try { parsedAddress = JSON.parse(address) } catch { return res.json({ success: false, message: "Invalid address" }) }

        const update = { name, phone, address: parsedAddress, dob, gender }

        if (imageFile) {
            // upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
            update.image = imageUpload.secure_url
        }

        // single write instead of two, so a failed upload can't leave a half-updated profile
        await userModel.findByIdAndUpdate(userId, update)

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        res.json({ success: false, message: error.message })
    } finally {
        removeTempFile(imageFile)
    }
}

// API to book appointment
const bookAppointment = async (req, res) => {

    let reserved = false
    let docId, slotDate, slotTime

    try {

        ({ docId, slotDate } = req.body)
        const { userId } = req.body
        slotTime = normalizeSlotTime(req.body.slotTime)

        if (!docId || !slotDate || !slotTime) {
            return res.json({ success: false, message: 'Missing Details' })
        }
        if (!isReasonableSlotDate(slotDate)) {
            return res.json({ success: false, message: 'Invalid slot date' })
        }

        const docData = await doctorModel.findById(docId).select("-password -slots_booked")

        if (!docData || !docData.isApproved) {
            return res.json({ success: false, message: 'Doctor Not Found' })
        }
        if (!docData.available) {
            return res.json({ success: false, message: 'Doctor Not Available' })
        }

        const userData = await userModel.findById(userId).select("-password")
        if (!userData) {
            return res.json({ success: false, message: 'User Not Found' })
        }

        // reserve the slot with ONE atomic conditional update.
        // It only matches when the time is not already in slots_booked[slotDate],
        // so two people booking the same slot at the same time can never both win,
        // and it never overwrites other slots booked in parallel.
        const field = `slots_booked.${slotDate}`
        const reservedDoc = await doctorModel.findOneAndUpdate(
            { _id: docId, available: true, [field]: { $nin: slotTimeVariants(slotTime) } },
            { $push: { [field]: slotTime } }
        )

        if (!reservedDoc) {
            return res.json({ success: false, message: 'Slot Not Available' })
        }
        reserved = true

        // create the appointment. If this fails, the slot is released below.
        const appointmentData = {
            userId,
            docId,
            userData,
            docData: docData.toObject(),
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now()
        }

        await new appointmentModel(appointmentData).save()

        res.json({ success: true, message: 'Appointment Booked' })

    } catch (error) {

        // roll back the reservation so the slot isn't blocked forever
        if (reserved) {
            try {
                await doctorModel.updateOne(
                    { _id: docId },
                    { $pull: { [`slots_booked.${slotDate}`]: slotTime } }
                )
            } catch (rollbackError) {
                console.log('Slot rollback failed', rollbackError)
            }
        }

        if (error.code === 11000) {
            return res.json({ success: false, message: 'Slot Not Available' })
        }
        res.json({ success: false, message: error.message })
    }

}

// API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {

        const { userId, appointmentId } = req.body

        // ownership check + "not already cancelled/completed" check + slot release,
        // all done atomically in the helper
        const cancelled = await cancelAndReleaseSlot({ _id: appointmentId, userId })

        if (!cancelled) {
            return res.json({ success: false, message: 'Appointment not found, already cancelled or completed' })
        }

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user appointments for frontend my-appointments page
const listAppointment = async (req, res) => {
    try {

        const { userId } = req.body
        const appointments = await appointmentModel.find({ userId })

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}



export {registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment}