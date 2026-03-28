'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useState } from 'react';

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
  const [htmlMode, setHtmlMode] = useState(false);
  const [rawHtml, setRawHtml] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
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
        editor.commands.setContent(normalized);
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

  const toggleHtmlMode = () => {
    if (!htmlMode) {
      // Entering HTML mode: capture current HTML
      setRawHtml(editor.getHTML());
      setHtmlMode(true);
    } else {
      // Exiting HTML mode: apply edited HTML back to editor
      editor.commands.setContent(normalizeHtml(rawHtml));
      onChange(normalizeHtml(rawHtml));
      setHtmlMode(false);
    }
  };

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        {!htmlMode && (
          <>
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
          </>
        )}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); toggleHtmlMode(); }}
          className={[
            'px-2 py-1 text-xs rounded border transition-colors font-mono',
            htmlMode
              ? 'bg-orange-500 text-white border-orange-500'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700',
          ].join(' ')}
        >
          {htmlMode ? '✓ Aplicar HTML' : '</> HTML'}
        </button>
      </div>

      {/* Editor area */}
      {htmlMode ? (
        <textarea
          value={rawHtml}
          onChange={e => { setRawHtml(e.target.value); onChange(normalizeHtml(e.target.value)); }}
          className="w-full min-h-[200px] px-4 py-3 font-mono text-sm bg-gray-900 text-green-300 focus:outline-none resize-y"
          spellCheck={false}
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 min-h-[200px]">
          <style>{`
            .ProseMirror p { margin: 4px 0; }
            .ProseMirror ul, .ProseMirror ol { padding-left: 20px; }
            .ProseMirror:focus { outline: none; }
          `}</style>
          <EditorContent editor={editor} />
          {!editor.getText() && placeholder && (
            <p className="absolute top-3 left-4 text-gray-400 pointer-events-none text-sm">{placeholder}</p>
          )}
        </div>
      )}
    </div>
  );
}
