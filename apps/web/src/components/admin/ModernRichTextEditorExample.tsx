"use client";

import { useState } from "react";
import ModernRichTextToolbar, { ToolbarPresets } from "./ModernRichTextToolbar";

/**
 * Example: Modern Rich Text Editor with Toolbar
 * This demonstrates how to integrate the ModernRichTextToolbar component
 */
export default function ModernRichTextEditorExample() {
  const [content, setContent] = useState("<p>Start typing here...</p>");
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});

  // Handler functions for toolbar actions
  const handlers = {
    bold: () => {
      console.log("Bold clicked");
      setActiveFormats((prev) => ({ ...prev, bold: !prev.bold }));
    },
    italic: () => {
      console.log("Italic clicked");
      setActiveFormats((prev) => ({ ...prev, italic: !prev.italic }));
    },
    underline: () => {
      console.log("Underline clicked");
      setActiveFormats((prev) => ({ ...prev, underline: !prev.underline }));
    },
    strikethrough: () => {
      console.log("Strikethrough clicked");
      setActiveFormats((prev) => ({ ...prev, strikethrough: !prev.strikethrough }));
    },
    heading1: () => console.log("Heading 1 clicked"),
    heading2: () => console.log("Heading 2 clicked"),
    bulletList: () => console.log("Bullet list clicked"),
    orderedList: () => console.log("Ordered list clicked"),
    alignLeft: () => console.log("Align left clicked"),
    alignCenter: () => console.log("Align center clicked"),
    alignRight: () => console.log("Align right clicked"),
    link: () => console.log("Link clicked"),
    code: () => console.log("Code block clicked"),
    blockquote: () => console.log("Blockquote clicked"),
    image: () => console.log("Image clicked"),
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="space-y-4">
        {/* Editor Title */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Modern Rich Text Editor</h2>
          <p className="text-sm text-slate-600 mt-1">
            Fluent Design inspired toolbar with smooth interactions
          </p>
        </div>

        {/* Toolbar */}
        <ModernRichTextToolbar
          groups={ToolbarPresets.full(handlers, activeFormats)}
          onImageUpload={(file) => console.log("Uploading image:", file.name)}
        />

        {/* Editor Area */}
        <div className="rounded-lg border border-slate-300 bg-white shadow-sm overflow-hidden">
          {/* Content Editor */}
          <div
            className="min-h-64 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset prose prose-sm max-w-none"
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setContent(e.currentTarget.innerHTML)}
          >
            {content}
          </div>
        </div>

        {/* Info */}
        <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex-1">
            <p className="text-sm text-blue-900">
              <strong>✨ Features:</strong> Colorful icons, smooth hover effects, tooltips,
              active state indicators, and responsive design.
            </p>
          </div>
        </div>

        {/* Minimal Toolbar Example */}
        <div className="mt-8 pt-8 border-t border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Minimal Toolbar Preset</h3>
          <ModernRichTextToolbar
            groups={ToolbarPresets.minimal(handlers, activeFormats)}
          />
          <p className="text-xs text-slate-500 mt-3">
            For compact spaces or simpler editors, use the minimal preset
          </p>
        </div>
      </div>
    </div>
  );
}
