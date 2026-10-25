import React from 'react'
import { assets } from '../assets/assets'
import { Navigate, useNavigate } from 'react-router-dom'

const Banner = () => {

  const navigate = useNavigate();

  return (
    <div className="flex bg-blue-500 rounded-lg px-6 sm:px-10 md:px-14 lg:px-12 my-20 md:mx-10">

      {/* ---------- Left Side ---------- */}
      <div className="flex-1 flex flex-col justify-center py-8 sm:py-10 md:py-16 lg:py-24 lg:pl-5">

        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white leading-tight">
            Book Appointment
          </h1>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white leading-tight mt-2">
            With 100+ Trusted Doctors
          </h1>
        </div>

        <button onClick={()=>{navigate('/register');scrollTo(0,0)}} className="mt-8 bg-white text-gray-700 px-8 py-3 rounded-full w-fit font-medium hover:scale-105 transition-all duration-300 cursor-pointer">
          Create Account
        </button>

      </div>

      {/* ---------- Right Side ---------- */}
      <div className="hidden md:block md:w-1/2 lg:w-[370px] relative">

        <img
          src={assets.appointment_img}
          alt="Appointment"
          className="absolute bottom-0 right-0 h-[430px] w-auto"
        />

      </div>

    </div>
  )
}

export default Banner