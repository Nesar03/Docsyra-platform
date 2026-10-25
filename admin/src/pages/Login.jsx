import axios from 'axios'
import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { DoctorContext } from '../context/DoctorContext'
import { AdminContext } from '../context/AdminContext'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const Login = () => {

  const [state, setState] = useState('Admin')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

  const { setDToken } = useContext(DoctorContext)
  const { setAToken } = useContext(AdminContext)

  const navigate = useNavigate()

  const onSubmitHandler = async (event) => { 
    event.preventDefault();

    try {
    if (state === 'Admin') {

      const { data } = await axios.post(backendUrl + '/api/admin/login', { email, password })
      if (data.success) {
        setAToken(data.token)
        localStorage.setItem('aToken', data.token)
      } else {
        toast.error(data.message)
      }

    } else {

      const { data } = await axios.post(backendUrl + '/api/doctor/login', { email, password })
      if (data.success) {
        setDToken(data.token)
        localStorage.setItem('dToken', data.token)
      } else {
        toast.error(data.message)
      }

    }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }

  }

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
        <p className='text-2xl font-semibold m-auto'><span className='text-blue-500'>{state}</span> Login</p>
        <div className='w-full '>
          <p>Email</p>
          <input onChange={(e) => setEmail(e.target.value)} value={email} className='border border-[#DADADA] rounded w-full p-2 mt-1' type="email" required />
        </div>
        <div className='w-full '>
          <p>Password</p>
          <input onChange={(e) => setPassword(e.target.value)} value={password} className='border border-[#DADADA] rounded w-full p-2 mt-1' type="password" required />
        </div>
        <button className='bg-blue-500 text-white w-full py-2 rounded-md text-base cursor-pointer'>Login</button>
        {
          state === 'Admin'
            ? <p>Doctor Login? <span onClick={() => setState('Doctor')} className='text-blue-500 underline cursor-pointer'>Click here</span></p>
            : <p>Admin Login? <span onClick={() => setState('Admin')} className='text-blue-500 underline cursor-pointer'>Click here</span></p>
        }
        {
          state === 'Doctor' && (
            <p className='w-full text-center border-t pt-3 mt-1'>
              New Doctor?{' '}
              <span
                onClick={() => navigate('/doctor-register')}
                className='text-green-600 font-semibold underline cursor-pointer hover:text-green-700'
              >
                Register here
              </span>
            </p>
          )
        }
      </div>
    </form>
  );
};

export default Login
