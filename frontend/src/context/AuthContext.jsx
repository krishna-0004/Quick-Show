import { createContext, useContext, useState, useEffect } from "react";
import { api, store } from "../utils/axios.js";
import Loader from "../components/Loader.jsx";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // on mount -> try refresh -> then fetch /me
    useEffect(() => {
        const init = async () => {
            try {
                // 1. Call refresh
                const refreshRes = await api.post("/auth/refresh");
                if (refreshRes.data?.accessToken) {
                    store.setAccessToken(refreshRes.data.accessToken); // ✅ Save it
                }

                // 2. Then load profile
                const res = await api.get("/auth/me");
                setUser(res.data.user);
            } catch (err) {
                if (err.response?.status !== 401) {
                    console.error("Init auth error:", err);
                }
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);



    const login = async (token) => {
        store.setAccessToken(token);
        const { data } = await api.get('/auth/me');
        setUser(data.user);
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