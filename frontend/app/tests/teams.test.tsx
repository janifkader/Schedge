import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import Teams from "../(protected)/teams/page";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUsers, getUser, createTeam, getTeams, addMember } from "@/api/api";
import type { TeamsResponse, UsersResponse, UserResponse } from "@/app/types/types";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/api/api", () => ({
  getUsers: vi.fn(),
  getUser: vi.fn(),
  createTeam: vi.fn(),
  getTeams: vi.fn(),
  addMember: vi.fn(),
}));

const mockLeaderEmail = "leader@schedge.com";
const mockUser = { username: "Leader", email: mockLeaderEmail, phone: "", avatar_url: null } as UserResponse;
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
]} as TeamsResponse;

const mockSearchUsers = {
  users: [
    { email: "search1@schedge.com", name: "Search One", avatar_url: "" },
    { email: "search2@schedge.com", name: "Search Two", avatar_url: "" },
    { email: "search3@schedge.com", name: "Person Three", avatar_url: "" },
  ],
  totalPages: 1,
} as UsersResponse;

beforeEach(() => {
  vi.resetAllMocks();
  pushMock.mockReset();
    
  vi.mocked(getTeams).mockResolvedValue(mockTeams);
  vi.mocked(getUser).mockResolvedValue(mockUser);
});

describe("Teams Component", () => {
  it("renders the directory state and sidebar form with fetched values", async () => {
    render(<Teams />);
    
    expect(screen.getByRole("heading", { name: /^teams$/i })).toBeInTheDocument();

    expect(await screen.findByText("Team 1")).toBeInTheDocument();
    expect(screen.getByText("Leader User")).toBeInTheDocument();
    expect(screen.getByText("Member One")).toBeInTheDocument();
  });

  it("handles sidebar user lookups with debouncing and adds a member locally", async () => {
    vi.mocked(getUsers).mockResolvedValue(mockSearchUsers);

    render(<Teams />);
    const user = userEvent.setup();

    await screen.findByText("Team 1");

    const memberSearchInput = screen.getByPlaceholderText(/search users\.\.\./i);
    await user.type(memberSearchInput, "Search");

    const dropdownBtn = await screen.findByRole("button", { name: /search one.*search1@schedge\.com/i });
    const dropdownBtnTwo = await screen.findByRole("button", { name: /search two.*search2@schedge\.com/i });
    
    expect(dropdownBtn).toBeInTheDocument();
    expect(dropdownBtnTwo).toBeInTheDocument();

    await user.click(dropdownBtn);
    expect(screen.getByText("Search One")).toBeInTheDocument();
  });

  it("submits the create team form and prepends the result to the UI list", async () => {
    const newTeam = {
      team_id: "team-2",
      team_name: "Team 2",
      leader_email: mockLeaderEmail,
      members: [],
    };
    vi.mocked(createTeam).mockResolvedValue({ team: newTeam });

    render(<Teams />);
    const user = userEvent.setup();
    await screen.findByText("Team 1");
    
    const textInputs = screen.getAllByRole("textbox");
    const teamNameInput = textInputs[0];
    
    await user.type(teamNameInput, "Team 2");
    await user.click(screen.getByRole("button", { name: /create team/i }));

    expect(createTeam).toHaveBeenCalledWith("Team 2", []);
    expect(await screen.findByText("Team 2")).toBeInTheDocument();
  });

  it("navigates to specific calendars on team card click", async () => {
    render(<Teams />);
    
    const teamCard = await screen.findByText("Team 1");
    fireEvent.click(teamCard.closest(".group")!);

    expect(pushMock).toHaveBeenCalledWith("/calendars/team-1");
  });

  it("opens modal overlay and appends multiple members on sub-actions sequentially", async () => {
    vi.mocked(getUsers).mockResolvedValue(mockSearchUsers);
    vi.mocked(addMember).mockResolvedValue({} as never);

    render(<Teams />);
    const user = userEvent.setup();

    const addMemberTrigger = await screen.findByRole("button", { name: /\+ member/i });
    await user.click(addMemberTrigger);

    const modalSearch = await screen.findByPlaceholderText(/search by name or email\.\.\./i);
    await user.type(modalSearch, "Three");

    const selection = await screen.findByRole("button", { name: /person three.*search3@schedge\.com/i });
    await user.click(selection);

    await user.click(screen.getByRole("button", { name: /^add member$/i }));
    expect(addMember).toHaveBeenCalledWith("team-1", "search3@schedge.com");
  });
});