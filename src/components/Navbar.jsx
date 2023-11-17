import React from 'react';
import { Link } from 'react-router-dom'; // If you're using react-router for navigation

const Navbar = () => {
    return (
        <nav className="flex flex-row bg-dark-gray h-28 items-center">
            <div className='px-2 mr-auto'>
                <Link to="/" className='px-2'><img src='/logo.svg' alt='logo' width={200} /></Link>
            </div>
            <div className="links flex flex-row">
                <Link to="/knowledge" className='px-4 text-lg'>Knowledge Base</Link>
            </div>
        </nav>
    );
};

export default Navbar;