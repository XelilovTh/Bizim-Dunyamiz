import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';
import { MusicProvider } from './context/MusicContext';
import AppLayout from './components/layout/AppLayout';
import LoadingSpinner from './components/common/LoadingSpinner';
import { initVisitorAnalytics } from './services/analyticsService';

// Kodun parçalanması (Code Splitting / Lazy Loading)
const HomePage = lazy(() => import('./pages/HomePage'));
const PhotosPage = lazy(() => import('./pages/PhotosPage'));
const LettersPage = lazy(() => import('./pages/LettersPage'));
const MusicPage = lazy(() => import('./pages/MusicPage'));
const LoginScreen = lazy(() => import('./components/auth/LoginScreen'));

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('dunyam_auth') === 'true';
  });

  // Əgər əvvəlcədən daxil olubsa (Məni xatırla ilə), giriş bildirişini göndər
  useEffect(() => {
    if (isAuthenticated) {
      initVisitorAnalytics();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <>
        <div className="fixed-universe-bg" />
        <ToastProvider>
          <Suspense fallback={<LoadingSpinner message="Giriş hazırlanır..." />}>
            <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />
          </Suspense>
        </ToastProvider>
      </>
    );
  }

  return (
    <>
      <div className="fixed-universe-bg" />
      <DataProvider>
        <ToastProvider>
          <MusicProvider>
            <BrowserRouter>
              <Suspense fallback={<LoadingSpinner message="Bölmə açılır..." />}>
              <Routes>
                <Route path="/" element={<AppLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="photos" element={<PhotosPage />} />
                  <Route path="letters" element={<LettersPage />} />
                  <Route path="music" element={<MusicPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </MusicProvider>
      </ToastProvider>
    </DataProvider>
    </>
  );
}
