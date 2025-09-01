import { Routes, Route } from "react-router-dom";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AdminRoute from "./components/Admin/AdminRoute";
import DashboardLayout from "./components/Admin/DashboardLayout";
import DashboardHome from "./pages/admin/DashboardHome";
import AdminMovies from "./pages/admin/AdminMovies";
import Bookings from "./pages/admin/Bookings";
import Show from "./pages/admin/Show";
import Users from "./pages/admin/Users";


import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/user/HomePage";

const Movies = () => <h1 style={{ paddingTop: "80px", textAlign: "center" }}>Movies Page</h1>;
const Booking = () => <h1 style={{ paddingTop: "80px", textAlign: "center" }}>Booking Page</h1>;

function App() {
  return (
    <>
      <Navbar />
      <div>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/booking" element={
            <ProtectedRoute>
              <Booking />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route 
            path="/admin"
            element={
              <AdminRoute>
                <DashboardLayout>
                  <DashboardHome />
                </DashboardLayout>
              </AdminRoute>
            }
          />
          <Route 
            path="/admin/movies"
            element={
              <AdminRoute>
                <DashboardLayout>
                  <AdminMovies />
                </DashboardLayout>
              </AdminRoute>
            }
          />
          <Route 
            path="/admin/booking"
            element={
              <AdminRoute>
                <DashboardLayout>
                  <Bookings />
                </DashboardLayout>
              </AdminRoute>
            }
          />
          <Route 
            path="/admin/show"
            element={
              <AdminRoute>
                <DashboardLayout>
                  <Show />
                </DashboardLayout>
              </AdminRoute>
            }
          />
          <Route 
            path="/admin/users"
            element={
              <AdminRoute>
                <DashboardLayout>
                  <Users />
                </DashboardLayout>
              </AdminRoute>
            }
          />
        </Routes>

        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </>
  );
}

export default App;
