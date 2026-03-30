"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  ClipboardList,
  Building2,
  Shield,
  Activity,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: CalendarCheck,
    title: "Gestión de turnos",
    description:
      "Agendá, confirmá y cancelá turnos. Notificaciones automáticas por email y WhatsApp.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: ClipboardList,
    title: "Historia clínica digital",
    description:
      "Registro completo de cada paciente con entradas automáticas y manuales, signos vitales y más.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Building2,
    title: "Multi-clínica y roles",
    description:
      "Administrá múltiples sedes, doctores, especialidades y usuarios con permisos configurables.",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
];

export function HomeContent() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-500/8 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-emerald-500/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Activity className="h-7 w-7" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight">
            Admin<span className="text-primary">Doctor</span>
          </h1>
        </div>
        <p className="max-w-lg text-lg text-muted-foreground leading-relaxed">
          Plataforma integral para la administración de clínicas y centros
          médicos. Turnos, historia clínica, notificaciones y más en un solo
          lugar.
        </p>
      </div>

      {/* Feature cards */}
      <div className="mt-14 grid w-full max-w-3xl gap-5 sm:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="group rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-6 text-center transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
          >
            <div
              className={cn(
                "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl",
                f.bg,
              )}
            >
              <f.icon className={cn("h-6 w-6", f.color)} />
            </div>
            <h3 className="text-sm font-semibold mb-2">{f.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {f.description}
            </p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 flex gap-4">
        <Link
          href="/sign-in"
          className={cn(
            buttonVariants({ size: "lg" }),
            "gap-2 shadow-lg shadow-primary/20",
          )}
        >
          Iniciar Sesión
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/sign-up"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          Crear Cuenta
        </Link>
      </div>

      {/* Trust bar */}
      <div className="mt-16 flex items-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-3.5 w-3.5" />
        <span>Datos protegidos con encriptación de extremo a extremo</span>
      </div>
    </div>
  );
}
