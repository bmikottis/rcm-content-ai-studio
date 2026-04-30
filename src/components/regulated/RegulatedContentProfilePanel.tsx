"use client";

import { useRegulatedContentStore } from "@/stores/regulated-content";
import { cn } from "@/lib/cn";

export const REGULATED_PROFILE_OPTIONS = {
  contentType: [
    { value: "hcp_email", label: "HCP email" },
    { value: "dtc_email", label: "Patient email" },
    { value: "multichannel", label: "Multichannel" },
  ],
  audience: [
    { value: "hcp", label: "HCP" },
    { value: "patient", label: "Patient / consumer" },
    { value: "payer", label: "Payer" },
  ],
  region: [
    { value: "us", label: "United States" },
    { value: "eu_uk", label: "EU / UK" },
    { value: "jp", label: "Japan" },
    { value: "global", label: "Global core" },
  ],
  intent: [
    { value: "educational", label: "Educational" },
    { value: "promotional", label: "Promotional" },
    { value: "reminder", label: "Reminder / adherence" },
  ],
} as const;

function ProfileSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="flex flex-col gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-2.5 py-2">
      <span className="text-[9px] font-bold uppercase tracking-wide text-[var(--text-muted)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full min-w-0 cursor-pointer bg-transparent text-[12px] font-semibold text-[var(--text-primary)] outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function RegulatedContentProfilePanel({
  className,
  hideHeading = false,
}: {
  className?: string;
  /** When nested under another section title (e.g. Content details). */
  hideHeading?: boolean;
}) {
  const profile = useRegulatedContentStore((s) => s.profile);
  const setProfile = useRegulatedContentStore((s) => s.setProfile);

  return (
    <div className={cn("space-y-2", className)}>
      {!hideHeading && (
        <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Content profile</p>
      )}
      <ProfileSelect
        label="Format"
        value={profile.contentType}
        options={[...REGULATED_PROFILE_OPTIONS.contentType]}
        onChange={(v) => setProfile({ contentType: v as typeof profile.contentType })}
      />
      <ProfileSelect
        label="Audience"
        value={profile.audience}
        options={[...REGULATED_PROFILE_OPTIONS.audience]}
        onChange={(v) => setProfile({ audience: v as typeof profile.audience })}
      />
      <ProfileSelect
        label="Region"
        value={profile.region}
        options={[...REGULATED_PROFILE_OPTIONS.region]}
        onChange={(v) => setProfile({ region: v as typeof profile.region })}
      />
      <ProfileSelect
        label="Intent"
        value={profile.intent}
        options={[...REGULATED_PROFILE_OPTIONS.intent]}
        onChange={(v) => setProfile({ intent: v as typeof profile.intent })}
      />
    </div>
  );
}
