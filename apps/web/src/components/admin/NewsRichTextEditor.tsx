"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import ModernRichTextToolbar, { ToolbarPresets } from "./ModernRichTextToolbar";

type NewsRichTextEditorProps = {
  initialContent: string;
  onChange: (value: { html: string; json: unknown }) => void;
  placeholder?: string;
  statusLabel?: string;
};

export default function NewsRichTextEditor({
  initialContent,
  onChange,
  placeholder = "Write the article body here...",
  statusLabel = "Formatted article body",
}: NewsRichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastEmittedHtmlRef = useRef(initialContent || "<p></p>");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Image,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https", "mailto"],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: initialContent || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "rich-text-editor-input min-h-[320px] rounded-b-lg border border-t-0 border-slate-200 bg-white px-4 py-4 text-[15px] leading-7 text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50",
      },
    },
    onUpdate({ editor: nextEditor }) {
      const html = nextEditor.getHTML();
      lastEmittedHtmlRef.current = html;
      onChange({
        html,
        json: nextEditor.getJSON(),
      });
    },
  });

  useEffect(() => {
    if (!editor) return;

    const nextContent = initialContent || "<p></p>";

    // Avoid re-applying content we just emitted from this editor instance.
    if (nextContent === lastEmittedHtmlRef.current) return;

    if (editor.getHTML() === nextContent) {
      lastEmittedHtmlRef.current = nextContent;
      return;
    }

    editor.commands.setContent(nextContent, { emitUpdate: false });
    lastEmittedHtmlRef.current = nextContent;
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

  if (!editor) return null;

  const toolbarGroups = ToolbarPresets.full(
    {
      bold: () => editor.chain().focus().toggleBold().run(),
      italic: () => editor.chain().focus().toggleItalic().run(),
      underline: () => editor.chain().focus().toggleUnderline().run(),
      strikethrough: () => editor.chain().focus().toggleStrike().run(),
      heading1: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      heading2: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      bulletList: () => editor.chain().focus().toggleBulletList().run(),
      orderedList: () => editor.chain().focus().toggleOrderedList().run(),
      alignLeft: () => editor.chain().focus().setTextAlign("left").run(),
      alignCenter: () => editor.chain().focus().setTextAlign("center").run(),
      alignRight: () => editor.chain().focus().setTextAlign("right").run(),
      link: handleSetLink,
      code: () => editor.chain().focus().toggleCodeBlock().run(),
      blockquote: () => editor.chain().focus().toggleBlockquote().run(),
      image: () => fileInputRef.current?.click(),
    },
    {
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      strikethrough: editor.isActive("strike"),
      heading1: editor.isActive("heading", { level: 1 }),
      heading2: editor.isActive("heading", { level: 2 }),
      bulletList: editor.isActive("bulletList"),
      orderedList: editor.isActive("orderedList"),
      alignLeft: editor.isActive({ textAlign: "left" }),
      alignCenter: editor.isActive({ textAlign: "center" }),
      alignRight: editor.isActive({ textAlign: "right" }),
      code: editor.isActive("codeBlock"),
      blockquote: editor.isActive("blockquote"),
    }
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 shadow-sm overflow-hidden">
      <ModernRichTextToolbar
        groups={toolbarGroups}
        onImageUpload={handleImageUpload}
      />

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
        <span>{uploading ? "Uploading image..." : statusLabel}</span>
        {error ? <span className="font-medium text-rose-600">{error}</span> : null}
      </div>
    </div>
  );
}
