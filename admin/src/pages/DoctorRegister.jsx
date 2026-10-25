import React, { useState } from 'react'
import { assets } from '../assets/assets'
import { toast } from 'react-toastify'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const DoctorRegister = () => {

  const [docImg, setDocImg] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [experience, setExperience] = useState('1 Year')
  const [fees, setFees] = useState('')
  const [about, setAbout] = useState('')
  const [speciality, setSpeciality] = useState('General physician')
  const [degree, setDegree] = useState('')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [loading, setLoading] = useState(false)

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'
  const navigate = useNavigate()

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    try {
      setLoading(true)
      const formData = new FormData()
      if (docImg) {
        formData.append('image', docImg)
      }
      formData.append('name', name)
      formData.append('email', email)
      formData.append('password', password)
      formData.append('experience', experience)
      formData.append('fees', Number(fees))
      formData.append('about', about)
      formData.append('speciality', speciality)
      formData.append('degree', degree)
      formData.append('address', JSON.stringify({ line1: address1, line2: address2 }))

      const { data } = await axios.post(`${backendUrl}/api/doctor/register`, formData)
      if (data.success) {
        toast.success(data.message)
        setTimeout(() => navigate('/'), 2000)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-10 px-4'>
      <div className='w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden'>

        {/* Header */}
        <div className='bg-gradient-to-r from-blue-600 to-yellow-600 px-10 py-8 text-white text-center'>
          <h1 className='text-3xl font-bold mb-1'>Doctor Registration</h1>
          <p className='text-blue-100 text-sm'>Submit your details for admin verification. You'll be live on the platform once approved.</p>
        </div>

        <form onSubmit={onSubmitHandler} className='px-10 py-8'>

          {/* Profile Image Upload */}
          <div className='flex flex-col items-center mb-8'>
            <label htmlFor="doc-img" className='cursor-pointer group relative'>
              <div className='w-24 h-24 rounded-full overflow-hidden border-4 border-blue-200 shadow-md group-hover:border-blue-400 transition-all'>
                <img
                  className='w-full h-full object-cover'
                  src={docImg ? URL.createObjectURL(docImg) : assets.upload_area}
                  alt="Profile"
                />
              </div>
              <div className='absolute bottom-0 right-0 bg-blue-500 rounded-full p-1.5 shadow-md group-hover:bg-blue-600 transition-all'>
                <svg xmlns="http://www.w3.org/2000/svg" className='w-3.5 h-3.5 text-white' fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </label>
            <input onChange={(e) => setDocImg(e.target.files[0])} type="file" id="doc-img" hidden accept="image/*" />
            <p className='text-xs text-gray-400 mt-2'>Upload profile picture</p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-5 text-gray-700'>

            {/* Left Column */}
            <div className='flex flex-col gap-4'>
              <div className='flex flex-col gap-1'>
                <label className='text-sm font-medium text-gray-600'>Full Name</label>
                <input
                  onChange={e => setName(e.target.value)} value={name}
                  className='border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300 transition'
                  type="text" placeholder='Dr. John Smith' required
                />
              </div>
              <div className='flex flex-col gap-1'>
                <label className='text-sm font-medium text-gray-600'>Email Address</label>
                <input
                  onChange={e => setEmail(e.target.value)} value={email}
                  className='border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300 transition'
                  type="email" placeholder='doctor@email.com' required
                />
              </div>
              <div className='flex flex-col gap-1'>
                <label className='text-sm font-medium text-gray-600'>Password</label>
                <input
                  onChange={e => setPassword(e.target.value)} value={password}
                  className='border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300 transition'
                  type="password" placeholder='Min. 8 characters' required
                />
              </div>
              <div className='flex flex-col gap-1'>
                <label className='text-sm font-medium text-gray-600'>Experience</label>
                <select
                  onChange={e => setExperience(e.target.value)} value={experience}
                  className='border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300 transition bg-white'
                >
                  {['1 Year','2 Year','3 Year','4 Year','5 Year','6 Year','7 Year','8 Year','9 Year','10 Year'].map(y => (
                    <option key={y} value={y}>{y}{y === '10 Year' ? '+' : ''}</option>
                  ))}
                </select>
              </div>
              <div className='flex flex-col gap-1'>
                <label className='text-sm font-medium text-gray-600'>Consultation Fees (₹)</label>
                <input
                  onChange={e => setFees(e.target.value)} value={fees}
                  className='border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300 transition'
                  type="number" placeholder='e.g. 500' required
                />
              </div>
            </div>

            {/* Right Column */}
            <div className='flex flex-col gap-4'>
              <div className='flex flex-col gap-1'>
                <label className='text-sm font-medium text-gray-600'>Speciality</label>
                <select
                  onChange={e => setSpeciality(e.target.value)} value={speciality}
                  className='border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300 transition bg-white'
                >
                  <option value="General physician">General Physician</option>
                  <option value="Gynecologist">Gynecologist</option>
                  <option value="Dermatologist">Dermatologist</option>
                  <option value="Pediatricians">Pediatrician</option>
                  <option value="Neurologist">Neurologist</option>
                  <option value="Gastroenterologist">Gastroenterologist</option>
                </select>
              </div>
              <div className='flex flex-col gap-1'>
                <label className='text-sm font-medium text-gray-600'>Degree / Qualification</label>
                <input
                  onChange={e => setDegree(e.target.value)} value={degree}
                  className='border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300 transition'
                  type="text" placeholder='e.g. MBBS, MD' required
                />
              </div>
              <div className='flex flex-col gap-1'>
                <label className='text-sm font-medium text-gray-600'>Clinic Address</label>
                <input
                  onChange={e => setAddress1(e.target.value)} value={address1}
                  className='border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300 transition'
                  type="text" placeholder='Address Line 1' required
                />
                <input
                  onChange={e => setAddress2(e.target.value)} value={address2}
                  className='border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300 transition mt-2'
                  type="text" placeholder='Address Line 2 (optional)'
                />
              </div>
            </div>
          </div>

          {/* About */}
          <div className='mt-5 flex flex-col gap-1'>
            <label className='text-sm font-medium text-gray-600'>About Yourself</label>
            <textarea
              onChange={e => setAbout(e.target.value)} value={about}
              className='w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300 transition resize-none'
              rows={4}
              placeholder='Briefly describe your expertise, experience, and approach to patient care...'
              required
            />
          </div>

          {/* Notice Banner */}
          <div className='mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3'>
            <svg xmlns="http://www.w3.org/2000/svg" className='w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0' fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
            </svg>
            <p className='text-amber-700 text-sm'>
              <span className='font-semibold'>Pending Admin Approval:</span> After you register, your profile will be reviewed by our admin team. Once verified, you'll be visible on the platform and patients can start booking appointments with you.
            </p>
          </div>

          {/* Submit */}
          <button
            type='submit'
            disabled={loading}
            className='cursor-pointer mt-6 w-full bg-gradient-to-r from-blue-600 to-yellow-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-semibold text-base shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed'
          >
            {loading ? 'Submitting...' : 'Submit for Verification'}
          </button>

          <p className='text-center text-sm text-gray-500 mt-4'>
            Already registered?{' '}
            <span onClick={() => navigate('/')} className='text-blue-500 hover:underline cursor-pointer font-medium'>
              Login here
            </span>
          </p>
        </form>
      </div>
    </div>
  )
}

export default DoctorRegister
