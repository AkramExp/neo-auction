import React, { useState, useEffect } from 'react';

const Timer = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!endTime) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;
      
      return Math.max(0, Math.floor(difference / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft === 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft > 30) return 'bg-green-500';
    if (timeLeft > 10) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex flex-col items-center">
      <div className={`text-2xl font-bold ${getTimerColor()} text-white px-4 py-2 rounded-lg`}>
        {formatTime(timeLeft)}
      </div>
      <div className="text-sm text-gray-600 mt-1">Time Remaining</div>
    </div>
  );
};

export default Timer;