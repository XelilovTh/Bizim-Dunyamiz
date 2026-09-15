import React, { useState, useEffect } from 'react';
import { Heart, Lock, KeyRound, Eye, EyeOff, ShieldAlert, Check } from 'lucide-react';
import { initVisitorAnalytics, trackUserAction } from '../../services/analyticsService';
import './LoginScreen.css';

export default function LoginScreen({ onLoginSuccess }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShake, setIsShake] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isCheckingBlock, setIsCheckingBlock] = useState(true);

  // 1. IP Blok statusunu yoxla
  useEffect(() => {
    async function checkBlockStatus() {
      try {
        const res = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check_block' }),
        });
        const data = await res.json();
        if (data && data.blocked) {
          setIsBlocked(true);
        }
      } catch (err) {
        console.warn('Block yoxlamasında xəta:', err);
      } finally {
        setIsCheckingBlock(false);
      }
    }
    checkBlockStatus();
  }, []);

  // 2. Şifrəni yoxla və daxil ol
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password.trim() || isLoading || isBlocked) return;

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_password', password: password.trim() }),
      });
      const data = await res.json();

      if (data && data.success) {
        if (rememberMe) {
          localStorage.setItem('dunyam_auth', 'true');
        }
        // Analitikanı işə sal (Sayta giriş bildirişi NOTIF_BOT_TOKEN-ə gedir)
        initVisitorAnalytics();
        trackUserAction('Sistemə Giriş', 'Uğurlu autentifikasiya');
        onLoginSuccess();
      } else {
        setIsShake(true);
        setErrorMsg('Şifrə yanlışdır! Yenidən cəhd edin.');
        setTimeout(() => setIsShake(false), 500);
      }
    } catch (err) {
      console.error('Login xətası:', err);
      setErrorMsg('Bağlantı xətası baş verdi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingBlock) {
    return (
      <div className="login-screen-overlay">
        <div className="login-loader-spinner">
          <Heart size={36} className="login-pulsing-heart" />
        </div>
      </div>
    );
  }

  // Əgər IP bloklanıbsa
  if (isBlocked) {
    return (
      <div className="login-screen-overlay">
        <div className="login-glass-card blocked-card">
          <div className="blocked-icon-wrapper">
            <ShieldAlert size={48} className="blocked-icon" />
          </div>
          <h2 className="blocked-title">Giriş Qadağandır</h2>
          <p className="blocked-desc">
            Sizin IP adresiniz administrator tərəfindən bloklanıb. Bu səhifəyə girişiniz məhdudlaşdırılıb.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen-overlay">
      <div className={`login-glass-card ${isShake ? 'shake-anim' : ''}`}>
        {/* Başlıq və Ürək */}
        <div className="login-header-group">
          <div className="login-heart-glow">
            <Heart size={38} className="login-main-heart" fill="currentColor" />
          </div>
          <h1 className="login-brand-title">Bizim Dünyamız</h1>
          <p className="login-couple-names">Fidan & Təhmaz</p>
        </div>

        <p className="login-prompt-text">
          Xüsusi günümüzün şifrəsini daxil edin 💕
        </p>

        {/* Giriş Forması */}
        <form onSubmit={handleLogin} className="login-form">
          <div className="login-input-wrapper">
            <KeyRound size={19} className="login-input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifrə...."
              className="login-password-input"
              autoFocus
              maxLength={20}
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {errorMsg && <p className="login-error-text">{errorMsg}</p>}

          {/* Məni Xatırla Seçimi */}
          <div
            className="remember-me-row"
            onClick={() => setRememberMe((prev) => !prev)}
          >
            <div className={`custom-checkbox ${rememberMe ? 'checked' : ''}`}>
              {rememberMe && <Check size={13} strokeWidth={3} />}
            </div>
            <span className="remember-me-label">Məni xatırla (Təkrar soruşma)</span>
          </div>

          {/* Təsdiq Düyməsi */}
          <button
            type="submit"
            className="login-submit-btn"
            disabled={!password.trim() || isLoading}
          >
            {isLoading ? (
              <span className="login-loading-state">
                <span className="mini-spin-circle" /> Yoxlanılır...
              </span>
            ) : (
              <span>Daxil ol</span>
            )}
          </button>
        </form>

        <div className="login-footer-quote">
          <span>« Sən mənim dünyamdakı ən gözəl möcüzəsən »</span>
        </div>
      </div>
    </div>
  );
}

