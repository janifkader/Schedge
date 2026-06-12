import { Dayjs } from "dayjs";
import { NewEvent } from "../components/AddEvent";

interface User {
  email: string;
  name: string;
}

async function send(
  method: string,
  url: string,
  data?: unknown,
  isRetry = false,
) {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND || "http://localhost:4000";
  
  const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;
  console.log("FETCH", fullUrl, "credentials: include");
  const res = await fetch(fullUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: data ? JSON.stringify(data) : null,
    credentials: "include",
    cache: "no-store",
  });
  let json: any = null;

  try {
    json = await res.json();
  } catch {}

  // Keep your local conflict handling logic
  if (res.status === 409) {
    throw { conflicts: json.conflicts, message: json.error, warning: json.warning, resolutions: json.resolutions };
  }

  if (res.status === 401 && !isRetry) {
    try {
      const refreshRes = await fetch(
        `${baseUrl}/api/refresh`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (refreshRes.ok) {
        return send(method, url, data, true);
      }
    } catch (e) {
      console.error("Refresh failed", e);
    }
    // window.location.href = "/";
  }

  if (!res.ok) {
    if (json?.error) {
      console.log(json.error);
      throw new Error(json.error);
    }
    throw new Error("Request failed");
  }
  return json;
}

export function signup(
  name: string,
  email: string,
  password: string,
  phone: string,
) {
  return send("POST", "/api/signup/", {
    name,
    email,
    password,
    phone,
  });
}

export function updateUser(name: string, phone: string) {
  return send("PATCH", "/api/user/", {
    name,
    phone,
  });
}

export function changePassword(oldPassword: string, newPassword: string) {
  return send("PATCH", `/api/user/password/`, { oldPassword, newPassword });
}

export function signin(email: string, password: string) {
  return send("POST", `/api/signin/`, { email, password });
}

export function signout() {
  return send("GET", `/api/signout/`);
}

export function getUserProfile(email: string) {
  return send("GET", `/api/users/${email}/`);
}

export const uploadAvatar = async (file: File) => {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND || "http://localhost:4000";
  const formData = new FormData();
  formData.append("avatar", file);
  const res = await fetch(`${baseUrl}/api/user/avatar/`, {
    method: "PUT",
    credentials: "include",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload avatar");
  return res.json();
};

export function createCalendar() {
  return send("POST", `/api/schedule/`);
}

export function getCalendar(team_id?: string) {
  if (team_id) {
    return send("GET", `/api/schedule/${team_id}/`);
  }
  return send("GET", `/api/schedule/`);
}

// Fixed function argument signature mismatch to cleanly accept sched_id
export function createEvent(sched_id: string, event: NewEvent) {
  return send("POST", `/api/event/${sched_id}/`, event);
}

export function editEvent(sched_id: string, event_id: string, event: NewEvent) {
  return send("PATCH", `/api/event/${sched_id}/${event_id}/`, event);
}

export function createRequest(event_id: string, receiver: string, last_updated: Dayjs) {
  return send("POST", `/api/request/`, { event_id, receiver, last_updated });
}

export function deleteEvent(event_id: string) {
  return send("DELETE", `/api/event/${event_id}/`);
}

export function getEvents(
  schedule: string, 
  date?: Dayjs | null, 
  page: number = 1, 
  limit: number = 1000, 
  search?: string
) {
  const params = new URLSearchParams();

  if (date) {
    params.append("date", date.toISOString());
  }

  if (search) {
    params.append("search", search);
  }

  params.append('page', page.toString());
  params.append('limit', limit.toString());

  // Keeps your newly fixed local timezone payload additions active!
  const offset = new Date().getTimezoneOffset();
  params.append('timezone', offset.toString());

  const queryString = params.toString();
  const url = queryString ? `/api/event/${schedule}/?${queryString}` : `/api/event`;

  return send("GET", url);
}

export function getScheduleSuggestions (scheduleId: string, date: string, durationMinutes: number, weight: number) {
  const offset = new Date().getTimezoneOffset();
  return send("GET", `/api/event/${scheduleId}/suggestions/?date=${date}&duration=${durationMinutes}&weight=${weight}&timezone=${offset}`);
};

export function patchRequest(id: string, status: string, last_updated: Dayjs) {
  return send("PATCH", `/api/request/${id}/`, { status, last_updated });
}

export function resendVerificationEmail(email: string) {
  return send("GET", `/api/resend/${email}/`);
}

export function verifyEmail(token: string) {
  return send("GET", `/api/verify/?token=${token}`);
}

export function createTeam(team_name: string, members: User[]) {
  return send("POST", `/api/team/`, { team_name, members });
}

export function addMember(id: string, email: string) {
  return send("PUT", `/api/team/${id}/`, { email });
} 

export function getTeams() {
  return send("GET", `/api/team/`);
}

export function getRequests(page: number = 1, limit: number = 1000) {
  const params = new URLSearchParams();

  params.append('page', page.toString());
  params.append('limit', limit.toString());
  const queryString = params.toString();
  const url = queryString ? `/api/request/?${queryString}` : `/api/request`;
  return send("GET", url);
}

export function getTeamSuggestions(team_id: string, date: string, duration: number) {
  const params = new URLSearchParams();
  params.append('date', date.toString());
  params.append('duration', duration.toString());
  const queryString = params.toString();
  const url = queryString ? `/api/team/${team_id}/suggestions/?${queryString}` : `/api/team/suggestions/${team_id}/`;
  return send("GET", url);
}

export function getTeam(team_id: string) {
  return send("GET", `/api/team/${team_id}/`);
}

export function getUser() {
  return send("GET", "/api/user");
}

export function getSchedule() {
  return send("GET", "/api/schedule/");
}

export function getUsers(page: number = 1, limit: number = 1000, search?: string) {
  const params = new URLSearchParams();
  if (search) {
    params.append("search", search);
  }
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  const queryString = params.toString();
  const url = queryString ? `/api/users/?${queryString}` : `/api/users/`;
  return send("GET", url);
}

export async function exportEvents (scheduleId: string, date?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND || "http://localhost:4000";
  const url = date
    ? `${baseUrl}/api/schedule/${scheduleId}/export/?date=${date}`
    : `${baseUrl}/api/schedule/${scheduleId}/export/`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to export events");

  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "schedge-export.ics";
  link.click();
  URL.revokeObjectURL(link.href);
};