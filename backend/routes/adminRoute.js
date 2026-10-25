import express from 'express'
import { addDoctor, changeAvailability, adminDashboard, allDoctors, appointmentCancel, appointmentsAdmin, loginAdmin, removeDoctor, pendingDoctors, approveDoctor} from '../controllers/adminController.js'
import upload from '../middlewares/multer.js'
import authAdmin from '../middlewares/authAdmin.js';

const adminRouter = express.Router();

adminRouter.post("/login", loginAdmin)
adminRouter.post("/add-doctor", authAdmin, upload.single('image'), addDoctor)
adminRouter.get("/all-doctors", authAdmin, allDoctors)
adminRouter.post("/change-availability", authAdmin, changeAvailability)
adminRouter.get("/appointments", authAdmin, appointmentsAdmin)
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel)
adminRouter.get("/dashboard", authAdmin, adminDashboard)
adminRouter.post("/remove-doctor", authAdmin, removeDoctor)
adminRouter.get("/pending-doctors", authAdmin, pendingDoctors)
adminRouter.post("/approve-doctor", authAdmin, approveDoctor)




export default adminRouter;