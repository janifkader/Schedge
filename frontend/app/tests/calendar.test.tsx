import React, { Suspense } from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import Calendars from "../(protected)/calendars/[[...id]]/page";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUser, getCalendar, getTeam, exportEvents } from "@/api/api";

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    use: (p: any) => {
      if (p && p._isMockParams) return p.data;
      return actual.use ? actual.use(p) : p;
    },
  };
});

vi.mock("@/api/api", () => ({
  getUser: vi.fn(),
  getCalendar: vi.fn(),
  getTeam: vi.fn(),
  exportEvents: vi.fn(),
}));

vi.mock("@/components/Calendar", () => ({
  default: () => <div data-testid="mock-calendar">Calendar Component</div>
}));

vi.mock("@/components/EventsCard", () => ({
  default: () => <div data-testid="mock-events-card">Events Card Component</div>
}));

vi.mock("@/components/TeamSuggestion", () => ({
  default: ({ open, onClose }: { open: boolean, onClose: () => void }) => 
    open ? (
      <div data-testid="mock-team-suggestion">
        Team Suggestion Modal
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null
}));

const mockPersonalUser = { username: "Personal User" };
const mockTeam = { 
  team: { 
    team_name: "Mock Team", 
    members: [{ email: "one@example.com" }, { email: "two@example.com" }] 
  } 
};
const mockCalendarData = { schedule: { sched_id: "sched-99" } };

beforeEach(() => {
  vi.resetAllMocks();
});

const renderCalendars = (paramsObj: { id?: string[] } = {}) => {
  const fakeParams = { _isMockParams: true, data: paramsObj };
  return render(<Calendars params={fakeParams as any} />);
};

describe("Calendars Component", () => {
  it("renders the loading screen", async () => {
    vi.mocked(getCalendar).mockImplementation(() => new Promise(() => {}));
    
    renderCalendars();
    expect(screen.queryByText(/schedule/i)).not.toBeInTheDocument();
  });

  it("renders the calendar view", async () => {
    vi.mocked(getCalendar).mockResolvedValue(mockCalendarData);
    vi.mocked(getUser).mockResolvedValue(mockPersonalUser);

    renderCalendars({});

    expect(await screen.findByText("Personal User's Schedule")).toBeInTheDocument();
    expect(screen.getByTestId("mock-calendar")).toBeInTheDocument();
    expect(screen.getByTestId("mock-events-card")).toBeInTheDocument();
    expect(screen.queryByText("Team Calendar")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /find meeting time/i })).not.toBeInTheDocument();
  });

  it("renders the team calendar view", async () => {
    vi.mocked(getCalendar).mockResolvedValue(mockCalendarData);
    vi.mocked(getTeam).mockResolvedValue(mockTeam);

    renderCalendars({ id: ["team-123"] });
    expect(await screen.findByText("Mock Team's Schedule")).toBeInTheDocument();
    expect(screen.getByText("Team Calendar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /find meeting time/i })).toBeInTheDocument();
  });

  it("handles empty data", async () => {
    vi.mocked(getCalendar).mockResolvedValue({ schedule: null });
    vi.mocked(getUser).mockResolvedValue(mockPersonalUser);

    renderCalendars({});

    expect(await screen.findByText("No Schedule Available")).toBeInTheDocument();
    expect(screen.getByText(/There is no schedule to display at this time/i)).toBeInTheDocument();
  });

  it("handles backend error display", async () => {
    vi.mocked(getCalendar).mockRejectedValue(new Error("Network Failure"));

    renderCalendars({});

    expect(await screen.findByText("Error Loading Schedule")).toBeInTheDocument();
    expect(screen.getByText("Failed to load schedule. Please try again later.")).toBeInTheDocument();
  });

  it("handles export", async () => {
    vi.mocked(getCalendar).mockResolvedValue(mockCalendarData);
    vi.mocked(getUser).mockResolvedValue(mockPersonalUser);
    vi.mocked(exportEvents).mockResolvedValue({} as any);

    renderCalendars({});
    const user = userEvent.setup();
    await screen.findByText("Personal User's Schedule");

    const exportBtn = screen.getByRole("button", { name: /export calendar to \.ics/i });
    await user.click(exportBtn);

    expect(exportEvents).toHaveBeenCalledWith("sched-99", expect.any(String));
  });

  it("opens and closes the Team Suggestion modal", async () => {
    vi.mocked(getCalendar).mockResolvedValue(mockCalendarData);
    vi.mocked(getTeam).mockResolvedValue(mockTeam);

    renderCalendars({ id: ["team-123"] });
    const user = userEvent.setup();
    await screen.findByText("Mock Team's Schedule");
    const findTimeBtn = screen.getByRole("button", { name: /find meeting time/i });
    await user.click(findTimeBtn);
    expect(screen.getByTestId("mock-team-suggestion")).toBeInTheDocument();
    const closeBtn = screen.getByRole("button", { name: /close modal/i });
    await user.click(closeBtn);
    await waitFor(() => {
      expect(screen.queryByTestId("mock-team-suggestion")).not.toBeInTheDocument();
    });
  });
});