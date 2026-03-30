"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  Hash,
  List,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ViewGuard } from "@/components/view-guard";
import { docs, type DocEntry } from "@/docs";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractHeadings(markdown: string): TocItem[] {
  const headings: TocItem[] = [];
  const lines = markdown.split("\n");
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^(#{1,3})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/\*\*/g, "").replace(/`/g, "").trim();
      const id = slugify(text);
      headings.push({ id, text, level });
    }
  }
  return headings;
}

function HeadingWithAnchor({
  level,
  id,
  children,
}: {
  level: number;
  id: string;
  children: React.ReactNode;
}) {
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4";
  return (
    <Tag id={id} className="doc-heading group">
      {children}
      <a
        href={`#${id}`}
        className="doc-anchor-link"
        aria-label="Link to section"
        onClick={(e) => {
          e.preventDefault();
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}
      >
        <Hash className="h-4 w-4" />
      </a>
    </Tag>
  );
}

function makeHeadingComponent(level: number) {
  return function MarkdownHeading(props: ComponentPropsWithoutRef<"h1">) {
    const text =
      typeof props.children === "string"
        ? props.children
        : String(props.children ?? "");
    const id = slugify(text);
    return (
      <HeadingWithAnchor level={level} id={id}>
        {props.children}
      </HeadingWithAnchor>
    );
  };
}

const mdComponents = {
  h1: makeHeadingComponent(1),
  h2: makeHeadingComponent(2),
  h3: makeHeadingComponent(3),
  h4: makeHeadingComponent(4),
};

function TableOfContents({
  headings,
  activeId,
  onNavigate,
}: {
  headings: TocItem[];
  activeId: string;
  onNavigate: (id: string) => void;
}) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeId]);

  return (
    <nav className="space-y-0.5">
      {headings.map((h, i) => {
        const isActive = h.id === activeId;
        const indent =
          h.level === 1 ? "pl-0" : h.level === 2 ? "pl-3" : "pl-6";
        return (
          <button
            key={`${h.id}-${i}`}
            ref={isActive ? activeRef : undefined}
            onClick={() => onNavigate(h.id)}
            className={`
              w-full text-left text-[13px] leading-snug py-1.5 px-2.5 rounded-md
              transition-all duration-150 cursor-pointer block
              ${indent}
              ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }
              ${h.level === 1 ? "font-medium text-sm" : ""}
            `}
          >
            {h.text}
          </button>
        );
      })}
    </nav>
  );
}

