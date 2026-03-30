import { Server, Monitor, BookOpen } from "lucide-react";
import type { ElementType } from "react";

export interface DocEntry {
  id: string;
  title: string;
  description: string;
  icon: ElementType;
  filename: string;
  category: "tecnico" | "usuario";
}

export const docs: DocEntry[] = [
  {
    id: "manual-usuario",
    title: "Manual de Usuario",
    description:
      "Guia completa para el administrador del sistema: configuracion, turnos, pacientes, doctores, historia clinica y mas.",
    icon: BookOpen,
    filename: "manual-usuario.md",
    category: "usuario",
  },
  {
    id: "backend",
    title: "Backend - Guia Tecnica",
    description:
      "Arquitectura del servidor, base de datos, autenticacion, notificaciones, cola de trabajos, deploy y proveedores.",
    icon: Server,
    filename: "backend.md",
    category: "tecnico",
  },
  {
    id: "frontend",
    title: "Frontend - Guia Tecnica",
    description:
      "Arquitectura de la aplicacion web, componentes, hooks, estilos, permisos y deploy.",
    icon: Monitor,
    filename: "frontend.md",
    category: "tecnico",
  },
];
