import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import AccountSettings from "../(protected)/account/page";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUser, updateUser, uploadAvatar, changePassword } from "@/api/api";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/api/api", () => ({
  getUser: vi.fn(),
  updateUser: vi.fn(),
  uploadAvatar: vi.fn(),
  changePassword: vi.fn(),
}));

const mockUser = {
  username: "New Name",
  email: "name@example.com",
  phone: "+11234567890",
  avatar_url: "",
};

beforeEach(() => {
  vi.resetAllMocks();
  pushMock.mockReset();
  vi.mocked(getUser).mockResolvedValue(mockUser);
});

describe("Account Settings", () => {
  it("renders all components with fetched user data", async () => {
    render(<AccountSettings />);

    expect(screen.getByRole("heading", { name: /account settings/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /profile information/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toHaveValue("New Name");
    });
    expect(screen.getByLabelText(/email/i)).toHaveValue("name@example.com");
    expect(screen.getByLabelText(/phone number/i)).toHaveValue("1234567890");

    expect(screen.getByRole("heading", { name: /change password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
  });

  it("submits profile information update", async () => {
    vi.mocked(updateUser).mockResolvedValue({} as any);

    render(<AccountSettings />);
    const user = userEvent.setup();

    const nameInput = await screen.findByLabelText(/full name/i);
    const phoneInput = screen.getByLabelText(/phone number/i);

    await user.clear(nameInput);
    await user.type(nameInput, "New Name");
    await user.clear(phoneInput);
    await user.type(phoneInput, "0987654321");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(updateUser).toHaveBeenCalledWith("New Name", "+10987654321");
    expect(await screen.findByText(/profile updated successfully\./i)).toBeInTheDocument();
  });

  it("handles profile update failures gracefully", async () => {
    vi.mocked(updateUser).mockRejectedValue(new Error("Database connection timed out."));

    render(<AccountSettings />);
    const user = userEvent.setup();

    const nameInput = await screen.findByLabelText(/full name/i);
    await user.type(nameInput, " Test");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText(/database connection timed out\./i)).toBeInTheDocument();
  });

  it("submits change password form and clears inputs on success", async () => {
    vi.mocked(changePassword).mockResolvedValue({} as any);

    render(<AccountSettings />);
    const user = userEvent.setup();

    const currentInput = await screen.findByLabelText(/current password/i);
    const newInput = screen.getByLabelText(/^new password$/i);
    const confirmInput = screen.getByLabelText(/confirm new password/i);

    await user.type(currentInput, "12345678");
    await user.type(newInput, "new_password");
    await user.type(confirmInput, "new_password");

    await user.click(screen.getByRole("button", { name: /^change password$/i }));

    expect(changePassword).toHaveBeenCalledWith("12345678", "new_password");
    expect(await screen.findByText(/password changed successfully\./i)).toBeInTheDocument();

    expect(currentInput).toHaveValue("");
    expect(newInput).toHaveValue("");
    expect(confirmInput).toHaveValue("");
  });

  it("intercepts password mismatches before hitting the server API", async () => {
    render(<AccountSettings />);
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText(/current password/i), "12345678");
    await user.type(screen.getByLabelText(/^new password$/i), "new_password");
    await user.type(screen.getByLabelText(/confirm new password/i), "wrong_match");

    await user.click(screen.getByRole("button", { name: /^change password$/i }));

    expect(await screen.findByText(/passwords don't match\./i)).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("triggers avatar photo upload processing when a file is selected", async () => {
    vi.mocked(uploadAvatar).mockResolvedValue({ avatar_url: "https://images.schedge.com/avatar.jpg" });

    const { container } = render(<AccountSettings />);
    const user = userEvent.setup();

    const file = new File(["avatar-bytes"], "avatar.png", { type: "image/png" });
    const hiddenFileInput = container.querySelector("input[type='file']");
  	expect(hiddenFileInput).toBeInTheDocument();

    await user.upload(hiddenFileInput, file);

    expect(uploadAvatar).toHaveBeenCalledWith(file);
    const renderedImg = await screen.findByRole("img", { name: /avatar/i });
    expect(renderedImg).toHaveAttribute("src", "https://images.schedge.com/avatar.jpg");
  });
});