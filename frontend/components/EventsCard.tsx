"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Button, Typography, IconButton } from "@mui/material";
import ClearIcon from '@mui/icons-material/Clear';
import { getEvents, createEvent, editEvent, deleteEvent } from "../api/api";
import { styled } from "@mui/material/styles";
import dayjs from "dayjs";
import AddEventDialog, { NewEvent } from "./AddEvent";

// --- TYPES ---
// This aligns with what your MySQL database schema might look like
type ScheduledEvent = {
  event_id: string;
  title: string;
  start_time: string;
  end_time: string;
  weight: number;
  cycle: string;
  span: string;
};

const AddButton = styled(Button)(({ theme }) => ({
  ...theme.typography.button,
  backgroundColor: "#82181a",
  color: "#FFFFFF",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  backgroundImage: "linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)",
  borderRadius: "6px",
  padding: "10px 24px",
  letterSpacing: "0.5px",
  
  "&:hover": {
    backgroundColor: "#9e1d20",
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
}));

export default function EventsCard({ selectedDate, schedule }: { selectedDate: Date, schedule: string }) {
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [open, setOpen] = useState(false);
  const [update, setUpdate] = useState(0);
  const [editingEvent, setEditingEvent] = useState<ScheduledEvent | null>(null);

  const handleDelete = async (event_id: string) => {
    try {
      await deleteEvent(event_id);
      setUpdate((prevUpdate) => prevUpdate + 1);
    }
    catch (err) {
      console.error("Delete Failed:", err);
    }
  }

  const formatTime = (utcString: string) => {
    return new Date(utcString).toLocaleTimeString("en-CA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleAddEvent = async function (event: NewEvent) {
    await createEvent(schedule, event);
    setUpdate((prevUpdate) => prevUpdate + 1);
  };

  const handleEditEvent = async (event: NewEvent) => {
    console.log("EDITING!");
    try {
      await editEvent(schedule, editingEvent!.event_id, event);
      setEditingEvent(null);
      setUpdate((prevUpdate) => prevUpdate + 1);
    }
    catch (err) {
      console.error("Edit Failed:", err);
    }
  };

  useEffect(() => {
    if (!selectedDate) return;

    const loadEvents = async () => {
      setIsLoading(true);
      try {
        console.log("LOADING!");
        const data = await getEvents(schedule, dayjs(selectedDate), currentPage, 5);
        setEvents(data.events);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error("Failed to fetch events", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [selectedDate, currentPage, update]);

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
          {/* Add Event Dialog */}
          <AddEventDialog
            open={open && !editingEvent}
            onClose={() => setOpen(false)}
            onSubmit={handleAddEvent}
            selectedDate={selectedDate}
          />

          {/* Edit Event Dialog */}
          <AddEventDialog
            open={!!editingEvent}
            onClose={() => setEditingEvent(null)}
            onSubmit={handleEditEvent}
            selectedDate={selectedDate}
            existingEvent={editingEvent ?? undefined}
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
                onClick={() => setEditingEvent(event)}
                className="group flex flex-col p-4 border border-zinc-100 rounded-lg hover:border-red-900 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-zinc-800">
                    {event.title}
                  </span>
                 <IconButton 
                  size="small" 
                  onClick={(e) => { e.stopPropagation(); handleDelete(event.event_id); }}
                  sx={{ 
                    borderRadius: '0px',
                    border: '2px solid transparent',
                    color: '#6b7280', 
                    '&:hover': { color: '#fff', backgroundColor: '#dc2626', borderColor: '#dc2626' } 
                  }}> <ClearIcon/> </IconButton>
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