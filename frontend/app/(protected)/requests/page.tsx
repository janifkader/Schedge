"use client";

import React, { useState, useEffect } from "react";
import { getUsers, createRequest, getRequests, getEvents, getSchedule, patchRequest } from '@/api/api';
import { useRouter } from "next/navigation";

interface User {
  email: string;
  name: string;
}

interface Event {
  event_id: string;
  title: string;
  start_time: string;
  end_time: string;
  weight: number;
  cycle: string;
  span: string;
}

interface Request {
  request_id: string;
  sender_email: string;
  receiver_email: string;
  status: string;
  last_updated: string;
  events: Event[];
}

export default function Requests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [evs, setEvs] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [update, setUpdate] = useState(0);
  const [eventSearch, setEventSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [eventPage, setEventPage] = useState(1);
  const [totalUserPages, setTotalUserPages] = useState(1);
  const [totalEventPages, setTotalEventPages] = useState(1);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchFocusedEvent, setSearchFocusedEvent] = useState(false);
  const router = useRouter();

  const handlePatch = async (request_id: string, status: string) => {
  	try{
  		const pat = await patchRequest(request_id, status, new Date());
  		setUpdate((prevUpdate) => prevUpdate + 1);
  	}
  	catch (err: any) {
      setError(err.message || "Could not update request.");
    }
  }

  const formatTime = (utcString: string) =>
    new Date(utcString).toLocaleTimeString("en-CA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const formatDate = (utcString: string) =>
    new Date(utcString).toLocaleDateString("en-CA", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatRange = (start: string, end: string) =>
    `${formatDate(start)}, ${formatTime(start)} – ${formatTime(end)}`;

  const addEvent = (event: Event) => {
    if (events.find((e) => e.event_id === event.event_id)) return;
    setEvents((prev) => [...prev, event]);
    setEventSearch("");
    setEventPage(1);
    setEvs([]);
  };

  const removeEvent = (event_id: string) =>
    setEvents((prev) => prev.filter((e) => e.event_id !== event_id));

  const addMember = (user: User) => {
    if (members.find((m) => m.email === user.email)) return;
    setMembers((prev) => [...prev, user]);
    setUserSearch("");
    setUserPage(1);
    setUsers([]);
  };

  const removeMember = (email: string) =>
    setMembers((prev) => prev.filter((m) => m.email !== email));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (events.length === 0 || members.length === 0) {
      setError("Please select an event and a receiver.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
    	console.log(events[0].event_id);
    	console.log(members[0].email);
      const res = await createRequest(events[0].event_id, members[0].email, new Date());
      setMembers([]);
      setEvents([]);
    } catch (err: any) {
      setError(err.message || "Could not create request.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => !members.find((m) => m.email === u.email));

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await getUsers(userPage, 10, userSearch);
        if (res?.users) {
          setUsers(res.users);
          setTotalUserPages(res.totalPages || 1);
        }
      } catch (err) {
        console.error("Could not load user list", err);
      }
    }
    const delay = setTimeout(loadUsers, 300);
    return () => clearTimeout(delay);
  }, [userSearch, userPage]);

  useEffect(() => {
	  async function loadEvents() {
	    try {
	      const schedule = await getSchedule();
	      const scheduleId = schedule?.sched_id || schedule?.schedule?.sched_id;
	      if (!scheduleId) return;
	      const res = await getEvents(scheduleId, null, eventPage, 10, eventSearch);
	      if (res?.events) {
	        setEvs(res.events);
	        setTotalEventPages(res.totalPages || 1);
	      }
	    } catch (err) {
	      console.error("Could not load event list", err);
	    }
	  }
	  const delay = setTimeout(loadEvents, 300);
	  return () => clearTimeout(delay);
	}, [eventSearch, eventPage]);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const res = await getRequests();
        if (res?.requests) setRequests(res.requests);
      } catch (err: any) {
        setError(err.message || "An error occurred fetching requests.");
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, [update]);

  return (
    <div className="min-h-screen text-gray-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Left Column: Create Request Form */}
        <div className="md:col-span-1 bg-gray-300 p-6 rounded-xl border border-gray-700 h-fit">
          <h2 className="text-xl font-bold mb-4 text-black">Create a New Request</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Event Section */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">Event</label>
              {events.length > 0 && (
                <div className="flex flex-col gap-1 mb-2">
                  {events.map((e) => (
                    <div key={e.event_id} className="flex items-center justify-between bg-white border border-gray-300 rounded-lg px-3 py-2 text-black text-sm">
                      <div>
                        <span className="font-medium">{e.title}</span>
                        <span className="text-gray-400 text-xs block">{formatRange(e.start_time, e.end_time)}</span>
                      </div>
                      <button type="button" onClick={() => removeEvent(e.event_id)} className="text-gray-400 hover:text-red-700 ml-2 text-lg leading-none">×</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="relative">
              	{events.length === 0 && (
	                <input
	                  type="text"
	                  placeholder="Search by event title..."
	                  value={eventSearch}
	                  onChange={(v) => { setEventSearch(v.target.value); setEventPage(1); }}
	                  onFocus={() => setSearchFocusedEvent(true)}
	                  onBlur={() => setTimeout(() => setSearchFocusedEvent(false), 150)}
	                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-red-900 transition-colors"
	                />
              	)}
                {searchFocusedEvent && evs.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-lg overflow-hidden">
                    {evs.map((event) => (
                      <button key={event.event_id} type="button" onMouseDown={() => addEvent(event)} className="w-full text-left px-3 py-2 text-sm text-black hover:bg-red-50 hover:text-red-900 transition-colors">
                        <span className="font-medium">{event.title}</span>
                        <span className="text-gray-400 text-xs ml-2">{formatRange(event.start_time, event.end_time)}</span>
                      </button>
                    ))}
                    {totalEventPages > 1 && (
                      <div className="flex items-center justify-between border-t border-gray-200 px-3 py-1.5 bg-gray-50">
                        <button type="button" onClick={() => setEventPage((p) => Math.max(p - 1, 1))} disabled={eventPage === 1} className="text-xs text-gray-600 disabled:opacity-30">Previous</button>
                        <span className="text-xs text-gray-500">{eventPage} / {totalEventPages}</span>
                        <button type="button" onClick={() => setEventPage((p) => Math.min(p + 1, totalEventPages))} disabled={eventPage === totalEventPages} className="text-xs text-gray-600 disabled:opacity-30">Next</button>
                      </div>
                    )}
                  </div>
                )}
                {searchFocusedEvent && eventSearch && evs.length === 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-lg px-3 py-2 text-sm text-gray-400">No events found.</div>
                )}
              </div>
            </div>

            {/* Receiver Section */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">Receiver</label>
              {members.length > 0 && (
                <div className="flex flex-col gap-1 mb-2">
                  {members.map((m) => (
                    <div key={m.email} className="flex items-center justify-between bg-white border border-gray-300 rounded-lg px-3 py-2 text-black text-sm">
                      <span className="font-medium">{m.name}</span>
                      <button type="button" onClick={() => removeMember(m.email)} className="text-gray-400 hover:text-red-700 ml-2 text-lg leading-none">×</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="relative">
              	{members.length === 0 && (
	                <input
	                  type="text"
	                  placeholder="Search by name..."
	                  value={userSearch}
	                  onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
	                  onFocus={() => setSearchFocused(true)}
	                  onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
	                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-red-900 transition-colors"
	                />
	               )}
                {searchFocused && filteredUsers.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-lg overflow-hidden">
                    {filteredUsers.map((user) => (
                      <button key={user.email} type="button" onMouseDown={() => addMember(user)} className="w-full text-left px-3 py-2 text-sm text-black hover:bg-red-50 hover:text-red-900 transition-colors">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-gray-400 text-xs ml-2">{user.email}</span>
                      </button>
                    ))}
                    {totalUserPages > 1 && (
                      <div className="flex items-center justify-between border-t border-gray-200 px-3 py-1.5 bg-gray-50">
                        <button type="button" onClick={() => setUserPage((p) => Math.max(p - 1, 1))} disabled={userPage === 1} className="text-xs text-gray-600 disabled:opacity-30">Previous</button>
                        <span className="text-xs text-gray-500">{userPage} / {totalUserPages}</span>
                        <button type="button" onClick={() => setUserPage((p) => Math.min(p + 1, totalUserPages))} disabled={userPage === totalUserPages} className="text-xs text-gray-600 disabled:opacity-30">Next</button>
                      </div>
                    )}
                  </div>
                )}
                {searchFocused && userSearch && filteredUsers.length === 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-lg px-3 py-2 text-sm text-gray-400">No users found.</div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting || events.length === 0 || members.length === 0}
              className="w-full bg-red-900 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-400 font-medium text-white py-2 px-4 rounded-lg transition-colors cursor-pointer"
            >
              {submitting ? "Creating..." : "Create Request"}
            </button>
          </form>
        </div>

        {/* Right Column: Requests Directory */}
        <div className="md:col-span-2 space-y-4">
          <h1 className="text-2xl font-bold text-black mb-2">Pending Requests</h1>
          {loading ? (
            <div className="text-gray-400 animate-pulse py-4">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="bg-red-900 border border-gray-700 p-8 rounded-xl text-center text-white">No requests found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {requests.map((request) => (
                <div
                  key={request.request_id}
                  className="bg-red-900 border border-gray-700 p-5 rounded-xl hover:border-gray-600 transition-all flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-white text-black px-2 py-1 rounded-full font-medium">{request.status}</span>
                  </div>
                  <p className="text-sm text-red-200">From: {request.sender_email}</p>
                  {request.event && (
								    <div className="bg-red-800 rounded-lg px-3 py-2">
								      <p className="text-white font-semibold text-sm">{request.event.title}</p>
								      <p className="text-red-200 text-xs">{formatRange(request.event.start_time, request.event.end_time)}</p>
								    </div>
								  )}
								  <div className="flex items-center justify-between">
                    <span className="text-xs bg-white text-black px-2 py-1 rounded-full hover:bg-red-700 hover:text-white hover:cursor-pointer font-medium" onClick={(e) => { e.stopPropagation(); handlePatch(request.request_id, 'Accepted'); }}>Accept?</span>
                    <span className="text-xs bg-white text-black px-2 py-1 rounded-full hover:bg-red-700 hover:text-white hover:cursor-pointer font-medium" onClick={() => { e.stopPropagation(); handlePatch(request.request_id, 'Rejected'); }}>Reject?</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}