import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? "/"

export const api = axios.create({
    baseURL,
    paramsSerializer: {
        indexes: null
    }
})

export interface Appointment {
    service_id: string;
    sub_category: string;
    service: string;
    name: string;
    email: string;
    phone_number: string;
    addons?: string[];
    price?: number;
    time: string;
    date: string;
    notes?: string;
    image_url?: string;
    video_url?: string;
}

export interface AppointmentPreview {
    service_id: string;
    addons: string[];
    available_date: string;
    available_time: string
}

export async function fetchCategories(){
    const response = await api.get("/services/categories")
    return response.data
}
export async function fetchMainServices(query="", limit = 10, skip = 0){
    const {data} = await api.get("/services/main", {
        params: {
            query,
            limit,
            skip
        }
    });
    return data.data;
}
export async function fetchSubServices(query="", limit = 10, skip = 0){
    const {data} = await api.get("/services/subcategory", {
        params: {
            query,
            limit,
            skip
        }
    });
    return data.data;
}
export async function fetchBookedAppointment(appointment_id: string){
    const {data} = await api.get(`/appointments/${appointment_id}`);
    return data.data;
}


export async function bookAppointment(appointment: Appointment){
    const {data} = await api.post("/appointments", appointment, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
    return data;
}
export async function bookingPreview(appointment: AppointmentPreview){
    const {data} = await api.post("/appointments/preview", appointment, {
    headers: {
    'Content-Type': 'multipart/form-data',
    },
    });
    return data;
}
export async function signup(
    username: string,
    email: string,
    password: string,
    role: "admin"
){
    const formData = new FormData()
    formData.append("username", username)
    formData.append("email", email)
    formData.append("password", password)
    formData.append("role", role)
    const {data} = await api.post("/auth/signup", formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return data;
}
export async function login(
    email: string,
    password: string,
){
    const formData = new FormData()
    formData.append("email", email)
    formData.append("password", password)
    const {data} = await api.post("/auth/login", formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return data;
}