import React from 'react';
import "../../style/Topbar.css";

const Topbar = () => {
    return (
        <div>
            <header className="topbar">
                <h2>Dashboard</h2>
                <div className="user-profile">
                    <img src="/images/admin-avatar.png" alt="Admin" />
                    <span>Admin</span>
                </div>
            </header>
        </div>
    )
}

export default Topbar
