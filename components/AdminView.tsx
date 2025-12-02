import React, { useMemo } from 'react';
import { DayEntry, DayStatus } from '../types';
import { StatsChart } from './StatsChart';
import { Trophy, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface AdminViewProps {
  days: DayEntry[];
  balance: number;
  streak: number;
}

export const AdminView: React.FC<AdminViewProps> = ({ days, balance, streak }) => {
  const stats = useMemo(() => {
    let runningBalance = 0;
    const history = days
      .filter(d => d.status === DayStatus.TAKEN || d.status === DayStatus.MISSED)
      .map(d => {
        if (d.status === DayStatus.TAKEN) runningBalance += 500;
        if (d.status === DayStatus.MISSED) runningBalance -= 1000;
        const dateObj = new Date(d.date);
        return {
          date: dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
          balance: runningBalance
        };
      });

    const totalTaken = days.filter(d => d.status === DayStatus.TAKEN).length;
    const totalMissed = days.filter(d => d.status === DayStatus.MISSED).length;

    return { history, totalTaken, totalMissed };
  }, [days]);

  return (
    <div className="animate-fade-in space-y-6 pb-20">
      {/* Header Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Баланс</span>
          <div className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
            {balance > 0 ? '+' : ''}{balance} ₽
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Стрик</span>
          <div className="text-2xl font-bold text-orange-500 flex items-center gap-1">
            <Trophy className="w-5 h-5" />
            {streak}
          </div>
        </div>
      </div>

      {/* Detailed Counts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 p-3 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <TrendingUp size={16} />
            </div>
            <div>
                <p className="text-xs text-emerald-700">Выпито</p>
                <p className="font-bold text-emerald-900">{stats.totalTaken} раз</p>
            </div>
        </div>
        <div className="bg-rose-50 p-3 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                <TrendingDown size={16} />
            </div>
            <div>
                <p className="text-xs text-rose-700">Пропущено</p>
                <p className="font-bold text-rose-900">{stats.totalMissed} раз</p>
            </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-slate-700 font-semibold text-sm flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            Динамика накоплений
        </h3>
        <StatsChart data={stats.history} />
      </div>

      {/* Recent Activity Log */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100">
            <h3 className="text-slate-700 font-semibold text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                История по дням
            </h3>
        </div>
        <div className="divide-y divide-slate-100">
            {days.filter(d => d.status !== DayStatus.LOCKED && d.status !== DayStatus.PENDING).reverse().map(day => {
                const dateObj = new Date(day.date);
                const dateStr = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
                return (
                    <div key={day.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${day.status === DayStatus.TAKEN ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className="text-sm font-medium text-slate-700">{dateStr}</span>
                        </div>
                        <span className={`text-sm font-bold ${day.status === DayStatus.TAKEN ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {day.status === DayStatus.TAKEN ? '+500 ₽' : '-1000 ₽'}
                        </span>
                    </div>
                );
            })}
            {days.filter(d => d.status !== DayStatus.LOCKED && d.status !== DayStatus.PENDING).length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm">
                    Пока нет активности
                </div>
            )}
        </div>
      </div>
    </div>
  );
};