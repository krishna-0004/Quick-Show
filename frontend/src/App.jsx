import { Routes, Route } from "react-router-dom";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AdminRoute from "./components/Admin/AdminRoute";
import DashboardLayout from "./components/Admin/DashboardLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMovies from "./pages/admin/AdminMovies";
import ShowAdmin from "./pages/admin/ShowAdmin";
import Show from "./pages/admin/Show";


import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/user/HomePage";
import BookingPage from "./pages/user/BookingPage";
import MyBookings from "./pages/user/MyBookings";
import AboutUs from "./pages/user/AboutUs";
import Contact from "./pages/user/Contact";
import Footer from "./components/Footer";

import OAuthSuccess from "./pages/OAuthSuccess";

const Movies = () => <h1 style={{ paddingTop: "80px", textAlign: "center" }}>Movies Page</h1>;

function App() {
  return (
    <>
      <Navbar />
      <div>
        <Routes>
          <Route path="/oauth-success" element={<OAuthSuccess />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutUs />} /> 
          <Route path="/contact" element={<Contact />} /> 
          <Route
            path="/book/:movieId"
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <DashboardLayout>
                  <AdminDashboard />
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
                  <ShowAdmin />
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
        </Routes>

        <ToastContainer position="top-right" autoClose={3000} />
      </div>
      <Footer />
    </>
  );
}

export default App;
