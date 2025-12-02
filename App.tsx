import React, { useState, useEffect, useCallback } from 'react';
import { DayEntry, DayStatus } from './types';
import { SvetaView } from './components/SvetaView';
import { AdminView } from './components/AdminView';
import { Pill, ShieldCheck, X, BarChart3, CalendarDays, TriangleAlert } from 'lucide-react';

// PRODUCTION MODE: Dec 2025 - March 2026
const START_DATE = new Date(2025, 11, 2); // Dec 2, 2025
const END_DATE = new Date(2026, 2, 31);   // March 31, 2026

const STORAGE_KEYS = {
  DAYS: 'sveta_days_v9', // Bumped to v9 to clear old Dec 1 data
  BALANCE: 'sveta_balance_v9',
  STREAK: 'sveta_streak_v9'
};

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [days, setDays] = useState<DayEntry[]>([]);
  const [balance, setBalance] = useState(0);
  const [streak, setStreak] = useState(0);
  
  // Modal States
  const [selectedDay, setSelectedDay] = useState<DayEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Missed Days Alert State
  const [missedAlert, setMissedAlert] = useState<{ count: number; penalty: number } | null>(null);

  // Generate the full list of days based on configuration
  const generateAllDays = useCallback(() => {
    const generatedDays: DayEntry[] = [];
    
    let current = new Date(START_DATE);
    let index = 0;
    
    while (current <= END_DATE) {
        generatedDays.push({
          id: `day-${index}`,
          date: current.toISOString(),
          dayOfMonth: current.getDate(),
          status: DayStatus.LOCKED 
        });
        
        current.setDate(current.getDate() + 1);
        index++;
    }
    return generatedDays;
  }, []);

  // Initialize Data & Run Auto-Miss Logic
  useEffect(() => {
    const storedDaysStr = localStorage.getItem(STORAGE_KEYS.DAYS);
    const storedBalance = localStorage.getItem(STORAGE_KEYS.BALANCE);
    const storedStreak = localStorage.getItem(STORAGE_KEYS.STREAK);

    const fullList = generateAllDays();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentBalance = Number(storedBalance) || 0;
    let currentStreak = Number(storedStreak) || 0;
    let autoMissedCount = 0;
    let autoPenalty = 0;

    let parsedStoredDays: DayEntry[] = [];
    if (storedDaysStr) {
        parsedStoredDays = JSON.parse(storedDaysStr);
    }
    const storedMap = new Map(parsedStoredDays.map(d => [d.id, d]));

    const updatedDays = fullList.map(day => {
        const dayDate = new Date(day.date);
        dayDate.setHours(0, 0, 0, 0);
        
        // Retrieve stored state or default to LOCKED
        const stored = storedMap.get(day.id);
        let status = stored ? stored.status : DayStatus.LOCKED;
        let note = stored ? stored.note : undefined;

        // LOGIC 1: Unlock Today
        // Check if day is today
        if (dayDate.getTime() === today.getTime()) {
            // Only unlock if it was previously locked
            if (status === DayStatus.LOCKED) {
                status = DayStatus.PENDING;
            }
        }
        
        // LOGIC 2: Strict Auto-Miss for Past Days
        // Only affects days between START_DATE and Yesterday
        if (dayDate < today && dayDate >= new Date(START_DATE)) {
            if (status !== DayStatus.TAKEN && status !== DayStatus.MISSED) {
                status = DayStatus.MISSED;
                note = "Автоматический штраф за пропуск";
                autoMissedCount++;
            }
        }

        return { ...day, status, note };
    });

    if (autoMissedCount > 0) {
        const penalty = autoMissedCount * 1000;
        currentBalance -= penalty;
        currentStreak = 0;
        autoPenalty = penalty;
        setMissedAlert({ count: autoMissedCount, penalty });
    }

    setDays(updatedDays);
    setBalance(currentBalance);
    setStreak(currentStreak);
    
    // Initial Save if we modified data (auto-miss)
    if (autoMissedCount > 0) {
        localStorage.setItem(STORAGE_KEYS.DAYS, JSON.stringify(updatedDays));
        localStorage.setItem(STORAGE_KEYS.BALANCE, currentBalance.toString());
        localStorage.setItem(STORAGE_KEYS.STREAK, currentStreak.toString());
    }

  }, [generateAllDays]);

  // Regular save effect for extra safety
  useEffect(() => {
    if (days.length > 0) {
      localStorage.setItem(STORAGE_KEYS.DAYS, JSON.stringify(days));
      localStorage.setItem(STORAGE_KEYS.BALANCE, balance.toString());
      localStorage.setItem(STORAGE_KEYS.STREAK, streak.toString());
    }
  }, [days, balance, streak]);

  const handleDayClick = (day: DayEntry) => {
    // Only allow clicking PENDING days (Today)
    if (day.status === DayStatus.PENDING) {
      setSelectedDay(day);
      setIsModalOpen(true);
      setAiMessage(null);
    }
  };

  const handleAction = async (action: 'TAKEN' | 'MISSED') => {
    if (!selectedDay) return;

    const dayDate = new Date(selectedDay.date);
    // Super Prize logic for Dec 5, 2025
    const isSuperPrizeDay = dayDate.getDate() === 5 && dayDate.getMonth() === 11 && dayDate.getFullYear() === 2025;

    let changeAmount = 0;
    
    // 50 Phrases for "Taken"
    const takenPhrases = [
        "Молодец огурчик 🥒",
        "Боберчик ураа 🦫",
        "Скоро восстановишь либидо 😏🔥",
        "Еее роккк 🤘",
        "Слей, квин! 💅",
        "Машина! 🚜",
        "Просто пушка 🔫",
        "Чисто на опыте 😎",
        "Легенда 🏆",
        "Сияешь ярче солнца ☀️",
        "Умничка! 💖",
        "Горжусь тобой! 🥹",
        "Света - это свет! 💡",
        "Дисциплина - твое второе имя 🧘‍♀️",
        "Копилка говорит спасибо 💰",
        "Здоровье +100 XP 🆙",
        "Умничка-разумничка 🧠",
        "Так держать! ✊",
        "Богиня продуктивности 🗽",
        "Красотка! 💃",
        "Гордость распирает! 🦚",
        "Лучшая инвестиция в себя 📈",
        "Ты делаешь это для себя ❤️",
        "Восхитительно! ✨",
        "Гений чистой красоты 🦢",
        "Победа над ленью! ⚔️",
        "Шаг за шагом к цели 🐾",
        "Ты можешь всё! 💪",
        "Пример для подражания 🌟",
        "Блестящая работа 💎",
        "Супер-женщина 🦸‍♀️",
        "Это было легко, правда? 😉",
        "Твое здоровье скажет спасибо 🍏",
        "Маленькая победа 🏆",
        "Вперед к мечте! 🌈",
        "Ты справляешься! 🙌",
        "Просто космос! 🚀",
        "Краш этого дня 😍",
        "На стиле, на спорте (почти) 🕶️",
        "Королева режима 👑",
        "Системность - признак мастерства 📐",
        "Ты сегодня просто огонь 🔥",
        "Лень? Не слышали 🙉",
        "Еще один шаг к богатству 🤑",
        "Самосовершенствование level up 🆙",
        "Уважение + respect 🫡",
        "Ты - лучшая версия себя ✨",
        "Так победим! 🚩",
        "Идеально! 👌",
        "Мое восхищение не знает границ 🤩"
    ];

    // 50 Phrases for "Missed"
    const missedPhrases = [
        "Лошара 👎",
        "Погибаешь 💀",
        "Ну и живи свою нелучшую жизнь 🥀",
        "Предала Америку 🇺🇸💔",
        "Сайлент Хилл 🌫️",
        "Ну чё, опять ты не пила? 🗿",
        "Здоровье покинуло чат 👋",
        "F в чат 🫡",
        "Кринж дня 😬",
        "Опять на те же грабли 🧹",
        "Денег нет, но вы держитесь 📉",
        "Ну ты даешь... 🤦‍♀️",
        "Эх, Света, Света... 😔",
        "Копилка плачет 😿",
        "Соберись, тряпка! 🧣",
        "Не расстраивай меня 🥺",
        "Минус мораль, минус деньги 💸",
        "Завтра будет лучше? 🤔",
        "Это фиаско, братан 📉",
        "Лень победила... пока что 😈",
        "Ну как так-то? 🤷‍♀️",
        "Дисциплина вышла из чата 🚪",
        "Не забывай про цель! 🎯",
        "А могла бы быть богаче... 📉",
        "Штрафной удар! ⚽",
        "Серьезно? Опять? 🤨",
        "Я слежу за тобой 👀",
        "Не халтурь! 🚫",
        "Здоровье не купишь (а штраф заплатишь) 💊",
        "Грустно, вкусно (нет) 🍟",
        "Стыдно, товарищ! 🙈",
        "Собери волю в кулак ✊",
        "Хватит лениться! 🛑",
        "Потеря потерь 🥀",
        "Это не путь самурая ⚔️",
        "Остановись и подумай 🛑",
        "Не предавай себя 💔",
        "Деньги на ветер 🌬️",
        "Кто-то сегодня без вкусняшки 🍩",
        "Провал операции 📉",
        "Хьюстон, у нас проблемы 🛰️",
        "Не надо так 🙅‍♀️",
        "Разочарование года 😫",
        "Ай-яй-яй! ☝️",
        "Соберись уже! 🧩",
        "Не путь джедая 🌑",
        "В следующий раз повезет? 🎲",
        "Грустный тромбон 🎺",
        "Это было больно (для кошелька) 🤕"
    ];

    let instantMsg = "";

    if (action === 'TAKEN') {
        changeAmount = isSuperPrizeDay ? 30000 : 500;
        setFeedbackType('success');
        
        if (isSuperPrizeDay) {
            instantMsg = "ВАУ! СУПЕРПРИЗ! +30 000 ₽! Ты невероятная! 🤑🎉";
        } else {
            instantMsg = takenPhrases[Math.floor(Math.random() * takenPhrases.length)];
        }
    } else {
        changeAmount = -1000;
        setFeedbackType('error');
        instantMsg = missedPhrases[Math.floor(Math.random() * missedPhrases.length)];
    }

    const newBalance = balance + changeAmount;
    const newStreak = action === 'TAKEN' ? streak + 1 : 0;
    const newStatus = action === 'TAKEN' ? DayStatus.TAKEN : DayStatus.MISSED;

    // Create updated days array
    const updatedDays = days.map(d => 
      d.id === selectedDay.id ? { ...d, status: newStatus, note: instantMsg } : d
    );

    // 1. Update State
    setBalance(newBalance);
    setStreak(newStreak);
    setDays(updatedDays);
    setAiMessage(instantMsg);

    // 2. IMMEDIATE PERSISTENCE (Crucial for Telegram WebApp closing)
    localStorage.setItem(STORAGE_KEYS.DAYS, JSON.stringify(updatedDays));
    localStorage.setItem(STORAGE_KEYS.BALANCE, newBalance.toString());
    localStorage.setItem(STORAGE_KEYS.STREAK, newStreak.toString());

    // Close modal
    setTimeout(() => {
      setIsModalOpen(false);
      setSelectedDay(null);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden text-slate-800">
      
      {/* Top Bar / Switcher */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-40 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                <Pill size={18} />
            </div>
            <h1 className="font-bold text-slate-800">Таблетка Светы</h1>
         </div>
         <button 
           onClick={() => setIsAdmin(!isAdmin)}
           className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-full"
         >
           {isAdmin ? (
             <>
               <CalendarDays size={14} />
               Календарь
             </>
           ) : (
             <>
               <BarChart3 size={14} />
               Статистика
             </>
           )}
         </button>
      </div>

      {/* Main Content */}
      <div className="pt-20 px-4 max-w-md mx-auto">
        {isAdmin ? (
            <AdminView days={days} balance={balance} streak={streak} />
        ) : (
            <SvetaView 
                days={days} 
                streak={streak} 
                balance={balance} 
                onDayClick={handleDayClick} 
            />
        )}
      </div>

      {/* Auto-Miss Alert Modal */}
      {missedAlert && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
             <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
                 <div className="mx-auto w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4 text-rose-500">
                     <TriangleAlert size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-800 mb-2">
                     Упс, пропущено дней: {missedAlert.count}
                 </h3>
                 <p className="text-slate-600 mb-6">
                     Пока тебя не было, система автоматически списала штраф за пропущенные дни. Дисциплина требует регулярности!
                 </p>
                 <div className="text-3xl font-bold text-rose-500 mb-6">
                     - {missedAlert.penalty} ₽
                 </div>
                 <button 
                    onClick={() => setMissedAlert(null)}
                    className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 active:scale-95 transition-all"
                 >
                     Поняла, исправлюсь 😔
                 </button>
             </div>
        </div>
      )}

      {/* Action Modal */}
      {isModalOpen && selectedDay && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => !isProcessing && aiMessage && setIsModalOpen(false)}
          />
          
          <div className="relative bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl transform transition-all animate-[slideUp_0.3s_ease-out]">
            {!aiMessage ? (
               <>
                <div className="w-16 h-1 bg-slate-200 rounded-full mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-center mb-2">
                    {/* Show correct date title for the selected day */}
                    {new Date(selectedDay.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                </h3>
                <p className="text-slate-500 text-center mb-8">Таблетка была выпита?</p>
                
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => handleAction('MISSED')}
                        disabled={isProcessing}
                        className="py-4 rounded-2xl border-2 border-rose-100 text-rose-600 font-bold hover:bg-rose-50 active:scale-95 transition-all"
                    >
                        Нет, забыла
                    </button>
                    <button 
                        onClick={() => handleAction('TAKEN')}
                        disabled={isProcessing}
                        className="py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                        Да, конечно!
                    </button>
                </div>
               </>
            ) : (
                <div className="text-center py-6 relative">
                     <button 
                        onClick={() => setIsModalOpen(false)}
                        className="absolute -top-2 -right-2 text-slate-300 hover:text-slate-500 p-2"
                     >
                        <X size={20} />
                     </button>
                    <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 animate-[bounce_0.5s_infinite] ${feedbackType === 'error' ? 'bg-rose-100 text-rose-500' : 'bg-emerald-100 text-emerald-500'}`}>
                        {feedbackType === 'error' ? <X size={40}/> : <ShieldCheck size={40}/>}
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                         {/* Dynamic Amount Display */}
                        {feedbackType === 'error' 
                            ? '-1000 ₽' 
                            : (aiMessage?.includes('30 000') ? '+30 000 ₽' : '+500 ₽')}
                    </h3>
                    <p className="text-slate-600 font-medium leading-relaxed">
                        {aiMessage}
                    </p>
                </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleIn {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}