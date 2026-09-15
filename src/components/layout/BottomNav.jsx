import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Image, Mail, Music, Heart } from 'lucide-react';
import './BottomNav.css';

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-glass">
        {/* Home */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `nav-link ${isActive ? 'nav-link-active' : ''}`
          }
          aria-label="Ana Səhifə"
        >
          <Home size={22} className="nav-icon" strokeWidth={2} />
          <span className="nav-indicator" />
        </NavLink>

        {/* Photos */}
        <NavLink
          to="/photos"
          className={({ isActive }) =>
            `nav-link ${isActive ? 'nav-link-active' : ''}`
          }
          aria-label="Şəkillər"
        >
          <Image size={22} className="nav-icon" strokeWidth={1.8} />
          <span className="nav-indicator" />
        </NavLink>

        {/* Letters */}
        <NavLink
          to="/letters"
          className={({ isActive }) =>
            `nav-link ${isActive ? 'nav-link-active' : ''}`
          }
          aria-label="Məktublar"
        >
          <div className="nav-mail-icon-wrapper">
            <Mail size={22} className="nav-icon" strokeWidth={1.8} />
            <Heart size={8} className="nav-mail-heart" />
          </div>
          <span className="nav-indicator" />
        </NavLink>

        {/* Music */}
        <NavLink
          to="/music"
          className={({ isActive }) =>
            `nav-link ${isActive ? 'nav-link-active' : ''}`
          }
          aria-label="Musiqi"
        >
          <Music size={22} className="nav-icon" strokeWidth={1.8} />
          <span className="nav-indicator" />
        </NavLink>
      </div>
    </nav>
  );
}
