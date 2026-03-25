"use client";

import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COUNTRY_PREFIX = "+54";

function formatNumberDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const parts: string[] = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join("-");
}

function stripFormat(value: string): string {
  return value.replace(/\D/g, "");
}

export function parsePhoneToE164(areaCode: string, number: string): string {
  const area = areaCode.replace(/\D/g, "");
  const num = number.replace(/\D/g, "");
  if (!area && !num) return "";
  return `${COUNTRY_PREFIX}${area}${num}`;
}

export function splitPhoneFromE164(phone: string | null | undefined): {
  areaCode: string;
  number: string;
} {
  if (!phone) return { areaCode: "", number: "" };

  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("54")) {
    digits = digits.slice(2);
  }

  if (digits.length <= 4) {
    return { areaCode: digits, number: "" };
  }

  const areaLen = digits.length <= 10 ? 2 : Math.min(4, digits.length - 6);
  return {
    areaCode: digits.slice(0, areaLen),
    number: digits.slice(areaLen),
  };
}

interface PhoneInputProps {
  areaCode: string;
  number: string;
  onAreaCodeChange: (value: string) => void;
  onNumberChange: (value: string) => void;
  error?: string;
  compact?: boolean;
}

export function PhoneInput({
  areaCode,
  number,
  onAreaCodeChange,
  onNumberChange,
  error,
  compact,
}: PhoneInputProps) {
  const handleAreaChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
      onAreaCodeChange(digits);
    },
    [onAreaCodeChange],
  );

  const handleNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = stripFormat(e.target.value).slice(0, 8);
      onNumberChange(raw);
    },
    [onNumberChange],
  );

  const labelClass = compact ? "text-xs" : "text-sm";

  return (
    <div className="space-y-1.5">
      <Label className={labelClass}>Teléfono</Label>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-md border bg-muted px-3 h-9 shrink-0">
          <span className="text-base leading-none">🇦🇷</span>
          <span className="text-sm font-medium text-muted-foreground">+54</span>
        </div>
        <div className="space-y-0.5 w-24 shrink-0">
          <Input
            placeholder="11"
            value={areaCode}
            onChange={handleAreaChange}
            maxLength={4}
            className="text-center"
          />
          <p className="text-[10px] text-muted-foreground text-center">Caract. sin 0</p>
        </div>
        <div className="space-y-0.5 flex-1">
          <Input
            placeholder="3523-9823"
            value={formatNumberDisplay(number)}
            onChange={handleNumberChange}
          />
          <p className="text-[10px] text-muted-foreground">Número</p>
        </div>
      </div>
      {error && <p className={`text-destructive ${compact ? "text-xs" : "text-sm"}`}>{error}</p>}
    </div>
  );
}
