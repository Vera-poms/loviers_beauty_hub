import axios from 'axios';

const baseURL = import.meta.env.API_URL ?? "/"

export const api = axios.create({
    baseURL,
    paramsSerializer: {
        indexes: null
    }
})

export interface Appointment {
    service: string;
    name: string;
    email: string;
    time: string;
    date: string;
    notes?: string;
    image_url?: string;
    video_url?: string;
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
    const {data} = await api.post("/appointments", appointment);
    return data;
}