import Homepage from "./components/Home/Hompage"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import ServiceDetails from "./components/Services/ServiceDetail"
import BookingPage from "./components/Booking/BookingPage"
import Signup from "./components/Admin/Signup";
import Dashboard from "./components/Admin/Dashboard";

const mockService = {
  id: 1,
  image: null,
  video: null,
  title: "Box Braids",
  description: "Classic protective style",
  braidingHours: "4–6 hours",
};

const mockSubcategories = [
  { id: 1, name: "Small", image: null },
  { id: 2, name: "Medium", image: null },
];

const router = createBrowserRouter([
  {
    path: "/",
    element: <Homepage/>,
  },
  {
    path: "/services",
    element: <ServiceDetails service={mockService} subcategories={mockSubcategories} />
  },
  {
    path: "/booking",
    element: <BookingPage />
  },
  {
    path: "/admin/signup",
    element: <Signup />
  },
  {
    path: "/admin/dashboard",
    element: <Dashboard />
  },
])

function App() {

  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App
