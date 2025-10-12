import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import "../../style/Sidebar.css"

const Sidebar = () => {
  return (
    <div>
        <aside className='sidebar'>
            <div className="logo">🎬 Admin</div>
            <nav>
                <NavLink to="/admin" end>Dashboard</NavLink>
                <NavLink to="/admin/movies" >Movies</NavLink>
                <NavLink to="/admin/show" >Shows</NavLink>
                <NavLink to="/admin/booking" >Bookings</NavLink>
            </nav>
        </aside>
    </div>
  )
}

export default Sidebar
