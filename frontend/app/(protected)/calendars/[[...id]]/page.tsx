"use client";

import { useState, useEffect } from "react";
import { CalendarDays, AlertCircle, Users } from "lucide-react";
import { getUser, getCalendar, getTeam, exportEvents } from "@/api/api";
import Calender from "../../../../components/Calendar";
import EventsCard from "../../../../components/EventsCard";
import { use } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../components/Card";
import { Skeleton } from "../../../../components/Skeleton";
import { Badge } from "../../../../components/Badge";
import TeamSuggestion from "@/components/TeamSuggestion";
import dayjs from "dayjs";

type Params = Promise<{ id?: string[] }>;

export default function Calendars({ params }: { params: Params }) {
  const { id: idParam } = use(params);
  const id = idParam?.[0] || null;

  const [selectedDate, setSelectedDate] = useState<Date>(() => { const today = new Date(); today.setHours(0, 0, 0, 0); return today; });
  const [schedule, setSchedule] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamSuggestionsOpen, setTeamSuggestionsOpen] = useState(false);
  const [teamTotalMembers, setTeamTotalMembers] = useState(0);

  const handleExport = async () => {
    try {
      await exportEvents(schedule, dayjs(selectedDate).toISOString());
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  useEffect(() => {
    (async () => {
      console.log(schedule);
      setIsLoading(true);
      setError(null);
      try {
        let cal;
        let n;
        if (id) {
          cal = await getCalendar(id);
          const res = await getTeam(id);
          console.log(res);
          if (res && res.team && res.team.team_name) {
            n = res.team.team_name;
            setTeamTotalMembers(res.team.members.length);
          }
        } else {
          cal = await getCalendar();
          const res = await getUser();
          if (res && res.username) {
            n = res.username;
          }
        }
        if (cal) {
          setSchedule(cal.schedule?.sched_id || "");
          console.log(cal.schedule?.sched_id || "Bye");
        }
        console.log(n);
        if (n) {
          setName(n);
        }
      } catch (error) {
        console.error("Schedule fetch failed", error);
        setError("Failed to load schedule. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, schedule]);

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-zinc-50 to-zinc-100 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[500px] rounded-xl" />
            <Skeleton className="h-[500px] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-zinc-50 to-zinc-100 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">
                    Error Loading Schedule
                  </h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Empty State
  if (schedule === "") {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-zinc-50 to-zinc-100 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <Card className="border-dashed">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-zinc-100 p-6">
                  <CalendarDays className="h-12 w-12 text-zinc-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-zinc-900 mb-2">
                    No Schedule Available
                  </h3>
                  <p className="text-zinc-600 max-w-md">
                    There is no schedule to display at this time. Check back later or contact support if you believe this is an error.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main Content
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-zinc-50 to-zinc-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            {id ? (
              <Users className="h-7 w-7 text-red-900" />
            ) : (
              <CalendarDays className="h-7 w-7 text-red-900" />
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">
              {name}&apos;s Schedule
            </h1>
            {id && (
              <Badge variant="secondary" className="ml-auto">
                Team Calendar
              </Badge>
            )}
          </div>
          <p className="text-zinc-600 text-sm sm:text-base">
            View and manage {id ? "your team's" : "your"} upcoming events
          </p>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar Card */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="border-b bg-gradient-to-r from-red-50 to-orange-50">
              <CardTitle className="flex items-center gap-2 text-zinc-900">
                <CalendarDays className="h-5 w-5 text-red-900" />
                Calendar View
              </CardTitle>
              <CardDescription>
                Select a date to view scheduled events
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Calender
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />
            </CardContent>
          </Card>

          {/* Events Card */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="border-b bg-gradient-to-r from-red-50 to-orange-50">
              <CardTitle className="flex items-center gap-2 text-zinc-900">
                <CalendarDays className="h-5 w-5 text-red-900" />
                Scheduled Events
              </CardTitle>
              <CardDescription>
                Events for {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <EventsCard selectedDate={selectedDate} schedule={schedule} />
            </CardContent>
          </Card>

          {id && (
            <>
              <button
                onClick={() => setTeamSuggestionsOpen(true)}
                className="text-sm bg-red-900 cursor-pointer hover:bg-red-800 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Find Meeting Time
              </button>

              <TeamSuggestion
                open={teamSuggestionsOpen}
                onClose={() => setTeamSuggestionsOpen(false)}
                teamId={id}
                selectedDate={selectedDate}
                totalMembers={teamTotalMembers}
              />
            </>
          )}

          <button
            onClick={handleExport}
            className="text-xs text-zinc-500 border cursor-pointer border-zinc-300 hover:border-red-900 hover:text-red-900 px-3 py-1.5 rounded-full transition-colors"
          >
            Export Calendar to .ics
          </button>
        </div>
      </div>
    </div>
  );
}
