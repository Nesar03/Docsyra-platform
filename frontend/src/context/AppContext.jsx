import { createContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import axios from 'axios'

export const AppContext = createContext()

const AppContextProvider = (props) => {
    const currencySymbol = '₹'
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

    const savedToken = localStorage.getItem('token')
    const initialToken = savedToken && savedToken !== 'undefined' && savedToken !== 'null' && savedToken !== 'false' ? savedToken : ''

    const [doctors, setDoctors] = useState([])
    const [token, setToken] = useState(initialToken)
    const [userData, setUserData] = useState(false)
    const tokenRef = useRef(token) // latest token, used to ignore responses that arrive after logout/login
    tokenRef.current = token

    const getDoctorsData = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/doctor/list')
            if (data.success) {
                setDoctors(data.doctors)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const loadUserProfileData = async () => {
        const requestToken = token
        if (!requestToken || requestToken === 'undefined' || requestToken === 'null') {
            setUserData(false)
            return
        }
        try {
            const { data } = await axios.get(backendUrl + '/api/user/get-profile', {
                headers: { token: requestToken }
            })

            // user logged out or switched account while this request was running -> drop the result
            if (requestToken !== tokenRef.current) return

            if (data.success) {
                const safeUserData = {
                    ...data.userData,
                    address: data.userData.address || { line1: '', line2: '' },
                    gender: data.userData.gender || '',
                    dob: data.userData.dob || ''
                }
                setUserData(safeUserData)
            } else {
                toast.error(data.message)
                // expired / invalid token: log the user out instead of leaving a broken session
                localStorage.removeItem('token')
                setToken('')
                setUserData(false)
            }
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.removeItem('token')
                setToken('')
                setUserData(false)
            }
            toast.error(error.response?.data?.message || error.message)
        }
    }

    useEffect(() => {
        getDoctorsData()
    }, [])

    useEffect(() => {
        if (token) {
            loadUserProfileData()
        } else {
            setUserData(false)
        }
    }, [token])

    const value = {
        doctors, getDoctorsData,
        currencySymbol,
        backendUrl,
        token, setToken,
        userData, setUserData, loadUserProfileData
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider
