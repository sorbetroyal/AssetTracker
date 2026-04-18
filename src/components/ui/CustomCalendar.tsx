'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CustomCalendarProps {
  selectedDate: string;
  onSelect: (date: string) => void;
  onClose: () => void;
}

export function CustomCalendar({ selectedDate, onSelect, onClose }: CustomCalendarProps) {
  const current = new Date(selectedDate);
  const [viewDate, setViewDate] = useState(new Date(current.getFullYear(), current.getMonth(), 1));

  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  // Adjust for Monday start (Turkish standard)
  const emptyDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const handleDateClick = (day: number) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    // Locale correct ISO string (avoiding UTC shift)
    const offset = selected.getTimezoneOffset();
    const localDate = new Date(selected.getTime() - (offset * 60 * 1000));
    onSelect(localDate.toISOString().split('T')[0]);
    onClose();
  };

  const isSelected = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    return d.toISOString().split('T')[0] === selectedDate;
  };

  const isToday = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute top-full left-0 mt-2 z-[60] bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl w-[280px] backdrop-blur-xl"
    >
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={prevMonth} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400">
          <ChevronLeft size={16} />
        </button>
        <span className="text-[11px] font-black text-white uppercase tracking-widest italic">
          {months[viewDate.getMonth()]} {viewDate.getFullYear()}
        </span>
        <button type="button" onClick={nextMonth} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Pt', 'Sa', 'Çr', 'Pr', 'Cu', 'Ct', 'Pz'].map(d => (
          <div key={d} className="text-[9px] font-bold text-zinc-600 text-center uppercase py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: emptyDays }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const selected = isSelected(day);
          const today = isToday(day);

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDateClick(day)}
              className={`
                aspect-square flex items-center justify-center rounded-lg text-[10px] font-bold transition-all
                ${selected ? 'bg-white text-black scale-110 shadow-lg' : 'hover:bg-zinc-800 text-zinc-300'}
                ${today && !selected ? 'text-emerald-500 border border-emerald-500/30' : ''}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-center">
        <button 
          type="button"
          onClick={() => {
            const today = new Date();
            const offset = today.getTimezoneOffset();
            const localDate = new Date(today.getTime() - (offset * 60 * 1000));
            onSelect(localDate.toISOString().split('T')[0]);
            onClose();
          }}
          className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:text-white transition-colors"
        >
          BUGÜN'E GİT
        </button>
      </div>
    </motion.div>
  );
}
