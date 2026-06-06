"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { TableKit } from "@tiptap/extension-table";
import {
  Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon, Highlighter,
  List, ListOrdered, ListChecks, Table as TableIcon, Image as ImageIcon,
  Quote, Code2, Heading1, Heading2, Heading3, Undo2, Redo2,
} from "lucide-react";
import { detectLanguage } from "@/lib/detect-lang";
import { log } from "@/lib/logger";
import { cn } from "@/lib/cn";

function ToolbarButton({
  onClick, active, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-md transition-colors",
        active ? "bg-accent-soft text-accent" : "text-fg-muted hover:bg-bg-elevated hover:text-fg"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-border" />;
}

function Toolbar({ editor }: { editor: Editor }) {
  const headingValue = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
    ? "h2"
    : editor.isActive("heading", { level: 3 })
    ? "h3"
    : "p";

  function setBlock(v: string) {
    const chain = editor.chain().focus();
    if (v === "p") chain.setParagraph().run();
    else chain.toggleHeading({ level: Number(v[1]) as 1 | 2 | 3 }).run();
  }

  function addLink() {
    const url = prompt("Link URL?");
    if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }
  function addImage() {
    const url = prompt("Image URL?");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-bg px-2 py-1.5">
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo2 size={16} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo2 size={16} /></ToolbarButton>
      <Divider />
      <select
        value={headingValue}
        onChange={(e) => setBlock(e.target.value)}
        className="h-8 rounded-md border border-border bg-bg px-2 text-xs outline-none"
      >
        <option value="p">Normal Text</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>
      <Divider />
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold"><Bold size={16} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic"><Italic size={16} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline"><UnderlineIcon size={16} /></ToolbarButton>
      <ToolbarButton onClick={addLink} active={editor.isActive("link")} title="Link"><LinkIcon size={16} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} title="Highlight"><Highlighter size={16} /></ToolbarButton>
      <Divider />
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="H1"><Heading1 size={16} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="H2"><Heading2 size={16} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="H3"><Heading3 size={16} /></ToolbarButton>
      <Divider />
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list"><List size={16} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list"><ListOrdered size={16} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} title="Checklist"><ListChecks size={16} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Table"><TableIcon size={16} /></ToolbarButton>
      <ToolbarButton onClick={addImage} title="Image"><ImageIcon size={16} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote"><Quote size={16} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block"><Code2 size={16} /></ToolbarButton>
    </div>
  );
}

export function RichEditor({
  content,
  onChange,
  noteId,
}: {
  content: string;
  onChange: (html: string) => void;
  noteId: string;
}) {
  const [mounted, setMounted] = useState(false);

  const editor = useEditor({
    immediatelyRender: false, // avoid SSR hydration mismatch
    extensions: [
      // StarterKit v3 already bundles Bold/Italic/Underline/Link/lists/code etc.
      StarterKit.configure({
        link: { openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } },
      }),
      Highlight,
      Placeholder.configure({ placeholder: "Start typing to get started…  Type / for commands" }),
      Image,
      TaskList,
      TaskItem.configure({ nested: true }),
      TableKit.configure({ table: { resizable: true } }),
    ],
    content,
    editorProps: {
      attributes: { class: "prose-qdn focus:outline-none min-h-[300px]" },
      // Smart paste: route detected code into a code block.
      handlePaste(view, event) {
        const text = event.clipboardData?.getData("text/plain") ?? "";
        const lang = detectLanguage(text);
        if (lang && text.length > 12) {
          event.preventDefault();
          editor?.chain().focus().insertContent({
            type: "codeBlock",
            attrs: { language: lang === "csharp" ? "cs" : lang },
            content: [{ type: "text", text }],
          }).run();
          log.action("QuickNotes", "smart-paste", { lang });
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => setMounted(true), []);

  // When switching notes, replace the document without emitting an update.
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  if (!mounted) {
    return <div className="p-6 text-sm text-fg-subtle">Loading editor…</div>;
  }

  return (
    <div className="flex h-full flex-col">
      {editor && <Toolbar editor={editor} />}
      <div className="flex-1 overflow-auto px-4 py-5 sm:px-8">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
