import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { store } from "../utils/axios";
import { api } from "../utils/axios";

const OAuthSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        store.setAccessToken(token);
        const { data } = await api.get("/auth/me");

        // role-based redirect
        if (data.user.role === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch (err) {
        store.clear();
        navigate("/login");
      }
    };

    init();
  }, [navigate]);

  return <p>Signing you in...</p>;
};

export default OAuthSuccess;
