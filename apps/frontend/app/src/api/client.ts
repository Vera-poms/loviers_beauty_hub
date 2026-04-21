import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? "/"

export const api = axios.create({
    baseURL,
    paramsSerializer: {
        indexes: null
    }
})

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config;
    }
)

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const currentPath = window.location.pathname;
        const isOnAdminPage = currentPath.includes("/admin");
        if (error.response?.status === 401 && isOnAdminPage) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("role");
            window.location.href = "/admin/signup";
        }
        return Promise.reject(error);
    }
)

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

export interface UploadMainServicePayload{
    service: string;
    braiding_hours?: string;
    // duration?: string;
    image?: File | "";
    video?: File | "";
}
export interface UploadSubServicePayload{
    service: string;
    title: string;
    description: string;
    // duration?: string;
    addons_required: boolean;
    price?: number;
    addons?: string[];
    braiding_hours: string;
    sub_category: string;
    image?: File | "";
    video?: File | ""   ;
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
export async function fetchServices(){
    const response = await api.get("/services/categories")
    return response.data
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
export async function uploadMainService(payload: UploadMainServicePayload){
    const formData = new FormData()
    formData.append("service", payload.service)
    formData.append("braiding_hours", payload.braiding_hours ?? "")
    // formData.append("duration", payload.duration ?? "")

    if (payload.image) formData.append("image", payload.image)
    if (payload.video) formData.append("video", payload.video)
    const {data} = await api.post("/services/main", formData)
    return data;
}
export async function uploadSubService(payload: UploadSubServicePayload){
    const formData = new FormData()
    formData.append("service", payload.service)
    formData.append("braiding_hours", payload.braiding_hours)
    // formData.append("duration", payload.duration ?? "")
    formData.append("title", payload.title)
    formData.append("description", payload.description)
    formData.append("addons_required", payload.addons_required.toString())
    if (payload.price) formData.append("price", payload.price.toString())
    if (payload.addons) formData.append("addons", JSON.stringify(payload.addons))
    formData.append("sub_category", payload.sub_category)
    if (payload.image) formData.append("image", payload.image)
    if (payload.video) formData.append("video", payload.video)

    const {data} = await api.post("/services/subcategory", formData);
    return data;
}


export async function updateMainService(service_id: string, payload: UploadMainServicePayload){
    const formData = new FormData()
    if (payload.braiding_hours !== undefined) formData.append("braiding_hours", payload.braiding_hours)
    // if (payload.duration !== undefined) formData.append("duration", payload.duration)
    if (payload.service !== undefined) formData.append("service", payload.service)
    if (payload.image) formData.append("image", payload.image)
    if (payload.video) formData.append("video", payload.video)

    const {data} = await api.patch(`/services/main/${service_id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return data;
}
export async function updateSubService(service_id: string, payload: UploadSubServicePayload){
    const formData = new FormData()
    if (payload.braiding_hours !== undefined) formData.append("braiding_hours", payload.braiding_hours)
    // if (payload.duration !== undefined) formData.append("duration", payload.duration)
    if (payload.service !== undefined) formData.append("service", payload.service)
    if (payload.title !== undefined) formData.append("title", payload.title)
    if (payload.description !== undefined) formData.append("description", payload.description)
    if (payload.addons_required !== undefined) formData.append("addons_required", payload.addons_required.toString())
    if (payload.price !== undefined) formData.append("price", payload.price.toString())
    if (payload.addons !== undefined) formData.append("addons", JSON.stringify(payload.addons))
    if (payload.sub_category !== undefined) formData.append("sub_category", payload.sub_category)
    if (payload.image) formData.append("image", payload.image)
    if (payload.video) formData.append("video", payload.video)

    const {data} = await api.patch(`/services/subcategory/${service_id}`, formData);
    return data;
}


export async function deleteMainService(service_id: string){
    const response = await api.delete(`/services/main/${service_id}`)
    return response.data;
}
export async function deleteSubService(service_id: string){
    const response = await api.delete(`/services/subcategory/${service_id}`)
    return response.data;
}