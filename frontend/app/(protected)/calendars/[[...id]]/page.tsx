"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { getUser, getCalendar, getTeam } from "@/api/api"; 
import Calender from "../../../../components/Calendar";
import EventsCard from "../../../../components/EventsCard";
import { use } from "react";

export default function Calendars({ params }: { params: { id?: string[] } }) {
  const pathname = usePathname();
  const { id: idParam } = use(params);
  const id = idParam?.[0] || null;
  
  const linkStyle = (path: string) =>
    `px-4 py-2 ${
      pathname == path
        ? "bg-gray-800 text-white"
        : " text-gray-600"
    }`;

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [schedule, setSchedule] = useState("");
  const [name, setName] = useState("");
  useEffect(() => {
    (async () => {
      try {
        let cal;
        let n;
        if (id) {
          cal = await getCalendar(id);
          const res = await getTeam(id);
          console.log(res);
          if (res && res.team && res.team.team_name){
            n = res.team.team_name;
          }
        }
        else{
          cal = await getCalendar();
          const res = await getUser();
          if (res && res.username){
            n = res.username;
          }
        }
        if (cal) {
          setSchedule(cal.schedule?.sched_id || "");
        }
        console.log(n);
        if (n) {
          setName(n);
        }
      } catch (error) { console.error("Schedule fetch failed", error); }
    })();
  }, []);
  if (schedule != ""){
    return (
          <div>
            <main className="flex-1 overflow-y-auto p-4">
              <div className="flex gap-4 h-full">
                <div className="flex flex-col w-1/2 gap-2">
                  <h2 className="text-xl font-bold text-center text-zinc-800">{name}'s Schedule</h2>
                  <Calender selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
                </div>
                <div className="w-1/2">
                  <EventsCard selectedDate={selectedDate} schedule={schedule} />
                </div>
              </div>
            </main>
          </div>
    );
  }
  else {
    return (
          <div className="flex flex-col h-screen">
            <main className="flex-1 overflow-y-auto">
              No schedule to display.
            </main>
          </div>
    );
  }
}
 ``