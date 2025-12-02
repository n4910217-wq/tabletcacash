import React, { useMemo } from 'react';
import { DayEntry, DayStatus } from '../types';
import { Check, X, Lock, Gift, Calendar, Sparkles } from 'lucide-react';

interface SvetaViewProps {
  days: DayEntry[];
  streak: number;
  balance: number;
  onDayClick: (day: DayEntry) => void;
}

export const SvetaView: React.FC<SvetaViewProps> = ({ days, streak, balance, onDayClick }) => {
  
  // Weekly bonus progress
  const weeklyProgress = streak % 7;

  // Group days by month
  const groupedDays = useMemo(() => {
    const groups: Record<string, DayEntry[]> = {};
    
    days.forEach(day => {
      const date = new Date(day.date);
      // Key format: "YYYY-MM" to sort correctly
      const key = `${date.getFullYear()}-${date.getMonth()}`; 
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(day);
    });

    return groups;
  }, [days]);

  // Helper to get month name from key
  const getMonthName = (key: string) => {
    const [year, month] = key.split('-');
    const date = new Date(parseInt(year), parseInt(month), 1);
    const monthName = date.toLocaleString('ru-RU', { month: 'long' });
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  };

  // Get formatted today's date
  const todayLabel = useMemo(() => {
    const d = new Date();
    const str = d.toLocaleDateString('ru-RU', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
    });
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, []);
  
  return (
    <div className="pb-24">
      {/* Today Date Banner */}
      <div className="bg-white rounded-2xl p-3 mb-6 shadow-sm border border-slate-100 flex items-center justify-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-500" />
          <span className="text-slate-600 font-medium text-sm">{todayLabel}</span>
      </div>

      {/* Header Info */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
           <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Копилка</p>
           <h2 className={`text-3xl font-bold ${balance >= 0 ? 'text-slate-800' : 'text-rose-500'}`}>
             {balance.toLocaleString('ru-RU')} ₽
           </h2>
        </div>
        <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                <span className="text-orange-600 font-bold text-sm">{streak} дней</span>
                <span className="text-lg">🔥</span>
            </div>
            <div className="mt-1 flex gap-0.5">
                {[...Array(7)].map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${i < weeklyProgress ? 'bg-orange-400' : 'bg-slate-200'}`}
                    />
                ))}
            </div>
        </div>
      </div>

      {streak > 0 && streak % 7 === 0 && (
          <div className="mb-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-xl shadow-lg transform animate-pulse flex items-center justify-between">
            <div>
                <p className="font-bold">Бонус недели доступен!</p>
                <p className="text-xs opacity-90">Ты супер-молодец!</p>
            </div>
            <Gift className="w-6 h-6" />
          </div>
      )}

      {/* Calendar Groups */}
      <div className="space-y-8">
        {Object.keys(groupedDays).map((monthKey) => (
          <div key={monthKey} className="animate-fade-in">
            <h3 className="text-slate-800 font-bold text-lg mb-4 sticky top-[72px] bg-slate-50/90 backdrop-blur-sm py-2 z-10 px-1 capitalize">
              {getMonthName(monthKey)}
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {groupedDays[monthKey].map((day) => {
                const isLocked = day.status === DayStatus.LOCKED;
                const isTaken = day.status === DayStatus.TAKEN;
                const isMissed = day.status === DayStatus.MISSED;
                const isPending = day.status === DayStatus.PENDING;
                
                const dateObj = new Date(day.date);
                const weekday = dateObj.toLocaleString('ru-RU', { weekday: 'short' });
                
                // Super Prize Day Check for 2025
                const isSuperPrizeDay = dateObj.getDate() === 5 && dateObj.getMonth() === 11 && dateObj.getFullYear() === 2025;

                return (
                  <button
                    key={day.id}
                    onClick={() => onDayClick(day)}
                    disabled={isLocked || isTaken || isMissed}
                    className={`
                      relative aspect-square rounded-2xl flex flex-col items-center justify-center border-2 transition-all duration-300 transform
                      ${isSuperPrizeDay && !isTaken && !isMissed ? 'ring-2 ring-yellow-300 ring-offset-1 border-yellow-400 bg-yellow-50' : ''}
                      ${isLocked 
                        ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed' 
                        : isPending
                          ? `bg-white ${isSuperPrizeDay ? 'border-yellow-400' : 'border-indigo-100'} text-indigo-900 shadow-sm hover:-translate-y-1 hover:shadow-md active:scale-95 cursor-pointer`
                          : ''
                      }
                      ${isTaken ? 'bg-emerald-50 border-emerald-200' : ''}
                      ${isMissed ? 'bg-rose-50 border-rose-200' : ''}
                    `}
                  >
                    {!isLocked && (isTaken || isMissed) && (
                       <div className={`absolute inset-0 flex items-center justify-center rounded-2xl opacity-0 animate-[scaleIn_0.3s_ease-out_forwards] ${isTaken ? 'bg-emerald-100/50' : 'bg-rose-100/50'}`}>
                          {isTaken ? <Check className="text-emerald-600 w-8 h-8" /> : <X className="text-rose-500 w-8 h-8" />}
                       </div>
                    )}

                    {isLocked ? (
                        <>
                            <span className="text-[10px] font-medium uppercase mb-0.5 text-slate-300">{weekday}</span>
                            <div className="flex items-center gap-1">
                                <Lock size={12} className="text-slate-300" />
                                <span className="text-lg font-bold text-slate-300">{day.dayOfMonth}</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <span className={`text-[10px] font-medium uppercase mb-0.5 ${isTaken ? 'text-emerald-600/70' : isMissed ? 'text-rose-600/70' : (isSuperPrizeDay ? 'text-yellow-600' : 'text-slate-400')}`}>
                                {weekday}
                            </span>
                            <span className={`text-xl font-bold z-10 leading-none ${isTaken ? 'text-emerald-700' : isMissed ? 'text-rose-700' : 'text-slate-700'}`}>
                                {day.dayOfMonth}
                            </span>
                            {isSuperPrizeDay && !isTaken && !isMissed && (
                                <span className="absolute bottom-1 text-[8px] font-bold text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                    <Sparkles size={8} /> Приз
                                </span>
                            )}
                        </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};