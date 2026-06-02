"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { getUserProfile } from "@/api/api";
import { useRouter } from "next/navigation";

interface Team {
  team_id: string;
  team_name: string;
}

interface UserProfile {
  name: string;
  email: string;
  avatar_url: string | null;
  teams: Team[];
}

export default function ProfilePage({ params }: { params: Promise<{ email: string }> }) {
  const { email } = use(params);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getUserProfile(decodeURIComponent(email));
        setProfile(data);
      } catch (err: any) {
        setError(err.message || "User not found.");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [email]);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-200 border-t-red-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">{error || "User not found."}</p>
          <button onClick={() => router.back()} className="text-red-900 hover:underline cursor-pointer text-sm">
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-start justify-center p-8">
      <div className="w-full max-w-sm">

        {/* Profile Card */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-8 flex flex-col items-center text-center gap-4">
          
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-200 flex items-center justify-center">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-zinc-500 text-3xl font-bold">
                {getInitials(profile.name)}
              </span>
            )}
          </div>

          {/* Name & Email */}
          <div>
            <h1 className="text-xl font-bold text-zinc-900">{profile.name}</h1>
            <p className="text-sm text-zinc-500">{profile.email}</p>
          </div>

          {/* Divider */}
          {profile.teams.length > 0 && (
            <div className="w-full border-t border-zinc-100 pt-4">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Teams</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {profile.teams.map((team) => (
                  <span
                    key={team.team_id}
                    className="text-xs bg-red-50 text-red-900 border border-red-200 px-3 py-1 rounded-full"
                  >
                    {team.team_name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Back button */}
        <div className="mt-4 text-center">
          <button onClick={() => router.back()} className="text-sm text-zinc-500 cursor-pointer hover:text-zinc-700">
            ← Go back
          </button>
        </div>

      </div>
    </div>
  );
}