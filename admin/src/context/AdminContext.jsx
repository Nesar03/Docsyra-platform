import axios from "axios";
import { createContext, useRef, useState } from "react";
import { toast } from "react-toastify";


export const AdminContext = createContext()

const AdminContextProvider = (props) => {

    const saved = localStorage.getItem('aToken')
    const [aToken, setAToken] = useState(saved && saved !== 'undefined' && saved !== 'null' ? saved : '')
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'
    const [appointments, setAppointments] = useState([])

    const [doctors, setDoctors] = useState([])
    const [dashData, setDashData] = useState(false)

    // ids of requests that are still running, so a double click can't send the same action twice
    const busy = useRef(new Set())
    const runOnce = async (key, fn) => {
        if (busy.current.has(key)) return
        busy.current.add(key)
        try { await fn() } finally { busy.current.delete(key) }
    }


    const getAllDoctors = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/admin/all-doctors', { headers: { aToken } })
            if (data.success) {
                setDoctors(data.doctors)
            } else {
                toast.error(data.message)
                if (data.message && data.message.includes('Not Authorized')) {
                    localStorage.removeItem('aToken')
                    setAToken('')
                }
            }

        } catch (error) {
            if (error.response?.status === 401) {
                localStorage.removeItem('aToken')
                setAToken('')
            }
            toast.error(error.response?.data?.message || error.message)
        }

    }

    const changeAvailability = (docId) => runOnce('avail' + docId, async () => {
        try {

            const { data } = await axios.post(backendUrl + '/api/admin/change-availability', { docId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }
    })

    const removeDoctor = (docId) => runOnce('remove' + docId, async () => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/remove-doctor', { docId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    })

    // Getting all appointment data from Database using API
    const getAllAppointments = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/admin/appointments', { headers: { aToken } })
            if (data.success) {
                setAppointments(data.appointments.reverse())
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }

    }

    // Function to cancel appointment using API
    const cancelAppointment = (appointmentId) => runOnce('cancel' + appointmentId, async () => {

        try {

            const { data } = await axios.post(backendUrl + '/api/admin/cancel-appointment', { appointmentId }, { headers: { aToken } })

            if (data.success) {
                toast.success(data.message)
                getAllAppointments()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }

    })
    
    // Getting Admin Dashboard data from Database using API
    const getDashData = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/admin/dashboard', { headers: { aToken } })

            if (data.success) {
                setDashData(data.dashData)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }

    }

    const value = {
        aToken, setAToken,
        backendUrl, 
        doctors,
        getAllDoctors, changeAvailability, removeDoctor,
        appointments, setAppointments,
        getAllAppointments, cancelAppointment,
         getDashData, dashData
    }

    return (
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>

    )

}
export default AdminContextProvider
