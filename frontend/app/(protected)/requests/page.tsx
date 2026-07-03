"use client";

import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { getUsers, createRequest, getRequests, getEvents, getSchedule, patchRequest } from '@/api/api';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/Avatar";

interface User {
  email: string;
  name: string;
  pictureUrl?: string;
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
  event: Event;
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

  const handlePatch = async (request_id: string, status: string) => {
    try {
      await patchRequest(request_id, status, dayjs(new Date()));
      setUpdate((prevUpdate) => prevUpdate + 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not update request.");
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
      await createRequest(events[0].event_id, members[0].email, dayjs(new Date()));
      setMembers([]);
      setEvents([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not create request.");
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
        const scheduleId = schedule?.schedule?.sched_id || schedule?.schedule?.sched_id;
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
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An error occurred fetching requests.");
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, [update]);

  // Helper for status badge colors
  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'accepted': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-amber-100 text-amber-800 border-amber-200'; // Pending
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20">
      <div className="max-w-7xl mx-auto px-6 pt-12">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Requests</h1>
          <p className="text-slate-500 mt-2">Manage your incoming and outgoing shift requests.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Create Request Form */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sticky top-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                Create Request
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Event Section */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Select Event</label>
                  {events.length > 0 && (
                    <div className="flex flex-col gap-1 mb-3">
                      {events.map((e) => (
                        <div key={e.event_id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-800">{e.title}</span>
                            <span className="text-xs text-slate-500 mt-0.5">{formatRange(e.start_time, e.end_time)}</span>
                          </div>
                          <button type="button" onClick={() => removeEvent(e.event_id)} className="text-slate-400 hover:text-red-600 transition-colors h-8 w-8 rounded-full hover:bg-red-50 flex items-center justify-center text-lg leading-none">×</button>
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-900/20 focus:border-red-900 outline-none transition-all"
                      />
                    )}
                    {searchFocusedEvent && evs.length > 0 && (
                      <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl mt-2 shadow-xl max-h-60 overflow-y-auto">
                        {evs.map((event) => (
                          <button key={event.event_id} type="button" onMouseDown={() => addEvent(event)} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex flex-col border-b border-slate-50 last:border-0 transition-colors">
                            <span className="text-sm font-medium text-slate-800">{event.title}</span>
                            <span className="text-xs text-slate-500 mt-1">{formatRange(event.start_time, event.end_time)}</span>
                          </button>
                        ))}
                        {totalEventPages > 1 && (
                          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 bg-slate-50 sticky bottom-0">
                            <button type="button" onClick={() => setEventPage((p) => Math.max(p - 1, 1))} disabled={eventPage === 1} className="text-xs font-medium text-slate-600 disabled:opacity-30 hover:text-slate-900 transition-colors">Previous</button>
                            <span className="text-xs text-slate-400">{eventPage} / {totalEventPages}</span>
                            <button type="button" onClick={() => setEventPage((p) => Math.min(p + 1, totalEventPages))} disabled={eventPage === totalEventPages} className="text-xs font-medium text-slate-600 disabled:opacity-30 hover:text-slate-900 transition-colors">Next</button>
                          </div>
                        )}
                      </div>
                    )}
                    {searchFocusedEvent && eventSearch && evs.length === 0 && (
                      <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl mt-2 shadow-xl p-4 text-center text-sm text-slate-400">No events found.</div>
                    )}
                  </div>
                </div>

                {/* Receiver Section */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Send To</label>
                  {members.length > 0 && (
                    <div className="flex flex-col gap-1 mb-3">
                      {members.map((m) => (
                        <div key={m.email} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={m.pictureUrl} alt={m.name} />
                              <AvatarFallback className="bg-slate-200 text-slate-600 text-xs font-medium uppercase">
                                {m.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-slate-800">{m.name}</span>
                              <span className="text-xs text-slate-500">{m.email}</span>
                            </div>
                          </div>
                          <button type="button" onClick={() => removeMember(m.email)} className="text-slate-400 hover:text-red-600 transition-colors h-8 w-8 rounded-full hover:bg-red-50 flex items-center justify-center text-lg leading-none">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="relative">
                    {members.length === 0 && (
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={userSearch}
                        onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-900/20 focus:border-red-900 outline-none transition-all"
                      />
                    )}
                    {searchFocused && filteredUsers.length > 0 && (
                      <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl mt-2 shadow-xl max-h-60 overflow-y-auto">
                        {filteredUsers.map((user) => (
                          <button key={user.email} type="button" onMouseDown={() => addMember(user)} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50 last:border-0 transition-colors">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.pictureUrl} alt={user.name} />
                              <AvatarFallback className="bg-slate-200 text-slate-600 text-xs font-medium uppercase">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-800">{user.name}</span>
                              <span className="text-xs text-slate-500">{user.email}</span>
                            </div>
                          </button>
                        ))}
                        {totalUserPages > 1 && (
                          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 bg-slate-50 sticky bottom-0">
                            <button type="button" onClick={() => setUserPage((p) => Math.max(p - 1, 1))} disabled={userPage === 1} className="text-xs font-medium text-slate-600 disabled:opacity-30 hover:text-slate-900 transition-colors">Previous</button>
                            <span className="text-xs text-slate-400">{userPage} / {totalUserPages}</span>
                            <button type="button" onClick={() => setUserPage((p) => Math.min(p + 1, totalUserPages))} disabled={userPage === totalUserPages} className="text-xs font-medium text-slate-600 disabled:opacity-30 hover:text-slate-900 transition-colors">Next</button>
                          </div>
                        )}
                      </div>
                    )}
                    {searchFocused && userSearch && filteredUsers.length === 0 && (
                      <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl mt-2 shadow-xl p-4 text-center text-sm text-slate-400">No users found.</div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 text-sm">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={submitting || events.length === 0 || members.length === 0}
                  className="w-full bg-red-900 cursor-pointer hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-slate-200 disabled:opacity-50 disabled:shadow-none"
                >
                  {submitting ? "Processing..." : "Send Request"}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Requests Directory */}
          <div className="lg:col-span-8">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-2xl"/>)}
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-white border border-slate-200 p-12 rounded-3xl text-center shadow-inner">
                <h3 className="text-xl font-bold text-slate-800">No requests found</h3>
                <p className="text-slate-500 mt-2 max-w-sm mx-auto">You don&apos;t have any pending requests at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {requests.map((request) => (
                  <div
                    key={request.request_id}
                    className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-slate-300 hover:shadow-xl transition-all flex flex-col"
                  >
                    {/* Header: Sender & Status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-slate-100">
                           {/* Since request only has email currently, we use the first letter as fallback */}
                          <AvatarFallback className="bg-slate-100 text-slate-700 font-bold uppercase">
                            {request.sender_email.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-500">Request from</span>
                          <span className="font-semibold text-slate-900 leading-tight truncate max-w-[150px] sm:max-w-[180px]" title={request.sender_email}>
                            {request.sender_email}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>

                    {/* Event Details Card */}
                    {request.event && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-slate-800 font-bold">{request.event.title}</p>
                        </div>
                        <p className="text-slate-500 text-sm ml-7">{formatRange(request.event.start_time, request.event.end_time)}</p>
                      </div>
                    )}

                    {/* Actions Spacer */}
                    <div className="mt-auto pt-2 flex gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handlePatch(request.request_id, 'Accepted'); }}
                        className="flex-1 bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handlePatch(request.request_id, 'Rejected'); }}
                        className="flex-1 bg-white text-slate-600 border border-slate-200 text-sm font-semibold py-2.5 rounded-lg hover:bg-slate-50 hover:text-red-600 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}