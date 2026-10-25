import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const PendingApprovals = () => {

  const { aToken, backendUrl } = useContext(AdminContext)
  const [pendingDoctors, setPendingDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState(null)

  const fetchPendingDoctors = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get(`${backendUrl}/api/admin/pending-doctors`, {
        headers: { atoken: aToken }
      })
      if (data.success) {
        setPendingDoctors(data.doctors)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const approveDoctor = async (docId) => {
    try {
      setApprovingId(docId)
      const { data } = await axios.post(`${backendUrl}/api/admin/approve-doctor`,
        { docId },
        { headers: { atoken: aToken } }
      )
      if (data.success) {
        toast.success(data.message)
        setPendingDoctors(prev => prev.filter(doc => doc._id !== docId))
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setApprovingId(null)
    }
  }

  useEffect(() => {
    if (aToken) fetchPendingDoctors()
  }, [aToken])

  return (
    <div className='m-5 w-full'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-xl font-bold text-gray-800'>Pending Approvals</h1>
          <p className='text-sm text-gray-500 mt-0.5'>Review and verify doctors who have self-registered</p>
        </div>
        <span className='bg-amber-100 text-amber-700 text-sm font-semibold px-3 py-1 rounded-full'>
          {pendingDoctors.length} Pending
        </span>
      </div>

      {loading ? (
        <div className='flex justify-center items-center h-40'>
          <div className='w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
        </div>
      ) : pendingDoctors.length === 0 ? (
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-20 text-center'>
          <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4'>
            <svg xmlns="http://www.w3.org/2000/svg" className='w-8 h-8 text-green-500' fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className='text-lg font-semibold text-gray-700'>All Caught Up!</p>
          <p className='text-sm text-gray-400 mt-1'>No pending doctor approvals at the moment.</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4'>
          {pendingDoctors.map((doctor) => (
            <div
              key={doctor._id}
              className='bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5 hover:shadow-md transition-shadow'
            >
              {/* Doctor Image */}
              <div className='w-16 h-16 rounded-full overflow-hidden border-2 border-amber-200 flex-shrink-0 bg-gray-100'>
                {doctor.image
                  ? <img src={doctor.image} alt={doctor.name} className='w-full h-full object-cover' />
                  : <div className='w-full h-full flex items-center justify-center text-2xl font-bold text-blue-400'>
                      {doctor.name?.[0] || 'D'}
                    </div>
                }
              </div>

              {/* Doctor Info */}
              <div className='flex-1 min-w-0'>
                <div className='flex flex-wrap items-center gap-2'>
                  <h2 className='text-base font-bold text-gray-800 truncate'>{doctor.name}</h2>
                  <span className='bg-blue-100 text-blue-600 text-xs font-medium px-2 py-0.5 rounded-full'>{doctor.speciality}</span>
                  <span className='bg-amber-100 text-amber-600 text-xs font-medium px-2 py-0.5 rounded-full'>Awaiting Approval</span>
                </div>
                <p className='text-sm text-gray-500 mt-0.5'>{doctor.email}</p>
                <div className='flex flex-wrap gap-4 mt-2 text-xs text-gray-500'>
                  <span> {doctor.degree}</span>
                  <span> {doctor.experience} experience</span>
                  <span> ₹{doctor.fees} per visit</span>
                </div>
                {doctor.about && (
                  <p className='text-xs text-gray-400 mt-2 line-clamp-2'>{doctor.about}</p>
                )}
              </div>

              {/* Action Button */}
              <div className='flex-shrink-0'>
                <button
                  onClick={() => approveDoctor(doctor._id)}
                  disabled={approvingId === doctor._id}
                  className='bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2'
                >
                  {approvingId === doctor._id ? (
                    <>
                      <div className='w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                      Approving...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className='w-4 h-4' fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PendingApprovals
