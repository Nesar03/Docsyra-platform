import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import adminRouter from './routes/adminRoute.js'
import doctorRouter from './routes/doctorRoute.js'
import userRouter from './routes/userRoute.js'

// app config
const app = express()
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

// middlewares
app.use(express.json())
// Set CORS_ORIGINS="https://your-frontend.vercel.app,https://your-admin.vercel.app" in the
// backend environment to only allow your own sites. If it is not set, everything is allowed (old behaviour).
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean)
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : undefined))

// api endpoints
app.use('/api/admin', adminRouter)
app.use('/api/doctor',doctorRouter)
app.use('/api/user',userRouter)

app.get('/', (req,res)=>{
  res.send('API WORKING GREAT')
})

app.use((err, req, res, next) => {
  res.status(400).json({ success: false, message: err.message })
})

app.listen(port, ()=>{
  console.log("Server Started", port)
})