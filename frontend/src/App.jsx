import { Routes, Route } from "react-router-dom";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";


import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/admin/Dashboard";
import AdminRoute from "./components/AdminRoute";
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
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Dashboard />
              </AdminRoute>
            }
          />
        </Routes>
      </div>
    </>
  );
}

export default App;
