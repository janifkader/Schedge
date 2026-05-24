"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Button, Typography } from "@mui/material";
import { getEvents, createEvent } from "../api/api";
import { styled } from "@mui/material/styles";
import AddEventDialog, { NewEvent } from "./AddEvent";

// --- TYPES ---
// This aligns with what your MySQL database schema might look like
type ScheduledEvent = {
  title: string;
  start_time: string;
  end_time: string;
  weight: string;
  cycle: string;
  span: string;
};

const AddButton = styled(Button)(({ theme }) => ({
  ...theme.typography.h8,
  backgroundColor: "#82181a",
  color: "#FFFFFF",
  "&:hover": {
    backgroundColor: "#631214",
  },
}));

const fetchEvents = async (date: Date, currentPage: number, schedule: number): Promise<ScheduledEvent[]> => {
  const events = await getEvents(schedule, date, currentPage, 5);
  return events;
};

export default function EventsCard({ selectedDate, schedule }: { selectedDate: Date | null, schedule: number }) {
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [open, setOpen] = useState(false);

  const formatTime = (utcString: string) => {
    return new Date(utcString).toLocaleTimeString("en-CA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleAddEvent = async function (event: NewEvent) {
    await createEvent(schedule, event);
    const data = await fetchEvents(selectedDate, currentPage, schedule);
    setEvents(data.events);
    setTotalPages(data.totalPages);
  };

  useEffect(() => {
    if (!selectedDate) return;

    const loadEvents = async () => {
      setIsLoading(true);
      try {
        const data = await fetchEvents(selectedDate, currentPage, schedule);
        setEvents(data.events);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error("Failed to fetch events", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [selectedDate, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate]);

  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  // UI STATE 1: No date selected yet
  if (!selectedDate) {
    return (
      <div className="w-full max-w-md h-64 mx-auto bg-zinc-50 border border-dashed border-zinc-300 rounded-xl flex items-center justify-center text-zinc-400 font-medium">
        Select a date to view schedule
      </div>
    );
  }

  // UI STATE 2: Loading data
  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto bg-white border border-zinc-200 rounded-xl p-6 shadow-sm animate-pulse">
        <div className="h-6 bg-zinc-200 rounded w-1/2 mb-6"></div>
        <div className="space-y-4">
          <div className="h-16 bg-zinc-100 rounded-lg w-full"></div>
          <div className="h-16 bg-zinc-100 rounded-lg w-full"></div>
        </div>
      </div>
    );
  }

  // UI STATE 3: The Event List
  return (
    <div className="w-full max-w-md mx-auto bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden font-sans">
      
      {/* Header */}
      <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-zinc-800">
            {format(selectedDate, "EEEE")}
          </h3>
          <p className="text-sm text-zinc-500">
            {format(selectedDate, "MMMM d, yyyy")}
          </p>
        </div>
        <div>
          <AddButton onClick={() => setOpen(true)}>+ Add Event</AddButton>
          <AddEventDialog
            open={open}
            onClose={() => setOpen(false)}
            onSubmit={handleAddEvent}
            selectedDate={selectedDate}
          />
        </div>
        <div className="text-xs font-semibold px-2 py-1 bg-zinc-200 text-zinc-700 rounded-md">
          {events.length} {events.length === 1 ? "Event" : "Events"}
        </div>
      </div>

      {/* List Area */}
      <div className="p-4">
        {events.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            No events scheduled for this day.
          </div>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li
                key={event.event_id}
                className="group flex flex-col p-4 border border-zinc-100 rounded-lg hover:border-red-900 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-zinc-800">
                    {event.title}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-600 font-medium">
                    {new Date(event.start_time).toLocaleDateString()}, {formatTime(event.start_time)} to {new Date(event.end_time).toLocaleDateString()}, {formatTime(event.end_time)} 
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {events.length > 0 && (
        <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-200 flex justify-between items-center shrink-0">
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            className="text-sm font-medium px-3 py-1.5 rounded-md text-zinc-600 hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            Previous
          </button>
          <span className="text-xs font-semibold text-zinc-500 tracking-wider">
            PAGE {currentPage} OF {totalPages}
          </span>
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="text-sm font-medium px-3 py-1.5 rounded-md text-zinc-600 hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}