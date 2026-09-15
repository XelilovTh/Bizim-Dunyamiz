import React, { useState, useEffect } from 'react';
import './CounterCard.css';

const START_DATE = new Date('2023-02-01T00:00:00');

export default function CounterCard() {
  const [timeData, setTimeData] = useState({
    days: '0000',
    hours: '00',
    minutes: '00',
    seconds: '00',
  });

  useEffect(() => {
    function calculateTime() {
      const now = new Date();
      const diffMs = Math.max(0, now.getTime() - START_DATE.getTime());

      const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeData({
        days: String(totalDays),
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0'),
      });
    }

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="counter-card-glass">
      {/* Başlıq: Gradient rəng ilə */}
      <div className="counter-header-center">
        <h3 className="counter-title-script counter-title-gradient">
          Birlikdə keçən zaman
        </h3>
        <p className="counter-date-sub">2023.02.01</p>
      </div>

      {/* 4 dəyər: saat və dəqiqə gün və saniyədən nisbətən aşağıda */}
      <div className="counter-grid-wave">
        {/* Gün - Yuxarıda */}
        <div className="counter-col col-high">
          <span className="counter-num">{timeData.days}</span>
          <span className="counter-unit">gün</span>
        </div>

        {/* Saat - Aşağıda */}
        <div className="counter-col col-low">
          <span className="counter-num">{timeData.hours}</span>
          <span className="counter-unit">saat</span>
        </div>

        {/* Dəqiqə - Aşağıda */}
        <div className="counter-col col-low">
          <span className="counter-num">{timeData.minutes}</span>
          <span className="counter-unit">dəqiqə</span>
        </div>

        {/* Saniyə - Yuxarıda */}
        <div className="counter-col col-high">
          <span className="counter-num">{timeData.seconds}</span>
          <span className="counter-unit">saniyə</span>
        </div>
      </div>
    </div>
  );
}
