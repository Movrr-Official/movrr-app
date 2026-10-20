import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { localCommunityTime } from "@/lib/communitySchedule";
import type { CommunityRide } from "@/lib/platform/communityPlatform";
export function CommunityFields({ ride }: { ride?: CommunityRide }) {
  const prefix = ride?.id ?? "create";
  const local = ride ? localCommunityTime(ride.scheduled_at) : "";
  return (
    <>
      <input type="hidden" name="originalScheduledAt" value={ride?.scheduled_at ?? ""} />
      <input type="hidden" name="originalLocalTime" value={local} />
      <label htmlFor={`${prefix}-title`}>
        Ride title
        <Input
          id={`${prefix}-title`}
          name="title"
          required
          minLength={3}
          maxLength={200}
          defaultValue={ride?.title}
        />
      </label>
      <label htmlFor={`${prefix}-schedule`}>
        Date and time
        <Input
          id={`${prefix}-schedule`}
          name="scheduledAt"
          type="datetime-local"
          required
          defaultValue={local}
          aria-describedby={`${prefix}-time-help`}
        />
      </label>
      <label>
        Time zone
        <Input
          name="timezone"
          required
          defaultValue="Europe/Amsterdam"
          aria-describedby={`${prefix}-time-help`}
        />
      </label>
      <label>
        When the clock repeats
        <select name="occurrence" className="block rounded border p-2">
          <option value="">Ask me if this time occurs twice</option>
          <option value="first">First occurrence</option>
          <option value="second">Second occurrence</option>
        </select>
      </label>
      <p id={`${prefix}-time-help`} className="text-sm text-muted-foreground">
        Times are saved in the selected time zone. A skipped clock-change time cannot be
        scheduled.
      </p>
      <label>
        Meeting place
        <Input
          name="meetingPoint"
          maxLength={500}
          defaultValue={ride?.meeting_point_name ?? ""}
        />
      </label>
      <label>
        Category
        <select
          name="category"
          defaultValue={ride?.category ?? "social"}
          className="block rounded border p-2"
        >
          {["beginner", "intermediate", "challenging", "social"].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label>
        Maximum participants
        <Input
          name="maxParticipants"
          type="number"
          required
          min={1}
          max={500}
          defaultValue={ride?.max_participants ?? 20}
        />
      </label>
      <label className="md:col-span-2">
        Description
        <Textarea
          name="description"
          maxLength={10000}
          defaultValue={ride?.description ?? ""}
        />
      </label>
    </>
  );
}
