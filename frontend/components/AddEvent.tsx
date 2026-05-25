"use client";

import { useState, useEffect } from "react";
import NumberField from './NumberField';
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
  existingEvent?: {
    event_id: string;
    title: string;
    start_time: string;
    end_time: string;
    weight: number;
    cycle: string;
    span: string;
  };
};

export type NewEvent = {
  title: string;
  start_time: string;
  end_time: string;
  weight: number;
  cycle: string;
  span: string;
  applyToAll?: boolean;
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

const CYCLE_OPTIONS = ["None", "Daily", "Weekly", "Monthly", "Yearly"];

export default function AddEventDialog({
  open,
  onClose,
  onSubmit,
  selectedDate,
  existingEvent,
}: AddEventDialogProps) {
  const isEditing = !!existingEvent;
  const toLocalISO = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  const [form, setForm] = useState<NewEvent>(() =>
    existingEvent
      ? {
          title: existingEvent.title,
          start_time: toLocalISO(new Date(existingEvent.start_time)),
          end_time: toLocalISO(new Date(existingEvent.end_time)),
          weight: existingEvent.weight,
          cycle: existingEvent.cycle,
          span: existingEvent.span,
        }
      : {
          title: "",
          start_time: toLocalISO(selectedDate),
          end_time: toLocalISO(selectedDate),
          weight: 1,
          cycle: "None",
          span: "None",
        }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [applyToAll, setApplyToAll] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        existingEvent
          ? {
              title: existingEvent.title,
              start_time: toLocalISO(new Date(existingEvent.start_time)),
              end_time: toLocalISO(new Date(existingEvent.end_time)),
              weight: existingEvent.weight,
              cycle: existingEvent.cycle,
              span: existingEvent.span,
            }
          : {
              title: "",
              start_time: toLocalISO(selectedDate),
              end_time: toLocalISO(selectedDate),
              weight: 1,
              cycle: "None",
              span: "None",
            }
      );
      setError("");
      setApplyToAll(false);
    }
  }, [open]);

  const handleChange = (field: keyof NewEvent) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      // Contextual sync: Clear out span requirements if they toggle back to None
      if (field === "cycle" && value === "None") {
        updated.span = "None";
      } else if (field === "cycle" && prev.span === "None") {
        updated.span = ""; // Clear string placeholder so user can type cleanly
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (form.cycle !== "None") {
      const spanRegex = /^\d+\s(Weeks|Months|Years)$/;
      if (!spanRegex.test(form.span)) {
        setError("Span must match format: e.g. '3 Months'");
        return;
      }
    }
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onSubmit({ ...form, applyToAll });
      onClose();
    } 
    catch (err: any) {
      if (err.conflicts) {
        setError(`Conflicts with: ${err.conflicts.map((c: any) => `${c.title} (weight ${c.weight})`).join(", ")}`);
      } else {
        setError("Failed to create event. Please try again.");
      }
      console.log(err);
    } 
    finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle className="bg-zinc-50 border-b border-zinc-200 font-bold text-zinc-800">
        {isEditing ? "Edit Event" : "Add Event"}
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
            label="Start Time"
            type="datetime-local"
            value={form.start_time}
            onChange={handleChange("start_time")}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            label="End Time"
            type="datetime-local"
            value={form.end_time}
            onChange={handleChange("end_time")}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />

          {/* Cleanly tracks weight through your custom NumberField component hooks */}
          <NumberField 
            label="Weight" 
            min={1} 
            max={10} 
            value={form.weight}
            onValueChange={(val: number | null) => setForm((prev) => ({ ...prev, weight: val ?? 1 }))}
          />

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

          {/* Retained your flexible regex input tracking field logic */}
          <TextField
            label="Span"
            variant="outlined"
            fullWidth
            required={form.cycle !== 'None'}
            disabled={form.cycle === 'None'}
            value={form.span}
            onChange={handleChange("span")}
            placeholder="e.g., 2 Weeks, 6 Months, 1 Years"
            error={!!error && form.cycle !== 'None' && !/^\d+\s(Weeks|Months|Years)$/.test(form.span)}
            helperText={
              form.cycle === 'None'
                ? "Select a cycle first"
                : "Format: [Number] [Weeks/Months/Years] (e.g., '3 Months')"
            }
            inputProps={{
              pattern: "^\\d+\\s(Weeks|Months|Years)$",
              title: "Please match the format exactly (e.g., '12 Weeks')",
            }}
          />

          {isEditing && existingEvent?.cycle !== "None" && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="applyToAll"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                className="w-4 h-4 accent-red-900"
              />
              <label htmlFor="applyToAll" className="text-sm text-zinc-700">
                Apply changes to all future occurrences
              </label>
            </div>
          )}

          {error && form.title.trim() && form.cycle === 'None' && (
            <p className="text-red-700 text-sm">{error}</p>
          )}
        </div>
      </DialogContent>

      <DialogActions className="bg-zinc-50 border-t border-zinc-200 px-6 py-3">
        <CancelButton variant="outlined" onClick={onClose} disabled={loading}>
          Cancel
        </CancelButton>
        <ConfirmButton variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? (isEditing ? "Saving..." : "Adding...") : (isEditing ? "Save Changes" : "Add Event")}
        </ConfirmButton>
      </DialogActions>
    </Dialog>
  );
}