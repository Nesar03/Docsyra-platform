import React from 'react'
import { assets } from '../assets/assets'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <div className="mt-40">

      {/* ----- Main Footer ----- */}
      <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 text-sm">

        {/* ----- Left Section ----- */}
        <div>
          <img
            src={assets.logo}
            alt="Docsyra Logo"
            className="mb-5 w-44"
          />

          <p className="w-full md:w-2/3 text-gray-600 leading-6">
            Lorem ipsum dolor sit amet consectetur adipisicing elit.
            Eos magni praesentium quam error alias aliquid sint modi,
            quasi fugiat animi.
          </p>
        </div>

        {/* ----- Center Section ----- */}
        <div>
          <p className="font-semibold mb-5">COMPANY</p>

          <ul className="flex flex-col gap-2 text-gray-600">
            <li>
              <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Home</Link>
              </li>
            <li>
              <Link to="/about" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>About Us</Link>
              </li>
            <li>
              <Link to="/contact" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Contact Us</Link>
              </li>
            <li>Privacy Policy</li>
          </ul>
        </div>

        {/* ----- Right Section ----- */}
        <div>
          <p className="font-semibold mb-5">GET IN TOUCH</p>

          <ul className="flex flex-col gap-2 text-gray-600">
            <li>+1-212-456-7890</li>
            <li>Docsyradev@gmail.com</li>
          </ul>
        </div>

      </div>

      {/* ----- Copyright Section ----- */}
      <div>
        <hr className="border-gray-300" />

        <p className="py-5 text-sm text-center">
          Copyright 2024@ Docsyra - All Right Reserved.
        </p>
      </div>

    </div>
  )
}

export default Footer