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
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  searchPlugin,
  toolbarPlugin,
  diffSourcePlugin,
  frontmatterPlugin,
  directivesPlugin,
  AdmonitionDirectiveDescriptor,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertTable,
  InsertCodeBlock,
  InsertThematicBreak,
  InsertFrontmatter,
  InsertAdmonition,
  ListsToggle,
  Separator,
  realmPlugin,
  addTopAreaChild$,
  viewMode$,
  useCellValue,
  usePublisher,
  ButtonWithTooltip,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { useEditorStore } from "../../stores/editorStore";
import { useThemeStore } from "../../stores/themeStore";
import { uploadImage } from "../../lib/api";
import { toast } from "sonner";
import { useRef, useEffect, useState, useMemo } from "react";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  sql,
  StandardSQL,
  PostgreSQL,
  MySQL,
  MSSQL,
  SQLite,
  PLSQL,
} from "@codemirror/lang-sql";
import { graphql } from "cm6-graphql";
import { FindBarWrapper } from "./FindBarWrapper";

/**
 * Custom source mode toggle that only toggles between rich-text and source
 * (excludes diff mode)
 */
function SourceOnlyToggle() {
  const viewMode = useCellValue(viewMode$);
  const setViewMode = usePublisher(viewMode$);

  return (
    <ButtonWithTooltip
      title="Toggle Source Mode"
      onClick={() => {
        // Toggle only between 'rich-text' and 'source' (skip 'diff')
        setViewMode(viewMode === 'source' ? 'rich-text' : 'source');
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    </ButtonWithTooltip>
  );
}


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

  // Image upload handler for paste/drop
  const imageUploadHandler = async (file: File): Promise<string> => {
    try {
      const assetUrl = await uploadImage(file);
      toast.success("Image uploaded successfully");
      return assetUrl;
    } catch (error) {
      console.error("Failed to upload image:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload image";
      toast.error(errorMessage);
      throw error;
    }
  };

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
    
    // Image plugin with upload handler
    imagePlugin({
      imageUploadHandler,
    }),
    
    // Table support
    tablePlugin(),
    
    // Source mode toggle (diff mode disabled)
    diffSourcePlugin({
      viewMode: 'rich-text',  // Start in WYSIWYG mode
      diffMarkdown: '',        // No diff comparison
      readOnlyDiff: true,      // Make diff mode read-only (discourages use)
    }),
    
    // Front-matter support for metadata
    frontmatterPlugin(),
    
    // Directives (admonitions/callouts)
    directivesPlugin({
      directiveDescriptors: [AdmonitionDirectiveDescriptor],
    }),
    
    // Code blocks with syntax highlighting
    codeBlockPlugin({ defaultCodeBlockLanguage: "sql" }),
    codeMirrorPlugin({
      codeBlockLanguages: {
        // Programming languages
        js: "JavaScript",
        ts: "TypeScript",
        tsx: "TypeScript (React)",
        jsx: "JavaScript (React)",
        python: "Python",
        rust: "Rust",
        
        // Markup & data
        html: "HTML",
        css: "CSS",
        json: "JSON",
        md: "Markdown",
        graphql: "GraphQL",
        
        // Shell
        bash: "Bash",
        sh: "Shell",
        
        // SQL dialects
        sql: "SQL",
        postgres: "PostgreSQL",
        mysql: "MySQL",
        tsql: "T-SQL",
        sqlite: "SQLite",
        plsql: "PL/SQL",
      },
      codeMirrorExtensions: [
        ...(isDarkMode ? [oneDark] : []),
        // SQL dialect extensions
        sql({ dialect: StandardSQL }),
        sql({ dialect: PostgreSQL }),
        sql({ dialect: MySQL }),
        sql({ dialect: MSSQL }),
        sql({ dialect: SQLite }),
        sql({ dialect: PLSQL }),
        // GraphQL extension
        graphql(),
      ],
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
          {/* Source mode toggle */}
          <SourceOnlyToggle />
          <Separator />
          
          {/* Core editing */}
          <UndoRedo />
          <Separator />
          
          {/* Text formatting */}
          <BoldItalicUnderlineToggles />
          <Separator />
          
          {/* Block types */}
          <BlockTypeSelect />
          <Separator />
          
          {/* Links */}
          <CreateLink />
          <Separator />
          
          {/* Lists */}
          <ListsToggle />
          <Separator />
          
          {/* Structure elements */}
          <InsertTable />
          <InsertCodeBlock />
          <InsertThematicBreak />
          <Separator />
          
          {/* Metadata & callouts */}
          <InsertFrontmatter />
          <InsertAdmonition />
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
