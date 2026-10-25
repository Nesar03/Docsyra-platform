import { createContext, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const DoctorContext = createContext();

const DoctorContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const savedDToken = localStorage.getItem("dToken");
  const [dToken, setDToken] = useState(
    savedDToken && savedDToken !== "undefined" && savedDToken !== "null" ? savedDToken : ""
  );
  const [appointments, setAppointments] = useState([]);
  const [dashData, setDashData] = useState(false);
  const [profileData, setProfileData] = useState(false);

  // stops double clicks from sending the same cancel/complete request twice
  const busy = useRef(new Set());
  const runOnce = async (key, fn) => {
    if (busy.current.has(key)) return;
    busy.current.add(key);
    try { await fn(); } finally { busy.current.delete(key); }
  };

  const getAuthHeader = () => ({
    headers: {
      Authorization: `Bearer ${dToken}`,
      dtoken: dToken
    },
  });

  const getAppointments = async () => {
    try {
      const { data } = await axios.get(
        backendUrl + "/api/doctor/appointments",
        getAuthHeader()
      );

      if (data.success) {
        setAppointments(data.appointments.reverse());
      } else {
        toast.error(data.message);
        if (data.message && data.message.includes('Not Authorized')) {
          localStorage.removeItem("dToken");
          setDToken("");
        }
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("dToken");
        setDToken("");
      }
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const completeAppointment = (appointmentId) => runOnce("a" + appointmentId, async () => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/doctor/complete-appointment",
        { appointmentId },
        getAuthHeader()
      );

      if (data.success) {
        toast.success(data.message);
        getAppointments();
        getDashData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  });

  const cancelAppointment = (appointmentId) => runOnce("a" + appointmentId, async () => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/doctor/cancel-appointment",
        { appointmentId },
        getAuthHeader()
      );

      if (data.success) {
        toast.success(data.message);
        getAppointments();
        getDashData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  });

  const getDashData = async () => {
    try {
      const { data } = await axios.get(
        backendUrl + "/api/doctor/dashboard",
        getAuthHeader()
      );

      if (data.success) {
        setDashData(data.dashData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getProfileData = async () => {
    try {
      const { data } = await axios.get(
        backendUrl + "/api/doctor/profile",
        getAuthHeader()
      );

      if (data.success) {
        setProfileData(data.profileData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const value = {
    dToken,
    setDToken,
    backendUrl,
    getAppointments,
    appointments,
    setAppointments,
    completeAppointment,
    cancelAppointment,
    getDashData,
    dashData,
    setDashData,
    getProfileData,
    setProfileData,
    profileData,
  };

  return (
    <DoctorContext.Provider value={value}>
      {props.children}
    </DoctorContext.Provider>
  );
};

export default DoctorContextProvider;
