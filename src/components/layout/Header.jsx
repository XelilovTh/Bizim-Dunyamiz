import React from 'react';
import './Header.css';

export default function Header({ subtitle }) {
  return (
    <header className="app-header">
      {/* "Bizim Dünyamız" - Çəhrayıdan ağa və yenidən çəhrayıya hamar horizontal gradient */}
      <h1 className="header-logo romantic-title-gradient">
        Bizim Dünyamız
      </h1>

      {subtitle && <p className="header-subtitle">{subtitle}</p>}
    </header>
  );
}
