"use client";

import { useState } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";

export default function Calendar({ 
  selectedDate, 
  setSelectedDate 
}: { 
  selectedDate: Date | null;
  setSelectedDate: (date: Date) => void; 
}){
  // --- STATE ---
  // Controls which month we are currently looking at
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- LOGIC ---
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Calculate the grid of days
  // 1. Find the first and last day of the current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // 2. Find the start of the week for the first day, and end of the week for the last
  // This gives us our "overflow" days from the previous/next months
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  // 3. Generate an array of every single day in that interval (always exactly 35 or 42 days)
  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  // Days of the week header (S, M, T, W, T, F, S)
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden border border-zinc-200 font-sans">
      
      {/* 1. THE HEADER */}
      <div className="flex items-center justify-between px-6 py-4 bg-zinc-50 border-b border-zinc-200">
        <h2 className="text-lg font-bold text-zinc-800">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={goToToday}
            className="px-3 py-1 text-sm cursor-pointer font-medium text-zinc-600 hover:bg-zinc-200 rounded-md transition-colors"
          >
            Today
          </button>
          <button 
            onClick={prevMonth}
            className="p-1 hover:bg-zinc-200 cursor-pointer rounded-md transition-colors"
          >
            &lt;
          </button>
          <button 
            onClick={nextMonth}
            className="p-1 hover:bg-zinc-200 cursor-pointer rounded-md transition-colors"
          >
            &gt;
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* 2. THE DAYS OF THE WEEK */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* 3. THE MAIN GRID */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            // Determine the state of each cell
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentToday = isToday(day);

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={`
                  h-10 w-full rounded-full flex items-center justify-center cursor-pointer text-sm transition-all duration-200
                  ${!isCurrentMonth ? "text-zinc-500 hover:text-zinc-500" : "text-zinc-900"}
                  ${isCurrentMonth && !isSelected && !isCurrentToday ? "hover:bg-zinc-100" : ""}
                  ${isCurrentToday && !isSelected ? "bg-red-50 text-red-700 font-bold" : ""}
                  ${isSelected ? "bg-red-900 text-white font-bold shadow-md transform scale-105" : ""}
                `}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}