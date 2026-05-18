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
  return send ("POST", `/api/schedule/`);
}

export function getCalendar(team_id?: string) {
  if (team_id) {
    return send ("GET", `/api/schedule/${team_id}/`);
  }
  return send ("GET", `/api/schedule/`);
}

export function createEvent(sched_id: string, event: NewEvent) {
  return send ("POST", `/api/event/${sched_id}/`, event);
}

export function getEvents(schedule: number, date?: Dayjs | null, page: number = 1, limit: number = 1000) {
  const params = new URLSearchParams();

  if (date) {
    params.append("date", date.toISOString());
  }

  params.append('page', page.toString());
  params.append('limit', limit.toString());

  const queryString = params.toString();
  const url = queryString ? `/api/event/${schedule}/?${queryString}` : `/api/event`;

  return send("GET", url);
}

export function addExpense(name: string, amount: number, category: string, date: Date, isPaid: boolean = false) {
  return send("POST", `/api/expense/`, { name, amount, category, date, isPaid });
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

export function getTeam(team_id) {
  return send("GET", `/api/team/${team_id}/`);
}

export function getUser() {
  return send("GET", "/api/user");
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