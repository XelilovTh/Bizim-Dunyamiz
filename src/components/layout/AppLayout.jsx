import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import MiniPlayer from '../music/MiniPlayer';
import FullPlayer from '../music/FullPlayer';

export default function AppLayout() {
  return (
    <div className="app-container">
      <main className="page-content">
        <Outlet />
      </main>
      <MiniPlayer />
      <BottomNav />
      <FullPlayer />
    </div>
  );
}

