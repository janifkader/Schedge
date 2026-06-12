"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  styled,
} from "@mui/material";
import { getTeamSuggestions } from "@/api/api";

const ConfirmButton = styled(Button)({
  backgroundColor: "#82181a",
  color: "#FFFFFF",
  "&:hover": { backgroundColor: "#631214" },
});

const CancelButton = styled(Button)({
  color: "#82181a",
  borderColor: "#82181a",
  "&:hover": { borderColor: "#631214", color: "#631214" },
});

type Suggestion = {
  start_time: string;
  end_time: string;
  available_members: string[];
  busy_members: { name: string; conflict: string }[];
  disruption_score: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  teamId: string;
  selectedDate: Date;
  totalMembers: number;
};

export default function TeamSuggestion({
  open,
  onClose,
  teamId,
  selectedDate,
  totalMembers,
}: Props) {
  const [duration, setDuration] = useState(60);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const formatTime = (utcString: string) =>
    new Date(utcString).toLocaleTimeString("en-CA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await getTeamSuggestions(
        teamId,
        selectedDate.toISOString(),
        duration
      );
      setSuggestions(res.suggestions || []);
      setSearched(true);
    } catch (err) {
      console.error("Failed to get team suggestions", err);
    } finally {
      setLoading(false);
    }
  };

  const availabilityColor = (available: number, total: number) => {
    const ratio = available / total;
    if (ratio === 1) return "bg-red-100 border-red-300 text-red-800";
    if (ratio >= 0.5) return "bg-amber-100 border-amber-300 text-amber-800";
    return "bg-red-100 border-red-300 text-red-800";
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle className="bg-zinc-50 border-b border-zinc-200 font-bold text-zinc-800">
        Find Team Meeting Time
      </DialogTitle>

      <DialogContent className="bg-white pt-4">
        <div className="flex flex-col gap-4 pt-2">

          {/* Date display */}
          <div className="text-sm text-zinc-500">
            Finding slots for{" "}
            <span className="font-semibold text-zinc-800">
              {selectedDate.toLocaleDateString("en-CA", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          {/* Duration picker */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-zinc-700">Duration:</label>
            <div className="flex gap-2">
              {[30, 60, 90, 120].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`text-xs px-3 py-1.5 cursor-pointer rounded-full border transition-colors ${
                    duration === d
                      ? "bg-red-900 text-white border-red-900"
                      : "bg-white text-zinc-600 border-zinc-300 hover:border-red-900"
                  }`}
                >
                  {d < 60 ? `${d}m` : `${d / 60}h`}
                </button>
              ))}
            </div>
          </div>

          {/* Search button */}
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="w-full bg-red-900 cursor-pointer hover:bg-red-800 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors"
          >
            {loading ? "Finding slots..." : "Find Available Slots"}
          </button>

          {/* Results */}
          {searched && suggestions.length === 0 && (
            <p className="text-center text-zinc-400 text-sm py-4">
              No slots found where any members are available.
            </p>
          )}

          {suggestions.map((s, i) => (
            <div
              key={i}
              className={`border rounded-lg p-3 ${availabilityColor(
                s.available_members.length,
                totalMembers
              )}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">
                  {formatTime(s.start_time)} – {formatTime(s.end_time)}
                </span>
                <span className="text-xs font-medium">
                  {s.available_members.length}/{totalMembers} available
                </span>
              </div>

              {s.available_members.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {s.available_members.map((name) => (
                    <span
                      key={name}
                      className="text-xs bg-white/60 px-2 py-0.5 rounded-full"
                    >
                      ✓ {name}
                    </span>
                  ))}
                </div>
              )}

              {s.busy_members.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  {s.busy_members.map((m) => (
                    <span key={m.name} className="text-xs opacity-70">
                      ✗ {m.name} — {m.conflict}
                    </span>
                  ))}
                </div>
              )}

              {s.disruption_score > 0 && (
                <p className="text-xs mt-1 opacity-60">
                  Disruption score: {s.disruption_score}
                </p>
              )}
            </div>
          ))}
        </div>
      </DialogContent>

      <DialogActions className="bg-zinc-50 border-t border-zinc-200 px-6 py-3">
        <CancelButton variant="outlined" onClick={onClose}>
          Close
        </CancelButton>
      </DialogActions>
    </Dialog>
  );
}