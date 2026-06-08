import {
  NotebookPen, Brain, Database, Workflow, Braces, GitCompare, KanbanSquare,
  FileText, PenLine, LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/app/notes",    label: "Quick Notes",    icon: NotebookPen, description: "Rich-text developer notes" },
  { href: "/app/markdown", label: "MD Studio",      icon: FileText,    description: "Documentation workspace" },
  { href: "/app/insight",  label: "DAX Insight",    icon: Brain,       description: "Explain, visualise & optimise DAX" },
  { href: "/app/studio",   label: "DAX Studio",     icon: Database,    description: "Browser-based DAX execution" },
  { href: "/app/mermaid",  label: "Mermaid Studio", icon: Workflow,    description: "Render & export Mermaid diagrams" },
  { href: "/app/json",     label: "JSON Toolkit",   icon: Braces,      description: "Beautify, minify, validate, tree view" },
  { href: "/app/compare",  label: "Text Compare",   icon: GitCompare,  description: "GitHub-style diff viewer" },
  { href: "/app/kanban",      label: "Kanban",       icon: KanbanSquare, description: "Plan your work" },
  { href: "/app/whiteboard",  label: "Quick Board",  icon: PenLine,      description: "AI-powered infinite canvas" },
];
