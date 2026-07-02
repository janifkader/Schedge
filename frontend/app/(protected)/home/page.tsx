"use client";

import { useEffect, useState } from "react";
import { Calendar, Users, FileText, Clock, ChevronRight, AlertCircle } from "lucide-react";
import { getUser, getCalendar, getEvents, getTeams, getRequests } from "@/api/api";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

interface Event {
  event_id: string;
  title: string;
  start_time: string;
  end_time: string;
  weight: number;
  cycle: string;
}

interface Team {
  team_id: string;
  team_name: string;
  members: { email: string; name: string }[];
}

interface Request {
  request_id: string;
  sender_email: string;
  status: string;
  event: {
    title: string;
    start_time: string;
    end_time: string;
  };
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const formatTime = (utcString: string) =>
    new Date(utcString).toLocaleTimeString("en-CA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const weightColor = (weight: number) => {
    if (weight >= 8) return "bg-red-100 text-red-800 border-red-200";
    if (weight >= 5) return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-green-100 text-green-800 border-green-200";
  };

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [user, cal, teamsRes, requestsRes] = await Promise.all([
          getUser(),
          getCalendar(),
          getTeams(),
          getRequests(),
        ]);

        setUsername(user.username);
        setTeams(teamsRes?.teams?.slice(0, 3) || []);
        setRequests(requestsRes?.requests?.filter((r: Request) => r.status === "pending").slice(0, 3) || []);

        if (cal?.schedule?.sched_id) {
          const today = dayjs();
          const offset = new Date().getTimezoneOffset();
          const eventsRes = await getEvents(
            cal.schedule.sched_id,
            today,
            1,
            10,
          );
          setTodayEvents(eventsRes?.events || []);
        }
      } catch (err) {
        console.error("Dashboard load failed", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-200 border-t-red-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Greeting */}
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">
            {greeting()}, {username}
          </h1>
          <p className="text-zinc-500 mt-1">
            {dayjs().format("dddd, MMMM D, YYYY")}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Today's Events", value: todayEvents.length, icon: <Calendar className="w-5 h-5" />, href: "/calendars", testid: "todayCard" },
            { label: "Teams", value: teams.length, icon: <Users className="w-5 h-5" />, href: "/teams", testid: "teamCard" },
            { label: "Pending Requests", value: requests.length, icon: <FileText className="w-5 h-5" />, href: "/requests", testid: "requestCard" },
            { label: "Next Event", value: todayEvents[0] ? formatTime(todayEvents[0].start_time) : "None", icon: <Clock className="w-5 h-5" />, href: "/calendars", testid: "nextCard" },
          ].map((stat) => (
            <div
              key={stat.label}
              data-testid={stat.testid}
              onClick={() => router.push(stat.href)}
              className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm hover:border-red-900 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-400">{stat.icon}</span>
                <ChevronRight className="w-4 h-4 text-zinc-300" />
              </div>
              <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
              <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Today's Schedule */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <h2 className="font-bold text-zinc-800">Today's Schedule</h2>
              <button
                onClick={() => router.push("/calendars")}
                className="text-xs text-red-900 cursor-pointer hover:underline"
              >
                View all
              </button>
            </div>
            <div className="p-4 space-y-2">
              {todayEvents.length === 0 ? (
                <div className="text-center py-8 text-zinc-400 text-sm">
                  No events today.
                </div>
              ) : (
                todayEvents.map((event) => (
                  <div
                    key={event.event_id}
                    className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 hover:border-red-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-10 rounded-full bg-red-900" />
                      <div>
                        <p className="text-sm font-semibold text-zinc-800">{event.title}</p>
                        <p className="text-xs text-zinc-400">
                          {formatTime(event.start_time)} – {formatTime(event.end_time)}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${weightColor(event.weight)}`}>
                      W{event.weight}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">

            {/* Pending Requests */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                <h2 className="font-bold text-zinc-800">Pending Requests</h2>
                <button
                  onClick={() => router.push("/requests")}
                  className="text-xs text-red-900 cursor-pointer hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="p-4 space-y-2">
                {requests.length === 0 ? (
                  <div className="text-center py-6 text-zinc-400 text-sm">
                    No pending requests.
                  </div>
                ) : (
                  requests.map((req) => (
                    <div
                      key={req.request_id}
                      onClick={() => router.push("/requests")}
                      className="flex items-start gap-3 p-3 rounded-lg border border-zinc-100 hover:border-red-200 transition-colors cursor-pointer"
                    >
                      <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-zinc-800">{req.event?.title}</p>
                        <p className="text-xs text-zinc-400">From: {req.sender_email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Teams */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                <h2 className="font-bold text-zinc-800">Your Teams</h2>
                <button
                  onClick={() => router.push("/teams")}
                  className="text-xs text-red-900 cursor-pointer hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="p-4 space-y-2">
                {teams.length === 0 ? (
                  <div className="text-center py-6 text-zinc-400 text-sm">
                    No teams yet.
                  </div>
                ) : (
                  teams.map((team) => (
                    <div
                      key={team.team_id}
                      onClick={() => router.push(`/calendars/${team.team_id}`)}
                      className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 hover:border-red-200 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-900 flex items-center justify-center text-white text-xs font-bold">
                          {team.team_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-800">{team.team_name}</p>
                          <p className="text-xs text-zinc-400">{team.members?.length || 0} members</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-300" />
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}