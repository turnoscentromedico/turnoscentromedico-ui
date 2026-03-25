"use client";

import Link from "next/link";
import { CalendarDays, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HomeContent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-background to-muted p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">Turnos Clínica</h1>
        </div>
        <p className="max-w-md text-lg text-muted-foreground">
          Sistema de gestión de turnos médicos. Administrá tus citas de forma
          simple y eficiente.
        </p>
      </div>

      <div className="flex gap-4">
        <Link
          href="/sign-in"
          className={cn(buttonVariants({ size: "lg" }))}
        >
          Iniciar Sesión
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
        <Link
          href="/sign-up"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          Crear Cuenta
        </Link>
      </div>
    </div>
  );
}
