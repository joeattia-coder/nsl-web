"use client";

import { useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Code2,
  Strikethrough,
  Heading1,
  Heading2,
  Quote,
  Image as ImageIcon,
} from "lucide-react";

type ToolbarAction = {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
  color?: string;
};

type ToolbarGroup = {
  label: string;
  actions: ToolbarAction[];
};

interface ModernRichTextToolbarProps {
  groups: ToolbarGroup[];
  onImageUpload?: (file: File) => void;
}

/**
 * Modern Rich Text Editor Toolbar
 * Fluent Design Style inspired by Microsoft Word / Office 365
 *
 * Features:
 * - Fluent-inspired soft surfaces
 * - Smooth hover/active states
 * - Tooltip support
 * - Accessibility (keyboard nav, ARIA labels)
 * - Responsive design
 * - Active state highlighting
 */
export default function ModernRichTextToolbar({
  groups,
  onImageUpload,
}: ModernRichTextToolbarProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
    event.target.value = "";
  };

  const getToneClasses = (color?: string) => {
    const toneMap: Record<
      string,
      {
        icon: string;
        surface: string;
        hoverSurface: string;
        active: string;
      }
    > = {
      blue: {
        icon: "text-blue-700",
        surface: "bg-blue-50/90",
        hoverSurface: "hover:bg-blue-100",
        active: "bg-blue-100 text-blue-800",
      },
      purple: {
        icon: "text-purple-700",
        surface: "bg-purple-50/90",
        hoverSurface: "hover:bg-purple-100",
        active: "bg-purple-100 text-purple-800",
      },
      slate: {
        icon: "text-slate-700",
        surface: "bg-slate-100",
        hoverSurface: "hover:bg-slate-200",
        active: "bg-slate-200 text-slate-900",
      },
    };

    return toneMap[color ?? "slate"] ?? toneMap.slate;
  };

  const ToolbarButton = ({
    action,
    showTooltip,
  }: {
    action: ToolbarAction;
    showTooltip: boolean;
  }) => {
    const tones = getToneClasses(action.color);

    return (
      <div key={action.id} className="relative group">
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={action.onClick}
          disabled={false}
          aria-label={action.label}
          title={action.label}
          className={`relative flex h-9 w-9 items-center justify-center rounded-md transition-all duration-150 ease-out text-sm ${
            action.isActive
              ? `${tones.active} shadow-inner ring-1 ring-black/5`
              : `${tones.surface} ${tones.icon} ${tones.hoverSurface} hover:shadow-sm`
          } focus:outline-none focus:ring-2 focus:ring-blue-300/60 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
        >
        <span className="flex items-center justify-center h-5 w-5">
          {action.icon}
        </span>
        </button>

      {/* Tooltip */}
        <div
          className={`absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg pointer-events-none transition-opacity duration-150 ${
            showTooltip ? "opacity-100" : "opacity-0"
          }`}
        >
          {action.label}
          <div className="absolute top-full left-1/2 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-slate-900" />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-3 shadow-sm">
      {/* Main Toolbar */}
      <div className="flex flex-wrap items-center gap-1">
        {groups.map((group, groupIndex) => (
          <div key={group.label} className="flex items-center gap-1">
            {/* Group separator */}
            {groupIndex > 0 && (
              <div className="h-6 w-px bg-slate-200 mx-1" />
            )}

            {/* Group actions */}
            <div className="flex items-center gap-1">
              {group.actions.map((action) => (
                <div
                  key={action.id}
                  onMouseEnter={() => setActiveTooltip(action.id)}
                  onMouseLeave={() => setActiveTooltip(null)}
                >
                  <ToolbarButton
                    action={action}
                    showTooltip={activeTooltip === action.id}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Hidden image input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
        aria-label="Upload image"
      />
    </div>
  );
}

/**
 * Preset toolbar configurations
 */
export const ToolbarPresets = {
  full: (handlers: Record<string, () => void>, activeStates?: Record<string, boolean>) =>
    [
      {
        label: "Text Formatting",
        actions: [
          {
            id: "bold",
            label: "Bold",
            icon: <Bold className="w-5 h-5" />,
            onClick: handlers.bold,
            isActive: activeStates?.bold,
            color: "blue",
          },
          {
            id: "italic",
            label: "Italic",
            icon: <Italic className="w-5 h-5" />,
            onClick: handlers.italic,
            isActive: activeStates?.italic,
            color: "purple",
          },
          {
            id: "underline",
            label: "Underline",
            icon: <Underline className="w-5 h-5" />,
            onClick: handlers.underline,
            isActive: activeStates?.underline,
            color: "blue",
          },
          {
            id: "strikethrough",
            label: "Strikethrough",
            icon: <Strikethrough className="w-5 h-5" />,
            onClick: handlers.strikethrough,
            isActive: activeStates?.strikethrough,
            color: "slate",
          },
        ],
      },
      {
        label: "Headings",
        actions: [
          {
            id: "heading1",
            label: "Heading 1",
            icon: <Heading1 className="w-5 h-5" />,
            onClick: handlers.heading1,
            isActive: activeStates?.heading1,
            color: "blue",
          },
          {
            id: "heading2",
            label: "Heading 2",
            icon: <Heading2 className="w-5 h-5" />,
            onClick: handlers.heading2,
            isActive: activeStates?.heading2,
            color: "blue",
          },
        ],
      },
      {
        label: "Lists & Alignment",
        actions: [
          {
            id: "bullet_list",
            label: "Bullet List",
            icon: <List className="w-5 h-5" />,
            onClick: handlers.bulletList,
            isActive: activeStates?.bulletList,
            color: "blue",
          },
          {
            id: "ordered_list",
            label: "Numbered List",
            icon: <ListOrdered className="w-5 h-5" />,
            onClick: handlers.orderedList,
            isActive: activeStates?.orderedList,
            color: "blue",
          },
        ],
      },
      {
        label: "Alignment",
        actions: [
          {
            id: "align_left",
            label: "Align Left",
            icon: <AlignLeft className="w-5 h-5" />,
            onClick: handlers.alignLeft,
            isActive: activeStates?.alignLeft,
            color: "slate",
          },
          {
            id: "align_center",
            label: "Align Center",
            icon: <AlignCenter className="w-5 h-5" />,
            onClick: handlers.alignCenter,
            isActive: activeStates?.alignCenter,
            color: "slate",
          },
          {
            id: "align_right",
            label: "Align Right",
            icon: <AlignRight className="w-5 h-5" />,
            onClick: handlers.alignRight,
            isActive: activeStates?.alignRight,
            color: "slate",
          },
        ],
      },
      {
        label: "Insert",
        actions: [
          {
            id: "link",
            label: "Insert Link",
            icon: <Link2 className="w-5 h-5" />,
            onClick: handlers.link,
            color: "blue",
          },
          {
            id: "code",
            label: "Code Block",
            icon: <Code2 className="w-5 h-5" />,
            onClick: handlers.code,
            color: "slate",
          },
          {
            id: "blockquote",
            label: "Quote",
            icon: <Quote className="w-5 h-5" />,
            onClick: handlers.blockquote,
            color: "purple",
          },
          {
            id: "image",
            label: "Insert Image",
            icon: <ImageIcon className="w-5 h-5" />,
            onClick: handlers.image,
            color: "purple",
          },
        ],
      },
    ] as ToolbarGroup[],

  minimal: (handlers: Record<string, () => void>, activeStates?: Record<string, boolean>) =>
    [
      {
        label: "Formatting",
        actions: [
          {
            id: "bold",
            label: "Bold",
            icon: <Bold className="w-5 h-5" />,
            onClick: handlers.bold,
            isActive: activeStates?.bold,
            color: "blue",
          },
          {
            id: "italic",
            label: "Italic",
            icon: <Italic className="w-5 h-5" />,
            onClick: handlers.italic,
            isActive: activeStates?.italic,
            color: "purple",
          },
          {
            id: "underline",
            label: "Underline",
            icon: <Underline className="w-5 h-5" />,
            onClick: handlers.underline,
            isActive: activeStates?.underline,
            color: "blue",
          },
        ],
      },
      {
        label: "Lists",
        actions: [
          {
            id: "bullet_list",
            label: "Bullet List",
            icon: <List className="w-5 h-5" />,
            onClick: handlers.bulletList,
            isActive: activeStates?.bulletList,
            color: "blue",
          },
          {
            id: "ordered_list",
            label: "Numbered List",
            icon: <ListOrdered className="w-5 h-5" />,
            onClick: handlers.orderedList,
            isActive: activeStates?.orderedList,
            color: "blue",
          },
        ],
      },
      {
        label: "Links",
        actions: [
          {
            id: "link",
            label: "Insert Link",
            icon: <Link2 className="w-5 h-5" />,
            onClick: handlers.link,
            color: "blue",
          },
        ],
      },
    ] as ToolbarGroup[],
};
