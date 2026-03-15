"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  FiBold,
  FiImage,
  FiItalic,
  FiLink,
  FiList,
  FiRotateCcw,
  FiRotateCw,
  FiType,
} from "react-icons/fi";

type NewsRichTextEditorProps = {
  initialContent: string;
  onChange: (value: { html: string; json: unknown }) => void;
};

type ToolbarButtonProps = {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
};

function ToolbarButton({
  label,
  onClick,
  active = false,
  disabled = false,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center justify-center rounded-md border px-3 text-sm font-semibold transition ${
        active
          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

export default function NewsRichTextEditor({
  initialContent,
  onChange,
}: NewsRichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https", "mailto"],
      }),
      Placeholder.configure({
        placeholder: "Write the article body here...",
      }),
    ],
    content: initialContent || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "min-h-[320px] rounded-b-xl border border-t-0 border-slate-200 bg-white px-4 py-4 text-[15px] leading-7 text-slate-800 outline-none",
      },
    },
    onUpdate({ editor: nextEditor }) {
      onChange({
        html: nextEditor.getHTML(),
        json: nextEditor.getJSON(),
      });
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() === (initialContent || "<p></p>")) return;
    editor.commands.setContent(initialContent || "<p></p>", { emitUpdate: false });
  }, [editor, initialContent]);

  const handleSetLink = () => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter a URL", previousUrl || "https://");

    if (url === null) return;

    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const handleImageUpload = async (file: File) => {
    if (!editor) return;

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/news-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.details || data?.error || "Failed to upload image.");
      }

      editor.chain().focus().setImage({ src: data.url }).run();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload image.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 shadow-sm">
      <div className="flex flex-wrap gap-2 rounded-t-xl border-b border-slate-200 bg-white p-3">
        <ToolbarButton
          label="Paragraph"
          onClick={() => editor?.chain().focus().setParagraph().run()}
          active={editor?.isActive("paragraph")}
          disabled={!editor}
        >
          <FiType />
        </ToolbarButton>
        <ToolbarButton
          label="Bold"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          active={editor?.isActive("bold")}
          disabled={!editor}
        >
          <FiBold />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          active={editor?.isActive("italic")}
          disabled={!editor}
        >
          <FiItalic />
        </ToolbarButton>
        <ToolbarButton
          label="Bulleted List"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          active={editor?.isActive("bulletList")}
          disabled={!editor}
        >
          <FiList />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered List"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          active={editor?.isActive("orderedList")}
          disabled={!editor}
        >
          <span className="text-xs font-bold">1.</span>
        </ToolbarButton>
        <ToolbarButton label="Link" onClick={handleSetLink} disabled={!editor}>
          <FiLink />
        </ToolbarButton>
        <ToolbarButton
          label="Insert Image"
          onClick={() => fileInputRef.current?.click()}
          disabled={!editor || uploading}
        >
          <FiImage />
        </ToolbarButton>
        <ToolbarButton
          label="Undo"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().chain().focus().undo().run()}
        >
          <FiRotateCcw />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().chain().focus().redo().run()}
        >
          <FiRotateCw />
        </ToolbarButton>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleImageUpload(file);
          }
        }}
      />

      <EditorContent editor={editor} />

      <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
        <span>{uploading ? "Uploading image..." : "Formatted article body"}</span>
        {error ? <span className="font-medium text-rose-600">{error}</span> : null}
      </div>
    </div>
  );
}
