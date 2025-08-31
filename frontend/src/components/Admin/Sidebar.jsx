import React from 'react';
import { Link, NavLink } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div>
        <aside className='sidebar'>
            <div className="logo">🎬 Admin</div>
            <nav>
                <NavLink></NavLink>
            </nav>
        </aside>
    </div>
  )
}

export default Sidebar
