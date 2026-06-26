"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  styled,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/Avatar";
import { getUsers, getUser, createTeam, getTeams, addMember } from '@/api/api';
import { useRouter } from "next/navigation";

interface User {
  email: string;
  name: string;
  avatar_url: string;
}

interface Team {
  team_id: string;
  team_name: string;
  leader_email: string;
  members: User[];
}

const ConfirmButton = styled(Button)({
  backgroundColor: "#82181a",
  color: "#FFFFFF",
  padding: "8px 24px",
  borderRadius: "8px",
  textTransform: "none",
  fontWeight: 600,
  "&:hover": { backgroundColor: "#631214" },
});

const CancelButton = styled(Button)({
  color: "#64748b",
  borderColor: "#e2e8f0",
  textTransform: "none",
  "&:hover": { borderColor: "#cbd5e1", backgroundColor: "#f8fafc" },
});

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [name, setName] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [dialogUsers, setDialogUsers] = useState<User[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [newMembers, setNewMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [dialogSearch, setDialogSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [dialogPage, setDialogPage] = useState(1);
  const [totalUserPages, setTotalUserPages] = useState(1);
  const [totalDialogPages, setTotalDialogPages] = useState(1);
  const [searchFocused, setSearchFocused] = useState(false);
  const [dialogSearchFocused, setDialogSearchFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadDialogUsers() {
      try {
        const res = await getUsers(dialogPage, 10, dialogSearch);
        if (res?.users) {
          setDialogUsers(res.users);
          setTotalDialogPages(res.totalPages || 1);
        }
      } catch (err) {
        console.error("Could not load user list", err);
      }
    }
    const delay = setTimeout(loadDialogUsers, 300);
    return () => clearTimeout(delay);
  }, [dialogSearch, dialogPage]);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await getUsers(userPage, 10, userSearch);
        if (res?.users) {
          setUsers(res.users);
          setTotalUserPages(res.totalPages || 1);
        }
      } catch (err) {
        console.error("Could not load user list", err);
      }
    }
    const delay = setTimeout(loadUsers, 300);
    return () => clearTimeout(delay);
  }, [userSearch, userPage]);

  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await getTeams();
        if (res?.teams) setTeams(res.teams);
        const dat = await getUser();
        if (dat?.email) setUserEmail(dat.email); 
      } catch (err: any) {
        setError(err.message || "An error occurred fetching teams.");
      } finally {
        setLoading(false);
      }
    }
    fetchTeams();
  }, []);

  const addNewMember = (user: User) => {
    if (newMembers.find((m) => m.email === user.email)) return;
    setNewMembers((prev) => [...prev, user]);
    setDialogSearch("");
    setDialogPage(1);
    setDialogUsers([]);
  };

  const removeNewMember = (email: string) =>
    setNewMembers((prev) => prev.filter((m) => m.email !== email));

  const handleAddMembers = async () => {
    if (!selectedTeam || newMembers.length === 0) return;
    setAdding(true);
    try {
      await Promise.all(
        newMembers.map((m) => addMember(selectedTeam.team_id, m.email))
      );
      // Update the team in state with new members
      setTeams((prev) =>
        prev.map((t) =>
          t.team_id === selectedTeam.team_id
            ? { ...t, members: [...t.members, ...newMembers] }
            : t
        )
      );
      setNewMembers([]);
      setOpen(false);
    } catch (err: any) {
      setError(err.message || "Could not add members.");
    } finally {
      setAdding(false);
    }
  };

  const addMemberLocally = (user: User) => {
    if (members.find((m) => m.email === user.email)) return;
    setMembers((prev) => [...prev, user]);
    setUserSearch("");
    setUserPage(1);
    setUsers([]);
  };

  const removeMember = (email: string) =>
    setMembers((prev) => prev.filter((m) => m.email !== email));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await createTeam(name, members);
      setTeams((prev) => [res.team, ...prev]);
      setMembers([]);
      setName("");
    } catch (err: any) {
      setError(err.message || "Could not create team.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(
    (u) => !newMembers.find((m) => m.email === u.email)
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20">
      {/* Add Member Dialog - Enhanced Styling */}
      <Dialog 
        open={open} 
        onClose={() => { setOpen(false); setNewMembers([]); setDialogSearch(""); setDialogPage(1); }} 
        fullWidth 
        maxWidth="xs"
        sx={{ '& .MuiDialog-paper': { overflow: 'visible', }, '& .MuiDialogContent-root': { overflow: 'visible', },}}
      >
        <DialogTitle className="border-b border-slate-100 pb-4">
          <span className="text-lg font-bold text-slate-800">Add Team Member</span>
          <p className="text-sm font-normal text-slate-500">Adding to {selectedTeam?.team_name}</p>
        </DialogTitle>

        <DialogContent className="mt-4">
          <div className="space-y-4">
            {newMembers.map((m) => (
              <div key={m.email} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3 animate-in fade-in zoom-in duration-200">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{m.name}</span>
                  <span className="text-xs text-slate-500">{m.email}</span>
                </div>
                <button onClick={() => removeNewMember(m.email)} className="h-8 w-8 rounded-full hover:bg-red-50 hover:cursor-pointer text-slate-400 hover:text-red-600 transition-colors">×</button>
              </div>
            ))}

            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={dialogSearch}
                disabled={newMembers.length >= 1}
                onChange={(e) => { setDialogSearch(e.target.value); setDialogPage(1); }}
                onFocus={() => setDialogSearchFocused(true)}
                onBlur={() => setTimeout(() => setDialogSearchFocused(false), 150)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-900/20 focus:border-red-900 outline-none transition-all"
              />
              {/* Dropdown styling improved */}
              {dialogSearchFocused && dialogSearch && (
                <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl mt-2 shadow-xl max-h-60 overflow-y-auto">
                  {dialogUsers.length > 0 ? (
                    dialogUsers.map((user) => (
                      <button key={user.email} onMouseDown={() => addNewMember(user)} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex flex-col border-b border-slate-50 last:border-0">
                        <span className="text-sm font-medium text-slate-700">{user.name}</span>
                        <span className="text-xs text-slate-400">{user.email}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-slate-400">No results found</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
        <DialogActions className="p-6 pt-2">
          <CancelButton onClick={() => setOpen(false)}>Cancel</CancelButton>
          <ConfirmButton onClick={handleAddMembers} disabled={adding || newMembers.length === 0}>
            {adding ? "Adding..." : "Add Member"}
          </ConfirmButton>
        </DialogActions>
      </Dialog>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pt-12">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Teams</h1>
          <p className="text-slate-500 mt-2">Manage your teams.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Sidebar: Create Team */}
          <div className="lg:col-span-4">
            <div className="bg-gray-300 rounded-2xl shadow-sm border border-slate-200 p-8 sticky top-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                Create New Team
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Team Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-red-900 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Members</label>
                  <div className="space-y-2 mb-3">
                    {members.map((m) => (
                      <div key={m.email} className="flex items-center justify-between bg-red-50/50 border border-red-100 rounded-lg px-3 py-2">
                        <span className="text-sm font-medium text-red-900">{m.name}</span>
                        <button type="button" onClick={() => removeMember(m.email)} className="text-red-400 hover:text-red-600">×</button>
                      </div>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-red-900 outline-none transition-all"
                  />
                  {searchFocused && userSearch && users.length > 0 && (
                    <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl mt-2 shadow-xl max-h-60 overflow-y-auto">
                      {users
                        .filter((u) => !members.find((m) => m.email === u.email))
                        .map((user) => (
                          <button
                            key={user.email}
                            type="button"
                            onMouseDown={() => addMemberLocally(user)}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 flex flex-col border-b border-slate-50 last:border-0"
                          >
                            <span className="text-sm font-medium text-slate-700">{user.name}</span>
                            <span className="text-xs text-slate-400">{user.email}</span>
                          </button>
                        ))}
                    </div>
                  )}
                  {searchFocused && userSearch && users.length === 0 && (
                    <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl mt-2 shadow-xl p-4 text-center text-sm text-slate-400">
                      No results found
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="w-full bg-red-900 cursor-pointer hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-slate-200 disabled:opacity-50 disabled:shadow-none"
                >
                  {submitting ? "Processing..." : "Create Team"}
                </button>
              </form>
            </div>
          </div>

          {/* Directory Column */}
          <div className="lg:col-span-8">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-40 bg-slate-200 animate-pulse rounded-2xl"/>)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teams.map((team) => (
                  <div
                    key={team.team_id}
                    onClick={() => router.push(`/calendars/${team.team_id}`)}
                    className="group bg-red-100 border border-slate-200 p-6 rounded-2xl hover:border-red-200 hover:shadow-xl hover:shadow-red-900/5 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="text-slate-300">→</span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-800 mb-4 group-hover:text-red-900 transition-colors">
                      {team.team_name}
                    </h3>

                    <div className="flex flex-wrap gap-2">
                      {team.members?.map((member) => (
                        <Tooltip key={member.email} title={member.email} onClick={(e) => { e.stopPropagation(); router.push(`/profile/${encodeURIComponent(member.email)}`); }}>
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 ${
                            member.email === team.leader_email 
                            ? "bg-red-900 text-white border border-amber-100" 
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}>
                            {member.email === team.leader_email}
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={member.avatar_url} alt={member.name} />
                              <AvatarFallback className="bg-slate-300/50 text-[8px] font-bold uppercase leading-none">
                                {member.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            {member.name}
                          </span>
                        </Tooltip>
                      ))}
                      
                      {team.leader_email === userEmail && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedTeam(team); setOpen(true); }}
                          className="text-[11px] font-bold bg-white border border-dashed border-slate-300 text-slate-400 px-2.5 py-1 rounded-md hover:cursor-pointer hover:border-red-900 hover:text-red-900 transition-all"
                        >
                          + Member
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}