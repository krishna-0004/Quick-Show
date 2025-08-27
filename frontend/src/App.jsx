import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/admin/Dashboard";
import AdminRoute from "./components/AdminRoute";

const Home = () => <h1 style={{ paddingTop: "80px", textAlign: "center" }}>Home Page</h1>;
const Movies = () => <h1 style={{ paddingTop: "80px", textAlign: "center" }}>Movies Page</h1>;
const Booking = () => <h1 style={{ paddingTop: "80px", textAlign: "center" }}>Booking Page</h1>;

function App() {
  return (
    <>
      <Navbar />
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
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
