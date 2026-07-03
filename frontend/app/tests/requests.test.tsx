import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import Requests from "../(protected)/requests/page";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUsers, createRequest, getRequests, getEvents, getSchedule, patchRequest } from '@/api/api';
import type { ScheduleResponse, RequestsResponse, EventsResponse, UsersResponse } from "@/app/types/types";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/api/api", () => ({
  getUsers: vi.fn(),
  createRequest: vi.fn(),
  getRequests: vi.fn(),
  getEvents: vi.fn(),
  getSchedule: vi.fn(),
  patchRequest: vi.fn(),
}));

const mockSchedule = { schedule: { sched_id: "sched-1" } } as ScheduleResponse;

const mockRequests = { requests: [
  {
    request_id: "req-1",
    sender_email: "sender@schedge.com",
    receiver_email: "me@schedge.com",
    status: "Pending",
    last_updated: "2026-06-30T12:00:00Z",
    event: {
      event_id: "evt-99",
      title: "Incoming Shift",
      start_time: "2026-07-01T08:00:00Z",
      end_time: "2026-07-01T16:00:00Z",
      weight: 1,
      cycle: "none",
      span: "none"
    }
  }
]} as RequestsResponse;

const mockSearchEvents = {
  events: [
    {
      event_id: "evt-1",
      title: "Morning Shift",
      start_time: "2026-07-05T08:00:00Z",
      end_time: "2026-07-05T16:00:00Z",
      weight: 1,
      cycle: "none",
      span: "none"
    }
  ],
  totalPages: 1,
} as EventsResponse;

const mockSearchUsers = {
  users: [
    { email: "search1@schedge.com", name: "Alice Smith", avatar_url: "" },
  ],
  totalPages: 1,
  totalCount: 1,
  currentPage: 1,
} as UsersResponse;

beforeEach(() => {
  vi.resetAllMocks();
  pushMock.mockReset();
  
  vi.mocked(getSchedule).mockResolvedValue(mockSchedule);
  vi.mocked(getRequests).mockResolvedValue(mockRequests);
  vi.mocked(getEvents).mockResolvedValue(mockSearchEvents);
  vi.mocked(getUsers).mockResolvedValue(mockSearchUsers);
});

describe("Requests Component", () => {
  it("renders the directory state and fetched requests list on mount", async () => {
    render(<Requests />);
    
    expect(screen.getByRole("heading", { name: /^requests$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /create request/i })).toBeInTheDocument();
    expect(await screen.findByText("Incoming Shift")).toBeInTheDocument();
    expect(screen.getByText("sender@schedge.com")).toBeInTheDocument();
  });

  it("handles debounced event lookups and adds an event to the form", async () => {
    render(<Requests />);
    const user = userEvent.setup();

    const eventSearchInput = await screen.findByPlaceholderText(/search by event title\.\.\./i);
    await user.type(eventSearchInput, "Morning");

    const dropdownBtn = await screen.findByRole("button", { name: /morning shift.*/i });
    expect(dropdownBtn).toBeInTheDocument();

    await user.click(dropdownBtn);
    
    expect(screen.getByText("Morning Shift")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/search by event title\.\.\./i)).not.toBeInTheDocument();
  });

  it("handles debounced user lookups and adds a receiver locally", async () => {
    render(<Requests />);
    const user = userEvent.setup();

    const userSearchInput = await screen.findByPlaceholderText(/search by name or email\.\.\./i);
    await user.type(userSearchInput, "Alice");

    const dropdownBtn = await screen.findByRole("button", { name: /alice smith.*search1@schedge\.com/i });
    expect(dropdownBtn).toBeInTheDocument();

    await user.click(dropdownBtn);
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });

  it("submits the create request form successfully", async () => {
    vi.mocked(createRequest).mockResolvedValue({} as unknown);

    render(<Requests />);
    const user = userEvent.setup();

    const eventSearchInput = await screen.findByPlaceholderText(/search by event title\.\.\./i);
    await user.type(eventSearchInput, "Morning");
    const eventSelection = await screen.findByRole("button", { name: /morning shift.*/i });
    await user.click(eventSelection);

    const userSearchInput = screen.getByPlaceholderText(/search by name or email\.\.\./i);
    await user.type(userSearchInput, "Alice");
    const userSelection = await screen.findByRole("button", { name: /alice smith.*search1@schedge\.com/i });
    await user.click(userSelection);
    await user.click(screen.getByRole("button", { name: /send request/i }));

    expect(createRequest).toHaveBeenCalledWith(
      "evt-1", 
      "search1@schedge.com", 
      expect.anything()
    );
  });

  it("prevents form submission if dependencies are missing", async () => {
    render(<Requests />);

    const submitBtn = screen.getByRole("button", { name: /send request/i });
    expect(submitBtn).toBeDisabled();
  });

  it("calls patchRequest when accepting or rejecting an existing request card", async () => {
    vi.mocked(patchRequest).mockResolvedValue({} as never);

    render(<Requests />);
    const user = userEvent.setup();

    const acceptBtn = await screen.findByRole("button", { name: /^accept$/i });
    const rejectBtn = screen.getByRole("button", { name: /^reject$/i });

    await user.click(acceptBtn);
    expect(patchRequest).toHaveBeenCalledWith(
      "req-1", 
      "Accepted", 
      expect.anything()
    );

    await user.click(rejectBtn);
    expect(patchRequest).toHaveBeenCalledWith(
      "req-1", 
      "Rejected", 
      expect.anything()
    );
  });
});