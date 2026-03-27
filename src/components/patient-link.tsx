"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface PatientLinkProps {
  patientId: number;
  firstName: string;
  lastName: string;
  className?: string;
}

export function PatientLink({
  patientId,
  firstName,
  lastName,
  className,
}: PatientLinkProps) {
  return (
    <Link
      href={`/dashboard/patients/${patientId}`}
      className={cn(
        "hover:underline hover:text-primary transition-colors cursor-pointer",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {firstName} {lastName}
    </Link>
  );
}
