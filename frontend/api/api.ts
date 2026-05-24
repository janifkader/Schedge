import { Dayjs } from "dayjs";
import { NewEvent } from "../components/AddEvent";

async function send(
  method: string,
  url: string,
  data?: unknown,
  isRetry = false,
) {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND || "http://localhost:4000";
  
  const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;

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
    throw { conflicts: json.conflicts, message: json.error };
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
) {
  return send("POST", "/api/signup/", {
    name,
    email,
    password,
  });
}

export function signin(email: string, password: string) {
  return send("POST", `/api/signin/`, { email, password });
}

export function signout() {
  return send("GET", `/api/signout/`);
}

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

export function createRequest(event_id: string, receiver: NewEvent, last_updated: Dayjs) {
  return send("POST", `/api/request/`, { event_id, receiver, last_updated });
}

export function getEvents(
  schedule: number, 
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

export function addExpense(name: string, amount: number, category: string, date: Date, isPaid: boolean = false) {
  return send("POST", `/api/expense/`, { name, amount, category, date, isPaid });
}

export function patchRequest(id: string, status: string, last_updated: Dayjs) {
  return send("PATCH", `/api/request/${id}/`, { status, last_updated });
}

export function resendVerificationEmail(email: string) {
  return send("GET", `/api/resend/${email}/`);
}

export function addSubscription(
  name: string,
  amount: number,
  date: Date,
  billingCycle: string,
  nextRenewalDate: Date,
) {
  return send("POST", `/api/subscription/`, {
    name,
    amount,
    date,
    billingCycle,
    nextRenewalDate,
  });
}

export function editSubscription(
  id: number,
  name: string,
  amount: number,
  date: Date,
  billingCycle: string,
  nextRenewalDate: Date,
  mode: string | null,
) {
  return send("PUT", `/api/subscription/${id}/`, {
    name,
    amount,
    date,
    billingCycle,
    nextRenewalDate,
    mode,
  });
}

export function verifyEmail(token: string) {
  return send("GET", `/api/verify/?token=${token}`);
}

export function deleteSubscription(id: string) {
  return send("DELETE", `/api/subscription/${id}/`);
}

export function getExpenses(startDate?: Dayjs | null, endDate?: Dayjs | null, page: number = 1, limit: number = 1000, filter?: string) {
  const params = new URLSearchParams();

  if (startDate) {
    params.append("start", startDate.toISOString());
  }

  if (endDate) {
    params.append("end", endDate.toISOString());
  }

  if (filter) {
    params.append("filter", filter);
  }

  params.append('page', page.toString());
  params.append('limit', limit.toString());

  const queryString = params.toString();
  const url = queryString ? `/api/expense/?${queryString}` : `/api/expense`;

  return send("GET", url);
}

export function createTeam(team_name: string, members: { email: string, name: string }) {
  return send("POST", `/api/team/`, { team_name, members });
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