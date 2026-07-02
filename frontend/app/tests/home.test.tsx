import { render, screen, waitFor, fireEvent  } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import Home from "../(protected)/home/page";
import { describe, it, expect, vi, beforeEach} from "vitest";
import { getUser, getCalendar, getEvents, getTeams, getRequests } from "@/api/api";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/api/api", () => ({
  getUser: vi.fn(),
  getCalendar: vi.fn(),
  getEvents: vi.fn(),
  getTeams: vi.fn(),
  getRequests: vi.fn(),
}));

const mockUser = {
  username: "New Name",
  email: "name@example.com",
  phone: "+11234567890",
  avatar_url: "",
};

const mockCalendar = {
  schedule: { sched_id: "sched-1" },
};

const mockLeaderEmail = "name@example.com";
const mockTeams = { teams: [
  {
    team_id: "team-1",
    team_name: "Team 1",
    leader_email: mockLeaderEmail,
    members: [
      { email: mockLeaderEmail, name: "Leader User", avatar_url: "" },
      { email: "member1@schedge.com", name: "Member One", avatar_url: "" },
    ],
  },
]};

const mockRequests = {
  requests: [
    {
      request_id: "req-1",
      sender_email: "coworker@schedge.com",
      status: "pending",
      event: { title: "Incoming Request", start_time: "2026-07-01T08:00:00Z", end_time: "2026-07-01T16:00:00Z" }
    },
    {
      request_id: "req-2",
      sender_email: "other@schedge.com",
      status: "accepted",
      event: { title: "Old Request", start_time: "2026-07-01T08:00:00Z", end_time: "2026-07-01T16:00:00Z" }
    }
  ],
};

const mockEvents = {
  events: [
    {
      event_id: "evt-1",
      title: "Mock Event",
      start_time: "2026-07-01T14:00:00Z",
      end_time: "2026-07-01T15:00:00Z",
      weight: 8,
      cycle: "none"
    }
  ],
};

beforeEach(() => {
  vi.resetAllMocks();
  pushMock.mockReset();
  vi.mocked(getUser).mockResolvedValue(mockUser);
  vi.mocked(getCalendar).mockResolvedValue(mockCalendar);
  vi.mocked(getRequests).mockResolvedValue(mockRequests);
  vi.mocked(getEvents).mockResolvedValue(mockEvents);
  vi.mocked(getTeams).mockResolvedValue(mockTeams);
});

describe("Home Component", () => {
  it("renders the loading icon", () => {
    render(<Home />);
    expect(screen.queryByText(/today's schedule/i)).not.toBeInTheDocument();
  });

  it("renders dashboard modules correctly", async () => {
    render(<Home />);
    expect(await screen.findByText(/(Good Morning|Good Afternoon|Good Evening), New Name/i)).toBeInTheDocument();
    expect(screen.getByText("Today's Events")).toBeInTheDocument();
    expect(screen.getByText("Teams")).toBeInTheDocument();
    expect(screen.getAllByText("Pending Requests")[0]).toBeInTheDocument();
    expect(screen.getByText("Next Event")).toBeInTheDocument();

    expect(screen.getByText("Mock Event")).toBeInTheDocument();
    expect(screen.getByText("W8")).toBeInTheDocument();

    expect(screen.getByText("Incoming Request")).toBeInTheDocument();
    expect(screen.queryByText("Old Request")).not.toBeInTheDocument();
  });

  it("handles empty data", async () => {
    vi.mocked(getTeams).mockResolvedValue({ teams: [] });
    vi.mocked(getRequests).mockResolvedValue({ requests: [] });
    vi.mocked(getEvents).mockResolvedValue({ events: [] });

    render(<Home />);
    expect(await screen.findByText(/(Good Morning|Good Afternoon|Good Evening), New Name/i)).toBeInTheDocument();
    expect(screen.getByText("No events today.")).toBeInTheDocument();
    expect(screen.getByText("No pending requests.")).toBeInTheDocument();
    expect(screen.getByText("No teams yet.")).toBeInTheDocument();
    expect(screen.getByText("None")).toBeInTheDocument();
    expect(screen.getAllByText(/0/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/0/i)[1]).toBeInTheDocument();
    expect(screen.getAllByText(/0/i)[2]).toBeInTheDocument();
  });

  it("handles router navigation", async () => {
    render(<Home />);
    await screen.findByText(/(Good Morning|Good Afternoon|Good Evening), New Name/i);
    const teamCard = await screen.findByTestId("teamCard");
    fireEvent.click(teamCard!);
    expect(pushMock).toHaveBeenCalledWith("/teams");
    const requestCard = await screen.findByTestId("requestCard");
    fireEvent.click(requestCard!);
    expect(pushMock).toHaveBeenCalledWith("/requests");
    const eventCard = await screen.findByTestId("nextCard");
    fireEvent.click(eventCard!);
    expect(pushMock).toHaveBeenCalledWith("/calendars");

    const viewAllButtons = await screen.findAllByRole("button", { name: /view all/i });
    expect(viewAllButtons).toHaveLength(3);
    fireEvent.click(viewAllButtons[0]);
    expect(pushMock).toHaveBeenCalledWith("/calendars");
    fireEvent.click(viewAllButtons[1]);
    expect(pushMock).toHaveBeenCalledWith("/requests");
    fireEvent.click(viewAllButtons[2]);
    expect(pushMock).toHaveBeenCalledWith("/teams");
  });

  it("handles specific team/request clicks", async () => {
    render(<Home />);
    const teamCard = await screen.findByText("Team 1");
    fireEvent.click(teamCard.closest("div")!);
    expect(pushMock).toHaveBeenCalledWith("/calendars/team-1");
    const requestCard = await screen.findByText("Incoming Request");
    fireEvent.click(requestCard.closest("div")!);
    expect(pushMock).toHaveBeenCalledWith("/requests");
  });
});