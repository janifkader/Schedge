export interface Resolution {
  event_id: string;
  title: string;
  weight: number;
  preScore: number;
  postScore: number;
  change: number;
}

export interface User {
  email: string;
  name: string;
  avatar_url: string;
}

export interface Team {
  team_id: string;
  team_name: string;
  leader_email: string;
  members: User[];
}

export interface ScheduledEvent {
  event_id: string;
  title: string;
  start_time: string;
  end_time: string;
  weight: number;
  cycle: string;
  span: string;
  isOptimal: boolean;
  isShared: boolean;
  owner: { email: string; name: string; avatar_url: string | null } | null;
}

export interface SchedRequest {
  request_id: string;
  sender_email: string;
  receiver_email: string;
  status: string;
  last_updated: string;
  event: {
    event_id: string;
    title: string;
    start_time: string;
    end_time: string;
    weight: number;
    cycle: string;
    span: string;
  };
}

export interface ApiError {
  message?: string;
  errors?: { msg: string }[];
  conflicts?: { title: string; weight: number }[];
  resolutions?: Resolution[];
  warning?: boolean;
}

export interface UserResponse {
  username: string;
  email: string;
  phone: string;
  avatar_url: string | null;
}

export interface ScheduleResponse {
  schedule: { sched_id: string } | null;
}

export interface TeamResponse {
  team: {
    team_id: string;
    team_name: string;
    members: User[];
    leader_email: string;
  };
}

export interface TeamsResponse {
  teams: Team[];
  total: number;
  totalPages: number;
}

export interface UsersResponse {
  users: User[];
  totalPages: number;
  totalCount: number;
  currentPage: number;
}

export interface EventsResponse {
  events: ScheduledEvent[];
  total: number;
  totalPages: number;
  optimalScore: number;
  totalScore: number;
}

export interface RequestsResponse {
  requests: SchedRequest[];
  total: number;
  totalPages: number;
}

export interface SuggestionsResponse {
  suggestions: { start_time: string; end_time: string; slot_duration: number }[];
}

export interface TeamSuggestion {
  start_time: string;
  end_time: string;
  available_members: string[];
  busy_members: { name: string; conflict: string }[];
  disruption_score: number;
}

export interface TeamSuggestionsResponse {
  suggestions: TeamSuggestion[];
  total_members: number;
}

export interface UserProfileResponse {
  name: string;
  email: string;
  avatar_url: string | null;
  teams: { team_id: string; team_name: string }[];
}