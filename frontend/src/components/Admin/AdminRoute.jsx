// src/components/AdminRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import Loader from "../Loader.jsx"

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
