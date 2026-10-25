import jwt from 'jsonwebtoken'

// user authentication middleware
const authUser = async (req, res, next) => {
    const { token } = req.headers
    if (!token) {
        return res.json({ success: false, message: 'Not Authorized Login Again' })
    }
    try {
        const token_decode = jwt.verify(token, process.env.JWT_SECRET)

        if (!req.body) req.body = {}

        req.body.userId = token_decode.id
        req.userId = token_decode.id // multer replaces req.body for file uploads, so keep a copy here
        next()
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: 'Not Authorized Login Again' })
    }
}

export default authUser