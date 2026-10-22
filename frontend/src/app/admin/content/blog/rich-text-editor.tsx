"use client";
export const instant = false;

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Youtube from "@tiptap/extension-youtube";
import { useState } from "react";

type Props = { value: string; onChange: (html: string) => void };

export default function RichTextEditor({ value, onChange }: Props) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [tempUrl, setTempUrl] = useState("");

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

  function confirmLink() {
    if (!tempUrl) return;
    activeEditor.chain().focus().extendMarkRange("link").setLink({ href: tempUrl }).run();
    setTempUrl(""); setShowLinkModal(false);
  }

  function confirmImage() {
    if (!tempUrl) return;
    activeEditor.chain().focus().setImage({ src: tempUrl, alt: "" }).run();
    setTempUrl(""); setShowImageModal(false);
  }

  function confirmYoutube() {
    if (!tempUrl) return;
    activeEditor.commands.setYoutubeVideo({ src: tempUrl });
    setTempUrl(""); setShowYoutubeModal(false);
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
        {button("Link", activeEditor.isActive("link"), () => { setTempUrl(""); setShowLinkModal(true); })}
        {button("Image", false, () => { setTempUrl(""); setShowImageModal(true); })}
        {button("Table", activeEditor.isActive("table"), () => activeEditor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())}
        {button("YouTube video", activeEditor.isActive("youtube"), () => { setTempUrl(""); setShowYoutubeModal(true); })}
      </div>
      <EditorContent editor={activeEditor} />

      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="font-bold">Enter link URL</h3>
            <input value={tempUrl} onChange={e => setTempUrl(e.target.value)} placeholder="https://..." className="mt-3 w-full rounded border p-2 text-black" autoFocus />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowLinkModal(false)} className="rounded border px-4 py-2">Cancel</button>
              <button onClick={confirmLink} className="rounded bg-black px-4 py-2 text-white">Add Link</button>
            </div>
          </div>
        </div>
      )}

      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="font-bold">Paste Media Library URL</h3>
            <input value={tempUrl} onChange={e => setTempUrl(e.target.value)} placeholder="https://..." className="mt-3 w-full rounded border p-2 text-black" autoFocus />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowImageModal(false)} className="rounded border px-4 py-2">Cancel</button>
              <button onClick={confirmImage} className="rounded bg-black px-4 py-2 text-white">Add Image</button>
            </div>
          </div>
        </div>
      )}

      {showYoutubeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="font-bold">Paste YouTube URL</h3>
            <input value={tempUrl} onChange={e => setTempUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="mt-3 w-full rounded border p-2 text-black" autoFocus />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowYoutubeModal(false)} className="rounded border px-4 py-2">Cancel</button>
              <button onClick={confirmYoutube} className="rounded bg-black px-4 py-2 text-white">Add Video</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}