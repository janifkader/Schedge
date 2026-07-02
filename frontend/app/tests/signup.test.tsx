import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Register from "../(public)/signup/page";
import { signup } from "@/api/api";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/api/api", () => ({
  signup: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
  pushMock.mockReset();
});

describe("Register Component", () => {
  it("renders all registration form inputs and labels", () => {
    render(<Register />);

    expect(screen.getByRole("heading", { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("submits the register form successfully and handles +1 country code formatting", async () => {
    vi.mocked(signup).mockResolvedValue({} as any);

    render(<Register />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/full name/i), "Test User");
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/phone number/i), "1234567890");
    await user.type(screen.getByLabelText(/^password/i), "12345678");
    await user.type(screen.getByLabelText(/confirm password/i), "12345678");

    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(signup).toHaveBeenCalledWith(
      "Test User",
      "test@example.com",
      "12345678",
      "+11234567890",
    );
    expect(pushMock).toHaveBeenCalledWith("/home");
  });

  it("shows an error message when passwords do not match without hitting the API", async () => {
    render(<Register />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/full name/i), "Test User");
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/phone number/i), "1234567890");
    await user.type(screen.getByLabelText(/^password/i), "12345678");
    await user.type(screen.getByLabelText(/confirm password/i), "different_pass");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByText(/passwords don't match/i)).toBeInTheDocument();
    expect(signup).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows an error message when backend validation fails", async () => {
    vi.mocked(signup).mockRejectedValue(
      new Error("An account with this email already exists"),
    );

    render(<Register />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/full name/i), "Test User");
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/phone number/i), "1234567890");
    await user.type(screen.getByLabelText(/^password/i), "12345678");
    await user.type(screen.getByLabelText(/confirm password/i), "12345678");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(
      await screen.findByText(/An account with this email already exists/i),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});