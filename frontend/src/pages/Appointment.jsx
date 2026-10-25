import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import RelatedDoctors from '../components/RelatedDoctors'
import { toast } from 'react-toastify'
import axios from 'axios'
const Appointment = () => {

  const {docId} = useParams()
  const {doctors,currencySymbol,backendUrl,token,getDoctorsData} = useContext(AppContext)
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  const navigate = useNavigate()

  const [docInfo, setDocInfo] = useState(null)
  const [docSlots,setDocSlots] = useState([])
  const [slotIndex,setSlotIndex] = useState(0)
  const [slotTime,setSlotTime] = useState('')
  const [booking,setBooking] = useState(false)

  const fetchDocInfo = () => {
    const docInfo = doctors.find(doc => doc._id?.toString() === docId)
    setDocInfo(docInfo)
  }

  
  const formatSlotTime = (date) =>
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      .replace(/[\u202f\u00a0]/g, ' ')
      .toUpperCase()

  const getAvailableSlots = () => {
    const booked = docInfo.slots_booked || {}
    const now = new Date()
    const allDays = []

    for (let i = 0; i < 7; i++) {
      // getting date with index
      const currentDate = new Date(now)
      currentDate.setDate(now.getDate() + i)

      // end time of the day (9 PM)
      const endTime = new Date(currentDate)
      endTime.setHours(21, 0, 0, 0)

      if (i === 0) {
        // today: first slot is at least 1 hour from now, rounded UP to the next :00 / :30, never before 10:00
        currentDate.setTime(now.getTime() + 60 * 60 * 1000)
        currentDate.setSeconds(0, 0)
        const min = currentDate.getMinutes()
        if (min > 30) { currentDate.setHours(currentDate.getHours() + 1, 0) }
        else if (min > 0) { currentDate.setMinutes(30) }
        if (currentDate.getHours() < 10) currentDate.setHours(10, 0, 0, 0)
      } else {
        currentDate.setHours(10, 0, 0, 0)
      }

      const timeSlots = []
      while (currentDate < endTime) {
        const formattedTime = formatSlotTime(currentDate)
        const slotDate = currentDate.getDate() + "_" + (currentDate.getMonth() + 1) + "_" + currentDate.getFullYear()

        const bookedToday = (booked[slotDate] || []).map(t => String(t).replace(/[\u202f\u00a0]/g, ' ').toUpperCase())
        if (!bookedToday.includes(formattedTime)) {
          timeSlots.push({ datetime: new Date(currentDate), time: formattedTime })
        }

        // Increment current time by 30 minutes
        currentDate.setMinutes(currentDate.getMinutes() + 30)
      }
      allDays.push(timeSlots)
    }

    // one single state update, so two runs can never interleave and duplicate days
    setDocSlots(allDays)
  }

  const bookAppointment = async () => {
    if(!token){
      toast.warn('Login to book appointment')
      return navigate('/login')
    }
    if(booking) return // already sending a booking request (double click)
    if(!slotTime){
      return toast.warn('Please select a time slot')
    }
    try {
      setBooking(true)
      const chosen = (docSlots[slotIndex] || []).find(s => s.time === slotTime)
      if(!chosen){
        setSlotTime('')
        return toast.warn('Please select a time slot for the chosen day')
      }
      const date = chosen.datetime
      let day = date.getDate()
      let month = date.getMonth()+1
      let year = date.getFullYear()
      const slotDate = day +"_" + month + "_" + year
      const {data} = await axios.post(backendUrl + '/api/user/book-appointment',{docId,slotDate,slotTime},{headers:{token}})
      if(data.success){
        toast.success(data.message)
        getDoctorsData()
        navigate('/my-appointment')
      }
      else{
        toast.error(data.message)
        // slot list is out of date (someone else took it), reload it
        getDoctorsData()
        setSlotTime('')
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBooking(false)
    }
  }

  useEffect(() => {
    fetchDocInfo()
  }, [doctors,docId])

  useEffect(()=>{
    if(docInfo){
      getAvailableSlots()
    }
  },[docInfo])

  useEffect(()=>{
  },[docSlots])
  
  
  return docInfo && (
        <>
        <div>
          {/* -------- Doctors Details ---------- */}
          <div className='flex flex-col sm:flex-row gap-4 mt-2'>
            <div>
              <img className='bg-blue-500 w-full sm:max-w-72 rounded-lg' src={docInfo.image} alt="" />
            </div>
            <div className='flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0'>
              {/* ----------- Doc Info : name, degree, experience ---------- */}
              <p className='flex items-center gap-2 text-2xl font-medium text-gray-900'>{docInfo.name} 
                <img className='w-5' src={assets.verified_icon} alt="" /></p>
                <div className='flex items-center gap-2 text-sm mt-1 text-gray-600'>
                  <p>{docInfo.degree} - {docInfo.speciality}</p>
                  <button className='py-0.5 px-2 border text-xs rounded-full'>{docInfo.experience}</button>
                </div>

                {/* ------ Doctor About --------*/}
                <div>
                  <p className='flex items-center gap-1 text-sm font-medium text-gray-900 mt-3'>
                    About <img src={assets.info_icon} alt="" /></p>
                  <p className='text-sm text-gray-500 max-w-[700px] mt-1'>{docInfo.about}</p>
                </div>
                <p className='text-gray-500 font-medium mt-4'>
                  Appontment fee: <span className='text-gray-600'>{currencySymbol}{docInfo.fees}</span>
                </p>
            </div>
          </div>

          {/* -------- Booking slots ---------- */}
          <div className='sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700'>
            <p>Booking slots</p>
            <div className='flex gap-3 items-center w-full overflow-x-scroll mt-4'>
              {
                docSlots.length > 0 && docSlots.map((item,index)=>(
                  <div onClick={()=> setSlotIndex(index)} className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex === index ? 'bg-blue-500 text-white' : 'border border-gray-200'}`} key={index}>
                    <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                    <p>{item[0] && item[0].datetime.getDate()}</p>
                  </div>
                ))
              }
            </div>
            <div className='flex gap-3 items-center w-full overflow-x-scroll mt-4'>
  {docSlots.length > 0 &&
    docSlots[slotIndex] &&
    docSlots[slotIndex].map((item, index) => (
      <p onClick={()=>setSlotTime(item.time)}
        key={index}
        className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${
  item.time === slotTime
    ? 'bg-blue-500 text-white'
    : 'text-gray-400 border border-gray-300'
}`}
      >
        {item.time.toLowerCase()}
      </p>
    ))
  }
   </div>
    <button onClick={bookAppointment} disabled={booking} className='bg-blue-500 text-white text-sm font-light px-14 py-3 rounded-full my-6'>Book an appointment</button> 
  </div>

  {/* ---- listing related doctors */}
  <RelatedDoctors docId={docId} speciality={docInfo.speciality} />
</div>
  </>
  )
}

export default Appointment


