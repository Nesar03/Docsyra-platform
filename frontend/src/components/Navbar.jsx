import { useState, useEffect, useRef } from "react";
import { assets } from "../assets/assets";
import { NavLink, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";

const Navbar = () => {
  const navigate = useNavigate();

  const {token,setToken, userData} = useContext(AppContext)
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      profileRef.current &&
      !profileRef.current.contains(event.target)
    ) {
      setShowProfileMenu(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

  const logout = () => {
    localStorage.removeItem('token')
    setToken(false)
    navigate('/login')
  }

  return (
    <div className="flex items-center justify-between text-sm py-4 mb-5 border-b border-b-gray-400">
      {/* Logo */}
      <img onClick={()=>navigate('/')} src={assets.logo} alt="Logo" className="w-44 cursor-pointer" />

      {/* Navigation Links */}
      <ul className="hidden md:flex items-start gap-5 font-medium">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center ${
              isActive ? "text-[#5F6FFF]" : "text-gray-700"
            }`
          }
        >
          <li>HOME</li>
          <hr className="w-8 h-0.5 border-none bg-[#5F6FFF] opacity-0 " />
        </NavLink>

        <NavLink
          to="/doctors"
          className={({ isActive }) =>
            `flex flex-col items-center ${
              isActive ? "text-[#5F6FFF]" : "text-gray-700"
            }`
          }
        >
          <li>ALL DOCTORS</li>
          <hr className="w-12 h-0.5 border-none bg-[#5F6FFF] opacity-0" />
        </NavLink>

        <NavLink
          to="/about"
          className={({ isActive }) =>
            `flex flex-col items-center ${
              isActive ? "text-[#5F6FFF]" : "text-gray-700"
            }`
          }
        >
          <li>ABOUT</li>
          <hr className="w-8 h-0.5 border-none bg-[#5F6FFF] opacity-0" />
        </NavLink>

        <NavLink
          to="/contact"
          className={({ isActive }) =>
            `flex flex-col items-center ${
              isActive ? "text-[#5F6FFF]" : "text-gray-700"
            }`
          }
        >
          <li>CONTACT</li>
          <hr className="w-10 h-0.5 border-none bg-[#5F6FFF] opacity-0" />
        </NavLink>
      </ul>

      {/* Button */}
      <div className="flex items-center gap-4">
        {token && userData
         ? (
          <div
          ref={profileRef}
  className="flex items-center gap-2 cursor-pointer relative"
  onClick={() => setShowProfileMenu(!showProfileMenu)}
>
  <img className="w-8 rounded-full" src={userData.image} alt="" />
  <img className="w-2.5" src={assets.dropdown_icon} alt="" />

  {showProfileMenu && (
    <div
      className="absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20"
    >
      <div className="min-w-48 bg-stone-100 rounded flex flex-col gap-4 p-4">
        <p
          onClick={() => {
            navigate('/my-profile');
            setShowProfileMenu(false);
          }}
          className="hover:text-black cursor-pointer"
        >
          My_Profile
        </p>

        <p
          onClick={() => {
            navigate('/my-appointment');
            setShowProfileMenu(false);
          }}
          className="hover:text-black cursor-pointer"
        >
          My_Appointments
        </p>

        <p
          onClick={() => {
            logout();
          }}
          className="hover:text-black cursor-pointer"
        >
          Logout
        </p>
      </div>
    </div>
  )}
</div>
        ) : (
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => navigate("/login")}
              className="text-[#5F6FFF] px-4 py-2 font-medium cursor-pointer hover:underline"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              className="bg-[#5F6FFF] text-white px-6 py-2.5 rounded-full font-light cursor-pointer hover:bg-blue-600 transition-all"
            >
              Create account
            </button>
          </div>
        )}
        <button
          onClick={() => window.open(import.meta.env.VITE_ADMIN_URL || "http://localhost:5174", "_blank")}
          className="hidden md:block border border-[#5F6FFF] text-[#5F6FFF] px-5 py-2.5 rounded-full font-light cursor-pointer hover:bg-[#5F6FFF] hover:text-white transition-all"
        >
          Admin Panel
        </button>
        <img onClick={() => setShowMenu(true)} className='w-6 md:hidden cursor-pointer' src={assets.menu_icon} alt="" />
        
        {/* ------ Mobile Menu ------- */}
        <div className={` ${showMenu ? 'fixed w-full' : 'h-0 w-0'} md:hidden right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}>
            <div className='flex items-center justify-between px-5 py-6'>
                <img className='w-36' src={assets.logo} alt="" />
                <img className='w-7 cursor-pointer' onClick={() => setShowMenu(false)} src={assets.cross_icon} alt="" />
            </div>
            <ul className='flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium'>
                <NavLink onClick={() => setShowMenu(false)} to='/'><p className='px-4 py-2 rounded inline-block'>HOME</p></NavLink>
                <NavLink onClick={() => setShowMenu(false)} to='/doctors'><p className='px-4 py-2 rounded inline-block'>ALL DOCTORS</p></NavLink>
                <NavLink onClick={() => setShowMenu(false)} to='/about'><p className='px-4 py-2 rounded inline-block'>ABOUT</p></NavLink>
                <NavLink onClick={() => setShowMenu(false)} to='/contact'><p className='px-4 py-2 rounded inline-block'>CONTACT</p></NavLink>
            </ul>
            <div className="flex flex-col items-center px-5 mt-4 gap-2">
              {!(token && userData) && (
                <>
                  <button
                    onClick={() => { setShowMenu(false); navigate("/login"); }}
                    className="w-full sm:w-4/5 border border-[#5F6FFF] text-[#5F6FFF] px-6 py-3 rounded-full font-light cursor-pointer"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); navigate("/register"); }}
                    className="w-full sm:w-4/5 bg-[#5F6FFF] text-white px-6 py-3 rounded-full font-light cursor-pointer mb-2"
                  >
                    Create account
                  </button>
                </>
              )}
              <button
                onClick={() => { setShowMenu(false); window.open(import.meta.env.VITE_ADMIN_URL || "http://localhost:5174", "_blank"); }}
                className="w-full sm:w-4/5 border border-[#5F6FFF] text-[#5F6FFF] px-6 py-3 rounded-full font-light cursor-pointer hover:bg-[#5F6FFF] hover:text-white transition-all"
              >
                Admin Panel
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
