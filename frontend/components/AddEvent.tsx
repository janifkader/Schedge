"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  styled,
} from "@mui/material";

type AddEventDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (event: NewEvent) => Promise<void>;
  selectedDate: Date;
};

export type NewEvent = {
  title: string;
  date: string;
  weight: string;
  cycle: string;
  span: string;
};

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

const WEIGHT_OPTIONS = ["Low", "Medium", "High"];
const CYCLE_OPTIONS = ["None", "Daily", "Weekly", "Monthly", "Yearly"];
const SPAN_OPTIONS = ["30 min", "1 hour", "2 hours", "Half Day", "Full Day"];

export default function AddEventDialog({
  open,
  onClose,
  onSubmit,
  selectedDate,
}: AddEventDialogProps) {
  const toLocalISO = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  const [form, setForm] = useState<NewEvent>({
    title: "",
    date: toLocalISO(selectedDate),
    weight: "Medium",
    cycle: "None",
    span: "1 hour",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field: keyof NewEvent) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError("Failed to create event. Please try again.");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle className="bg-zinc-50 border-b border-zinc-200 font-bold text-zinc-800">
        Add Event
      </DialogTitle>

      <DialogContent className="bg-white space-y-4 pt-4">
        <div className="flex flex-col gap-4 pt-2">
          <TextField
            label="Title"
            value={form.title}
            onChange={handleChange("title")}
            fullWidth
            error={!!error && !form.title.trim()}
            helperText={!form.title.trim() ? error : ""}
          />

          <TextField
            label="Date & Time"
            type="datetime-local"
            value={form.date}
            onChange={handleChange("date")}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            label="Weight"
            value={form.weight}
            onChange={handleChange("weight")}
            select
            fullWidth
          >
            {WEIGHT_OPTIONS.map((o) => (
              <MenuItem key={o} value={o}>{o}</MenuItem>
            ))}
          </TextField>

          <TextField
            label="Cycle"
            value={form.cycle}
            onChange={handleChange("cycle")}
            select
            fullWidth
          >
            {CYCLE_OPTIONS.map((o) => (
              <MenuItem key={o} value={o}>{o}</MenuItem>
            ))}
          </TextField>

          <TextField
            label="Span"
            value={form.span}
            onChange={handleChange("span")}
            select
            fullWidth
          >
            {SPAN_OPTIONS.map((o) => (
              <MenuItem key={o} value={o}>{o}</MenuItem>
            ))}
          </TextField>

          {error && form.title.trim() && (
            <p className="text-red-700 text-sm">{error}</p>
          )}
        </div>
      </DialogContent>

      <DialogActions className="bg-zinc-50 border-t border-zinc-200 px-6 py-3">
        <CancelButton variant="outlined" onClick={onClose} disabled={loading}>
          Cancel
        </CancelButton>
        <ConfirmButton variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? "Adding..." : "Add Event"}
        </ConfirmButton>
      </DialogActions>
    </Dialog>
  );
}