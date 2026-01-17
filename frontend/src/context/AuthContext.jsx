import { createContext, useContext, useState, useEffect } from "react";
import { api, store } from "../utils/axios.js";
import Loader from "../components/Loader.jsx";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            try {
                // ✅ 0. Check token from URL hash (OAuth redirect)
                const hash = window.location.hash;
                if (hash.startsWith("#accessToken=")) {
                    const token = hash.replace("#accessToken=", "");
                    store.setAccessToken(token);

                    // Clean URL
                    window.history.replaceState({}, document.title, "/");
                }

                // 1. Try refresh
                const refreshRes = await api.post("/auth/refresh");
                if (refreshRes.data?.accessToken) {
                    store.setAccessToken(refreshRes.data.accessToken);
                }

                // 2. Load profile
                const res = await api.get("/auth/me");
                setUser(res.data.user);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    // on mount -> try refresh -> then fetch /me
    useEffect(() => {
        const init = async () => {
            try {
                const refreshRes = await api.post("/auth/refresh");
                if (refreshRes.data?.accessToken) {
                    store.setAccessToken(refreshRes.data.accessToken);
                }

                const res = await api.get("/auth/me");
                setUser(res.data.user);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);




    const login = async (token, navigate) => {
        store.setAccessToken(token);
        const { data } = await api.get("/auth/me");
        setUser(data.user);

        // Redirect based on role
        if (data.user.role === "admin") {
            navigate("/admin");
        } else {
            navigate("/");
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            setUser(null);
            store.clear();
        }
    };

    const isAdmin = () => user?.role === "admin";
    const isUser = () => user?.role === "user";

    // if (loading) return <Loader />

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, api, isAdmin, isUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);