'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

// Strip CKEditor <figure class="table"> wrapper - TipTap doesn't use it
function normalizeHtml(html: string): string {
  return html
    .replace(/<figure[^>]*>/gi, '')
    .replace(/<\/figure>/gi, '')
    .trim();
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: normalizeHtml(value || ''),
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[200px] px-4 py-3 focus:outline-none',
      },
    },
    immediatelyRender: false,
  });

  // Sync external value changes (e.g. when initialData loads)
  useEffect(() => {
    if (editor && value !== undefined) {
      const normalized = normalizeHtml(value || '');
      if (editor.getHTML() !== normalized && normalized !== '<p></p>') {
        editor.commands.setContent(normalized, false);
      }
    }
  }, [value, editor]);

  const btn = (action: () => boolean | void, label: string, isActive?: boolean) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); action(); }}
      className={[
        'px-2 py-1 text-xs rounded border transition-colors',
        isActive
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700',
      ].join(' ')}
    >
      {label}
    </button>
  );

  if (!editor) return null;

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        {btn(() => editor.chain().focus().toggleBold().run(), 'B', editor.isActive('bold'))}
        {btn(() => editor.chain().focus().toggleItalic().run(), 'I', editor.isActive('italic'))}
        {btn(() => editor.chain().focus().toggleStrike().run(), 'S̶', editor.isActive('strike'))}
        <span className="w-px h-6 bg-gray-300 dark:bg-gray-600 self-center mx-1" />
        {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2', editor.isActive('heading', { level: 2 }))}
        {btn(() => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'H3', editor.isActive('heading', { level: 3 }))}
        <span className="w-px h-6 bg-gray-300 dark:bg-gray-600 self-center mx-1" />
        {btn(() => editor.chain().focus().toggleBulletList().run(), '• Lista', editor.isActive('bulletList'))}
        {btn(() => editor.chain().focus().toggleOrderedList().run(), '1. Lista', editor.isActive('orderedList'))}
        <span className="w-px h-6 bg-gray-300 dark:bg-gray-600 self-center mx-1" />
        {btn(() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), '+ Tabla')}
        {editor.isActive('table') && (
          <>
            {btn(() => editor.chain().focus().addColumnAfter().run(), '+Col')}
            {btn(() => editor.chain().focus().addRowAfter().run(), '+Fila')}
            {btn(() => editor.chain().focus().deleteColumn().run(), '-Col')}
            {btn(() => editor.chain().focus().deleteRow().run(), '-Fila')}
            {btn(() => editor.chain().focus().deleteTable().run(), '✕ Tabla')}
          </>
        )}
      </div>

      {/* Editor area */}
      <div className="bg-white dark:bg-gray-800 min-h-[200px]">
        <style>{`
          .ProseMirror table { border-collapse: collapse; width: 100%; margin: 8px 0; }
          .ProseMirror td, .ProseMirror th { border: 1px solid #d1d5db; padding: 6px 10px; min-width: 60px; vertical-align: top; }
          .ProseMirror th { background: #f3f4f6; font-weight: 600; }
          .ProseMirror p { margin: 4px 0; }
          .ProseMirror ul, .ProseMirror ol { padding-left: 20px; }
          .ProseMirror:focus { outline: none; }
        `}</style>
        <EditorContent editor={editor} />
        {!editor.getText() && placeholder && (
          <p className="absolute top-3 left-4 text-gray-400 pointer-events-none text-sm">{placeholder}</p>
        )}
      </div>
    </div>
  );
}
