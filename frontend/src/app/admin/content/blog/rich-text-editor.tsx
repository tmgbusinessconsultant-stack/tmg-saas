"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Youtube from "@tiptap/extension-youtube";

type Props = { value: string; onChange: (html: string) => void };

export default function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({ allowBase64: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube.configure({ nocookie: true, controls: true, modestBranding: true }),
    ],
    content: value,
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
    editorProps: {
      attributes: {
        class: "cms-rich-content min-h-72 rounded-b-lg border border-t-0 border-slate-300 p-4 focus:outline-none",
      },
    },
  });

  if (!editor) return <div className="min-h-72 rounded-lg border border-slate-300 p-4" role="status">Loading editor…</div>;

  const activeEditor = editor;
  const button = (label: string, active: boolean, run: () => void) => (
    <button
      key={label}
      type="button"
      onClick={run}
      aria-pressed={active}
      className={`rounded border px-2 py-1 text-sm ${active ? "border-[#8A6A00] bg-amber-50" : "border-slate-300"}`}
    >
      {label}
    </button>
  );

  function addLink() {
    const href = window.prompt("Enter the link URL");
    if (!href) return;
    activeEditor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  }

  function addImage() {
    const src = window.prompt("Paste a published Media Library URL");
    if (!src) return;
    activeEditor.chain().focus().setImage({ src, alt: "" }).run();
  }

  function addYoutube() {
    const src = window.prompt("Paste a YouTube video URL");
    if (!src) return;
    activeEditor.commands.setYoutubeVideo({ src });
  }

  return (
    <div className="mt-1">
      <div className="flex flex-wrap gap-2 rounded-t-lg border border-slate-300 bg-slate-50 p-2">
        {button("Bold", activeEditor.isActive("bold"), () => activeEditor.chain().focus().toggleBold().run())}
        {button("Italic", activeEditor.isActive("italic"), () => activeEditor.chain().focus().toggleItalic().run())}
        {button("H2", activeEditor.isActive("heading", { level: 2 }), () => activeEditor.chain().focus().toggleHeading({ level: 2 }).run())}
        {button("H3", activeEditor.isActive("heading", { level: 3 }), () => activeEditor.chain().focus().toggleHeading({ level: 3 }).run())}
        {button("Bullets", activeEditor.isActive("bulletList"), () => activeEditor.chain().focus().toggleBulletList().run())}
        {button("Numbered", activeEditor.isActive("orderedList"), () => activeEditor.chain().focus().toggleOrderedList().run())}
        {button("Quote", activeEditor.isActive("blockquote"), () => activeEditor.chain().focus().toggleBlockquote().run())}
        {button("Code", activeEditor.isActive("codeBlock"), () => activeEditor.chain().focus().toggleCodeBlock().run())}
        {button("Link", activeEditor.isActive("link"), addLink)}
        {button("Image", false, addImage)}
        {button("Table", activeEditor.isActive("table"), () => activeEditor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())}
        {button("YouTube video", activeEditor.isActive("youtube"), addYoutube)}
      </div>
      <EditorContent editor={activeEditor} />
    </div>
  );
}
