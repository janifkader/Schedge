"use client";

import React, { useState, useEffect } from "react";
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { getUsers, createTeam, getTeams } from '@/api/api';
import { useRouter } from "next/navigation";

interface User {
  email: string;
  name: string;
}

interface Team {
  team_id: string;
  team_name: string;
  leader_email: string;
  members: User[];
}

export default function TeamsPage() {
  // State management
  const [teams, setTeams] = useState<Team[]>([]);
  const [name, setName] = useState("");
  const [member, setMember] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState<string>("");
  const [userPage, setUserPage] = useState(1);
  const [totalUserPages, setTotalUserPages] = useState(1);
  const [searchFocused, setSearchFocused] = useState(false);
  const router = useRouter();



// 2. Fetch effect that fires whenever the search query or page increments
useEffect(() => {
  async function loadUsers() {
    try {
      const res = await getUsers(userPage, 10, userSearch)
      if (res && res.users) {
        setUsers(res.users || []);
        setTotalUserPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error("Could not load user list", err);
    }
  }
  const delay = setTimeout(() => { loadUsers(); }, 300);
  return () => clearTimeout(delay);
}, [userSearch, userPage]);

  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await getTeams();
        console.log("GETTING");
        console.log(res);
        if (res && res.teams){
          console.log("GOT!");
          console.log(res);
          setTeams(res.teams || []);
        }
      } catch (err: any) {
        setError(err.message || "An error occurred fetching teams.");
      } finally {
        setLoading(false);
      }
    }
    fetchTeams();
  }, []);

  const addMember = (user: User) => {
    if (members.find((m) => m.email === user.email)) return;
    setMembers((prev) => [...prev, user]);
    setUserSearch("");
    setUserPage(1);
    setUsers([]);
  };

  const removeMember = (email: string) => {
    setMembers((prev) => prev.filter((m) => m.email !== email));
  };

  // Handle new team submission
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
    (u) => !members.find((m) => m.email === u.email)
  );

  return (
    <div className="min-h-screen text-gray-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Create Team Form */}
        <div className="md:col-span-1 bg-gray-300 p-6 rounded-xl border border-gray-700 h-fit">
          <h2 className="text-xl font-bold mb-4 text-black">Create a New Team</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Team Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-white border border-white-700 rounded-lg px-3 py-2 text-black focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Members Section */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">Team Members</label>

              {/* Added members chips */}
              {members.length > 0 && (
                <div className="flex flex-col gap-1 mb-2">
                  {members.map((m) => (
                    <div
                      key={m.email}
                      className="flex items-center justify-between bg-white border border-gray-300 rounded-lg px-3 py-2 text-black text-sm"
                    >
                      <span className="font-medium">{m.name}</span>
                      <button
                        type="button"
                        onClick={() => removeMember(m.email)}
                        className="text-gray-400 hover:text-red-700 ml-2 text-lg leading-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-red-900 transition-colors"
                />

                {/* Dropdown results */}
                {searchFocused && userSearch && filteredUsers.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-lg overflow-hidden">
                    {filteredUsers.map((user) => (
                      <button
                        key={user.email}
                        type="button"
                        onMouseDown={() => addMember(user)}
                        className="w-full text-left px-3 py-2 text-sm text-black hover:bg-red-50 hover:text-red-900 transition-colors"
                      >
                        <span className="font-medium">{user.name}</span>
                        <span className="text-gray-400 text-xs ml-2">{user.email}</span>
                      </button>
                    ))}

                    {/* Pagination inside dropdown */}
                    {totalUserPages > 1 && (
                      <div className="flex items-center justify-between border-t border-gray-200 px-3 py-1.5 bg-gray-50">
                        <button
                          type="button"
                          onClick={() => setUserPage((p) => Math.max(p - 1, 1))}
                          disabled={userPage === 1}
                          className="text-xs text-gray-600 disabled:opacity-30"
                        >
                          Previous
                        </button>
                        <span className="text-xs text-gray-500">{userPage} / {totalUserPages}</span>
                        <button
                          type="button"
                          onClick={() => setUserPage((p) => Math.min(p + 1, totalUserPages))}
                          disabled={userPage === totalUserPages}
                          className="text-xs text-gray-600 disabled:opacity-30"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* No results */}
                {searchFocused && userSearch && filteredUsers.length === 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-lg px-3 py-2 text-sm text-gray-400">
                    No users found.
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="w-full bg-red-900 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-400 font-medium text-white py-2 px-4 rounded-lg transition-colors cursor-pointer"
            >
              {submitting ? "Creating..." : "Create Team"}
            </button>
          </form>
        </div>

        {/* Right Column: Teams Directory */}
        <div className="md:col-span-2 space-y-4">
          <h1 className="text-2xl font-bold text-black mb-2">Teams Directory</h1>
          {loading ? (
            <div className="text-gray-400 animate-pulse py-4">Loading existing teams...</div>
          ) : teams.length === 0 ? (
            <div className="bg-red-900 border border-gray-700 p-8 rounded-xl text-center text-white">
              No teams found. Use the form on the left to start one!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teams.map((team) => (
                <div
                  key={team.team_id}
                  onClick={() => router.push(`/calendars/${team.team_id}`)}
                  className="bg-red-900 border border-gray-700 p-5 rounded-xl hover:border-gray-600 hover:bg-red-700 hover:cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1 truncate">
                      {team.team_name}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {!team.members || team.members.length === 0 ? (
                        <span className="text-xs text-red-200">No members yet.</span>
                      ) : (
                        team.members.map((member) => (
                          member.email === team.leader_email ? (
                            <span
                              key={member.email}
                              className="text-xs bg-white text-black px-2 py-1 rounded-full"
                            >
                              Leader: {member.name}
                            </span>
                          ) : (
                            <span
                              key={member.email}
                              className="text-xs bg-red-800 text-white px-2 py-1 rounded-full"
                            >
                              {member.name}
                            </span>
                          )
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}