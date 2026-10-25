import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate, useLocation } from 'react-router-dom'

const Login = ({ initialMode }) => {
  const { backendUrl, token, setToken, userData } = useContext(AppContext)
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const queryMode = searchParams.get('mode')

  const isRegisterRoute = 
    initialMode === 'Sign Up' ||
    location.pathname === '/register' ||
    location.pathname === '/registration' ||
    queryMode === 'signup' ||
    queryMode === 'register'

  const [state, setState] = useState(isRegisterRoute ? 'Sign Up' : 'Login')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    if (isRegisterRoute) {
      setState('Sign Up')
    } else if (location.pathname === '/login' && !queryMode) {
      setState('Login')
    }
  }, [location.pathname, queryMode, isRegisterRoute])

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    const effectiveBackendUrl = backendUrl || import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'
    try {
      if (state === 'Sign Up') {
        const { data } = await axios.post(effectiveBackendUrl + '/api/user/register', { name, email, password })

        if (data.success) {
          localStorage.setItem('token', data.token)
          setToken(data.token)
          toast.success('Account created successfully!')
        } else {
          toast.error(data.message)
        }
      } else {
        const { data } = await axios.post(effectiveBackendUrl + '/api/user/login', { email, password })

        if (data.success) {
          localStorage.setItem('token', data.token)
          setToken(data.token)
          toast.success('Logged in successfully!')
        } else {
          toast.error(data.message)
        }
      }
    } catch(error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }

  // Only redirect if user has BOTH token AND validated userData
  useEffect(() => {
    if (token && userData) {
      navigate('/')
    }
  }, [token, userData, navigate])

  

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
        <p className='text-2xl font-semibold'>{state === 'Sign Up' ? 'Create Account' : 'Login'}</p>
        <p>Please {state === 'Sign Up' ? 'sign up' : 'log in'} to book appointment</p>
        {state === 'Sign Up'
          ? <div className='w-full '>
            <p>Full Name</p>
            <input onChange={(e) => setName(e.target.value)} value={name} className='border border-[#DADADA] rounded w-full p-2 mt-1' type="text" required />
          </div>
          : null
        }
        <div className='w-full '>
          <p>Email</p>
          <input onChange={(e) => setEmail(e.target.value)} value={email} className='border border-[#DADADA] rounded w-full p-2 mt-1' type="email" required />
        </div>
        <div className='w-full '>
          <p>Password</p>
          <input onChange={(e) => setPassword(e.target.value)} value={password} className='border border-[#DADADA] rounded w-full p-2 mt-1' type="password" required />
        </div>
        <button type='submit' className='bg-blue-500 text-white cursor-pointer w-full py-2 my-2 rounded-md text-base'>{state === 'Sign Up' ? 'Create account' : 'Login'}</button>
        {state === 'Sign Up'
          ?
            <p>Already have an account? <span onClick={() => setState('Login')} className='text-blue-500 underline cursor-pointer'>Login here</span></p>
          : <p>Create an new account? <span onClick={() => setState('Sign Up')} className='text-blue-500 underline cursor-pointer'>Click here</span></p>
        }
      </div>
    </form>
  )
}

export default Login