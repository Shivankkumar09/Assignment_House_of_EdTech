"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Placeholder from "@tiptap/extension-placeholder";
import * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";
import { useEffect, useMemo } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo2,
  Redo2,
} from "lucide-react";

interface EditorProps {
  ydoc: Y.Doc;
  provider: WebsocketProvider;
  editable: boolean;
  awarenessUser: { name: string; color: string };
  onEditorReady?: (editor: ReturnType<typeof useEditor>) => void;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
        active ? "bg-signal-soft text-signal-dark" : "text-ink-600 hover:bg-ink-100"
      } disabled:pointer-events-none disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

export default function Editor({ ydoc, provider, editable, awarenessUser, onEditorReady }: EditorProps) {
  // Local-only undo/redo history, scoped to this client's own edits — this
  // is Yjs's UndoManager, distinct from the permanent, shared version
  // history stored on the backend (see VersionHistoryPanel).
  const undoManager = useMemo(() => new Y.UndoManager(ydoc.getXmlFragment("content")), [ydoc]);

  const extensions = useMemo(
    () => [
      StarterKit.configure({ history: false }),
      Collaboration.configure({ document: ydoc, field: "content" }),
      CollaborationCursor.configure({
        provider,
        user: awarenessUser,
      }),
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    [ydoc, provider, awarenessUser]
  );

  const editor = useEditor(
    {
      extensions,
      editable,
      immediatelyRender: false,
      editorProps: {
        attributes: { class: "doc-prose max-w-none focus:outline-none" },
      },
    },
    [extensions]
  );

  useEffect(() => {
    if (editor) {
      editor.commands.updateUser(awarenessUser);
    }
  }, [editor, awarenessUser]);

  useEffect(() => {
    if (editor) onEditorReady?.(editor);
  }, [editor, onEditorReady]);

  if (!editor) return null;

  return (
    <div className="flex h-full flex-col">
      {editable && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-ink-200 bg-white/95 px-3 py-1.5 backdrop-blur">
          <ToolbarButton label="Undo" onClick={() => undoManager.undo()}>
            <Undo2 size={16} />
          </ToolbarButton>
          <ToolbarButton label="Redo" onClick={() => undoManager.redo()}>
            <Redo2 size={16} />
          </ToolbarButton>
          <div className="mx-1.5 h-5 w-px bg-ink-200" />
          <ToolbarButton
            label="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton
            label="Strikethrough"
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough size={16} />
          </ToolbarButton>
          <div className="mx-1.5 h-5 w-px bg-ink-200" />
          <ToolbarButton
            label="Heading 1"
            active={editor.isActive("heading", { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 size={16} />
          </ToolbarButton>
          <ToolbarButton
            label="Heading 2"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 size={16} />
          </ToolbarButton>
          <div className="mx-1.5 h-5 w-px bg-ink-200" />
          <ToolbarButton
            label="Bullet list"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton
            label="Numbered list"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered size={16} />
          </ToolbarButton>
          <ToolbarButton
            label="Quote"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote size={16} />
          </ToolbarButton>
          <ToolbarButton
            label="Code block"
            active={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Code size={16} />
          </ToolbarButton>
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-8 py-8 sm:px-16">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
