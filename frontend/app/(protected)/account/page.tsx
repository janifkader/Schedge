"use client";

import { useState, useEffect } from "react";
import { TextField, Button, styled, Divider } from "@mui/material";
import { getUser, updateUser, uploadAvatar, changePassword } from "@/api/api";
import Link from "next/link";
import Image from "next/image";

const SaveButton = styled(Button)({
  backgroundColor: "#82181a",
  color: "#FFFFFF",
  "&:hover": { backgroundColor: "#631214" },
});

const OutlineButton = styled(Button)({
  color: "#82181a",
  borderColor: "#82181a",
  "&:hover": { borderColor: "#631214", color: "#631214" },
});

export default function AccountSettings() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [avatar, setAvatar] = useState<string>("");
  const [avatarLoading, setAvatarLoading] = useState(false);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await getUser();
        setName(user.username || "");
        setEmail(user.email || "");
        setPhone((user.phone || "").replace(/^\+1/, ""));
        setAvatar(user.avatar_url || "");
      } catch (err) {
        console.error("Failed to load user", err);
      }
    }
    loadUser();
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError("");
    setProfileSuccess("");
    try {
      const formattedPhone = phone ? `+1${phone}` : "";
      await updateUser(name, formattedPhone);
      setProfileSuccess("Profile updated successfully.");
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 p-8 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-zinc-900 mb-8">Account Settings</h1>
        <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-bold text-zinc-800 mb-4">Profile Picture</h2>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-red-950  flex items-center justify-center">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-2xl font-bold">
                {getInitials(name ?? "")}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setAvatarLoading(true);
                  try {
                    const res = await uploadAvatar(file);
                    setAvatar(res.avatar_url);
                  } catch (err) {
                    console.error("Avatar upload failed", err);
                  } finally {
                    setAvatarLoading(false);
                  }
                }}
              />
              <span className="inline-block bg-red-900 hover:bg-red-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                {avatarLoading ? "Uploading..." : "Change Photo"}
              </span>
            </label>
            <p className="text-xs text-zinc-400">JPG, PNG or GIF — max 5MB</p>
          </div>
        </div>
      </div>
        {/* Profile Section */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-800 mb-4">Profile Information</h2>
          <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
            <TextField
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="Email"
              value={email}
              fullWidth
              size="small"
              disabled
              helperText="Email cannot be changed"
            />
            <TextField
              label="Phone Number"
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setPhone(val);
              }}
              fullWidth
              size="small"
              slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 10 }}}
            />
            {profileError && <p className="text-red-700 text-sm">{profileError}</p>}
            {profileSuccess && <p className="text-green-700 text-sm">{profileSuccess}</p>}
            <div className="flex justify-end">
              <SaveButton type="submit" variant="contained" disabled={profileLoading}>
                {profileLoading ? "Saving..." : "Save Changes"}
              </SaveButton>
            </div>
          </form>
        </div>

        {/* Password Section */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-800 mb-4">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
            <TextField
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              size="small"
            />
            {passwordError && <p className="text-red-700 text-sm">{passwordError}</p>}
            {passwordSuccess && <p className="text-green-700 text-sm">{passwordSuccess}</p>}
            <div className="flex justify-end">
              <SaveButton type="submit" variant="contained" disabled={passwordLoading}>
                {passwordLoading ? "Changing..." : "Change Password"}
              </SaveButton>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}