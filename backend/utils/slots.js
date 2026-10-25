import appointmentModel from "../models/appointmentModel.js"
import doctorModel from "../models/doctorModel.js"
import fs from "fs"

// slotDate looks like "23_10_2026" (day_month_year)
export const SLOT_DATE_REGEX = /^\d{1,2}_\d{1,2}_\d{4}$/

// Toggle-safe normalisation: newer browsers put a narrow no-break space (U+202F)
// between the time and AM/PM, and some locales use lowercase am/pm.
export const normalizeSlotTime = (t) =>
    String(t || '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase()

// Time strings may already exist in the DB in lower case, so we check both.
export const slotTimeVariants = (t) => {
    const up = normalizeSlotTime(t)
    return [up, up.toLowerCase()]
}

// true if slotDate is a real date between yesterday and +30 days
export const isReasonableSlotDate = (slotDate) => {
    if (!SLOT_DATE_REGEX.test(slotDate)) return false
    const [d, m, y] = slotDate.split('_').map(Number)
    const date = new Date(y, m - 1, d)
    if (date.getDate() !== d || date.getMonth() !== m - 1) return false
    const now = Date.now()
    return date.getTime() >= now - 36 * 3600 * 1000 && date.getTime() <= now + 31 * 24 * 3600 * 1000
}


export const cancelAndReleaseSlot = async (filter) => {
    const appointment = await appointmentModel.findOneAndUpdate(
        { ...filter, cancelled: false, isCompleted: false },
        { cancelled: true }
    )
    if (!appointment) return null

    const { docId, slotDate, slotTime } = appointment
    // $pull is atomic and only removes this one time, it never overwrites other bookings
    await doctorModel.updateOne(
        { _id: docId },
        { $pull: { [`slots_booked.${slotDate}`]: { $in: slotTimeVariants(slotTime) } } }
    )
    return appointment
}

// delete temp file left by multer (ignore errors)
export const removeTempFile = (file) => {
    if (file?.path) fs.unlink(file.path, () => { })
}
