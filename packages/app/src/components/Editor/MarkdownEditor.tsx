/**
 * MarkdownEditor - MDXEditor integration component
 */

import { MDXEditor } from "@mdxeditor/editor";
import type { MDXEditorMethods } from "@mdxeditor/editor";
import {
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  searchPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertTable,
  InsertCodeBlock,
  ListsToggle,
  Separator,
  realmPlugin,
  addTopAreaChild$,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { useEditorStore } from "../../stores/editorStore";
import { useThemeStore } from "../../stores/themeStore";
import { useRef, useEffect, useState, useMemo } from "react";
import { oneDark } from "@codemirror/theme-one-dark";
import { FindBarWrapper } from "./FindBarWrapper";

interface MarkdownEditorProps {
  // Props removed - FindBarWrapper manages its own state now
}

export function MarkdownEditor({}: MarkdownEditorProps = {}) {
  const content = useEditorStore((state) => state.content);
  const updateContent = useEditorStore((state) => state.updateContent);
  const setEditorRef = useEditorStore((state) => state.setEditorRef);
  const editorRef = useRef<MDXEditorMethods>(null);
  const theme = useThemeStore((state) => state.theme);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Register editor ref with store on mount
  useEffect(() => {
    setEditorRef(editorRef);
  }, [setEditorRef]);

  // Detect effective dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      if (theme === 'dark') return true;
      if (theme === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    };
    
    setIsDarkMode(checkDarkMode());

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [theme]);

  // Reset editor when content changes (new file loaded)
  useEffect(() => {
    if (editorRef.current && content !== null) {
      editorRef.current.setMarkdown(content);
    }
  }, [content]);

  const plugins = useMemo(() => [
    // Core plugins
    headingsPlugin(),
    listsPlugin(),
    quotePlugin(),
    thematicBreakPlugin(),
    markdownShortcutPlugin(),
    
    // Link plugin with dialog
    linkPlugin(),
    linkDialogPlugin(),
    
    // Table support
    tablePlugin(),
    
    // Code blocks with syntax highlighting
    codeBlockPlugin({ defaultCodeBlockLanguage: "js" }),
    codeMirrorPlugin({
      codeBlockLanguages: {
        js: "JavaScript",
        ts: "TypeScript",
        tsx: "TypeScript (React)",
        jsx: "JavaScript (React)",
        css: "CSS",
        html: "HTML",
        json: "JSON",
        md: "Markdown",
        bash: "Bash",
        sh: "Shell",
        python: "Python",
        rust: "Rust",
      },
      codeMirrorExtensions: isDarkMode ? [oneDark] : [],
    }),
    
    // Search/find functionality
    searchPlugin(),
    
    // FindBar plugin - adds the search widget to top area
    realmPlugin({
      init: (realm) => {
        realm.pub(addTopAreaChild$, FindBarWrapper);
      },
    })(),
    
    // Toolbar with common formatting options
    toolbarPlugin({
      toolbarContents: () => (
        <>
          <UndoRedo />
          <Separator />
          <BoldItalicUnderlineToggles />
          <Separator />
          <BlockTypeSelect />
          <Separator />
          <CreateLink />
          <Separator />
          <ListsToggle />
          <Separator />
          <InsertTable />
          <Separator />
          <InsertCodeBlock />
        </>
      ),
    }),
  ], [isDarkMode]);

  if (content === null) {
    return null;
  }

  return (
    <div className="h-full w-full overflow-auto relative">
      <MDXEditor
        ref={editorRef}
        markdown={content}
        onChange={(newContent) => updateContent(newContent)}
        className="mdx-editor-container"
        contentEditableClassName="prose prose-sm max-w-none p-8"
        plugins={plugins}
      />
    </div>
  );
}
