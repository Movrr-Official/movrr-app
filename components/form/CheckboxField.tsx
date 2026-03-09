"use client";

import * as React from "react";

import { Checkbox } from "@/components/ui/checkbox";

export function CheckboxField({
  name,
  defaultChecked = false,
  label,
}: {
  name: string;
  defaultChecked?: boolean;
  label: string;
}) {
  const [checked, setChecked] = React.useState(defaultChecked);

  return (
    <label className="flex items-center gap-3 text-sm font-medium">
      <input type="hidden" name={name} value={checked ? "true" : "false"} />
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => setChecked(value === true)}
      />
      <span>{label}</span>
    </label>
  );
}