function MobileTocDropdown({
  headings,
  activeId,
  onNavigate,
}: {
  headings: TocItem[];
  activeId: string;
  onNavigate: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const activeHeading = headings.find((h) => h.id === activeId);

  return (
    <div className="lg:hidden mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border bg-card text-sm cursor-pointer"
      >
        <List className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="truncate flex-1 text-left">
          {activeHeading?.text ?? "Indice del documento"}
        </span>
        <ChevronRight
          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>
      {open && (
        <div className="mt-2 p-3 rounded-lg border bg-card max-h-64 overflow-y-auto">
          <TableOfContents
            headings={headings}
            activeId={activeId}
            onNavigate={(id) => {
              onNavigate(id);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

function useActiveHeading(
  headings: TocItem[],
  scrollRef: React.RefObject<HTMLDivElement | null>,
): string {
  const [activeId, setActiveId] = useState("");
  const headingIds = useMemo(() => headings.map((h) => h.id), [headings]);

  useEffect(() => {
    if (headingIds.length === 0) return;

    const scrollRoot = scrollRef.current;
    if (!scrollRoot) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        root: scrollRoot,
        rootMargin: "0px 0px -65% 0px",
        threshold: 0.1,
      },
    );

    const timer = setTimeout(() => {
      for (const id of headingIds) {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [headingIds, scrollRef]);

  return activeId;
}

function DocumentViewer({
  doc,
  content,
  onBack,
}: {
  doc: DocEntry;
  content: string;
  onBack: () => void;
}) {
  const headings = useMemo(() => extractHeadings(content), [content]);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const activeId = useActiveHeading(headings, contentScrollRef);

  const navigateTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const progressPercent = useMemo(() => {
    if (!activeId || headings.length === 0) return 0;
    const idx = headings.findIndex((h) => h.id === activeId);
    return idx >= 0 ? Math.round(((idx + 1) / headings.length) * 100) : 0;
  }, [activeId, headings]);

  return (
    <div
      className="-mx-6 -mb-6 flex flex-col"
      style={{ height: "calc(100dvh - 5.5rem)" }}
    >
      <div className="px-6 py-3 border-b bg-card/30 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <Separator
            orientation="vertical"
            className="h-5 hidden sm:block"
          />
          <div className="flex items-center gap-2 min-w-0">
            <doc.icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <h2 className="text-lg font-semibold truncate">{doc.title}</h2>
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0">
            {doc.category === "tecnico" ? "Tecnico" : "Usuario"}
          </Badge>
          {headings.length > 0 && (
            <span className="text-[11px] text-muted-foreground ml-auto hidden sm:block">
              {headings.length} secciones
            </span>
          )}
        </div>
      </div>

      <div className="lg:hidden px-6 pt-3 shrink-0">
        <MobileTocDropdown
          headings={headings}
          activeId={activeId}
          onNavigate={navigateTo}
        />
      </div>

      <div className="flex flex-1 min-h-0">
        {headings.length > 0 && (
          <aside className="hidden lg:flex flex-col w-64 border-r shrink-0 bg-card/30">
            <div className="px-4 pt-4 pb-2 shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <List className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Contenido
                </span>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary/50 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 doc-toc-scroll">
              <TableOfContents
                headings={headings}
                activeId={activeId}
                onNavigate={navigateTo}
              />
            </div>
          </aside>
        )}

        <div
          className="flex-1 overflow-y-auto"
          ref={contentScrollRef}
        >
          <div className="max-w-4xl mx-auto px-6 sm:px-10 py-8">
            <div className="doc-prose">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={mdComponents}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentationPageContent() {
  const [selected, setSelected] = useState<DocEntry | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const loadDoc = useCallback(async (doc: DocEntry) => {
    setSelected(doc);
    setLoading(true);
    try {
      const res = await fetch(`/docs/${doc.filename}`);
      const text = await res.text();
      setContent(text);
    } catch {
      setContent("Error al cargar el documento.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const doc = docs.find((d) => d.id === hash);
      if (doc) loadDoc(doc);
    }
  }, [loadDoc]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (selected) {
    return (
      <DocumentViewer
        doc={selected}
        content={content}
        onBack={() => {
          setSelected(null);
          setContent("");
          window.history.replaceState(null, "", window.location.pathname);
        }}
      />
    );
  }

  const userDocs = docs.filter((d) => d.category === "usuario");
  const techDocs = docs.filter((d) => d.category === "tecnico");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documentacion</h1>
        <p className="text-muted-foreground mt-1">
          Guias y documentacion tecnica del sistema AdminDoctor. Selecciona un
          documento para comenzar.
        </p>
      </div>

      {userDocs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Guias de usuario
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {userDocs.map((doc) => (
              <DocCard key={doc.id} doc={doc} onSelect={loadDoc} />
            ))}
          </div>
        </div>
      )}

      {techDocs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Documentacion tecnica
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {techDocs.map((doc) => (
              <DocCard key={doc.id} doc={doc} onSelect={loadDoc} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DocCard({
  doc,
  onSelect,
}: {
  doc: DocEntry;
  onSelect: (d: DocEntry) => void;
}) {
  return (
    <Card
      className="group cursor-pointer hover:shadow-md transition-all hover:border-primary/30"
      onClick={() => {
        window.history.replaceState(null, "", `#${doc.id}`);
        onSelect(doc);
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <doc.icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base leading-snug">
              {doc.title}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="line-clamp-2 text-sm">
          {doc.description}
        </CardDescription>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          <FileText className="h-3.5 w-3.5" />
          Leer documento
        </div>
      </CardContent>
    </Card>
  );
}

export default function DocumentationPage() {
  return (
    <ViewGuard viewId="documentation">
      <DocumentationPageContent />
    </ViewGuard>
  );
}
