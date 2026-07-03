import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Signin from "../(public)/signin/page";
import { signin, resendVerificationEmail } from "@/api/api";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/api/api", () => ({
  signin: vi.fn(),
  resendVerificationEmail: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
  pushMock.mockReset();
});

describe("Signin Component", () => {
  it("renders all signin form inputs and labels", () => {
    render(<Signin />);

    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
  });

  it("submits the signin form successfully", async () => {
    vi.mocked(signin).mockResolvedValue({} as never);

    render(<Signin />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password/i), "12345678");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(signin).toHaveBeenCalledWith("test@example.com", "12345678");
    expect(pushMock).toHaveBeenCalledWith("/home");
  });

  it("shows an error message when password is incorrect", async () => {
    vi.mocked(signin).mockRejectedValue(new Error("Password is incorrect"));

    render(<Signin />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password/i), "wrong_password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/password is incorrect/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows an error message when sign in fails because account does not exist", async () => {
    vi.mocked(signin).mockRejectedValue(
      new Error("An account with this email does not exist"),
    );

    render(<Signin />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email address/i), "unknown@example.com");
    await user.type(screen.getByLabelText(/^password/i), "12345678");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText(/An account with this email does not exist/i),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

it("displays verification callout and triggers resend flow cleanly", async () => {
    vi.mocked(signin).mockRejectedValue(new Error("Please verify your account."));
    vi.mocked(resendVerificationEmail).mockResolvedValue({} as never);

    const { container } = render(<Signin />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email address/i), "unverified@example.com");
    await user.type(screen.getByLabelText(/^password/i), "12345678");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    
    expect(await screen.findByText(/please verify your account\./i)).toBeInTheDocument();
    
    const resendBtn = container.querySelector("button[type='button']");
    expect(resendBtn).toBeInTheDocument();
    fireEvent.click(resendBtn!);
    
    await waitFor(() => {
      expect(resendVerificationEmail).toHaveBeenCalledWith("unverified@example.com");
    });
    
    expect(await screen.findByText(/verification email resent successfully\./i)).toBeInTheDocument();
  });
});