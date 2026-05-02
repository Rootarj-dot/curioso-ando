import { useState, useEffect, useRef, useCallback } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  $createParagraphNode,
  $insertNodes,
  EditorState,
  LexicalEditor,
  COMMAND_PRIORITY_LOW,
  $getRoot,
} from "lexical";
import { $createHeadingNode, $createQuoteNode, HeadingNode, QuoteNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, ListNode, ListItemNode } from "@lexical/list";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { $createImageNode, ImageNode } from "./ImageNode";
import {
  $createArticlesBlockNode,
  ArticlesBlockNode,
  ArticlesBlockType,
} from "./ArticlesBlockNode";
import { Bold, Italic, Underline, List, ListOrdered, Quote, Image as ImageIcon, Type, Newspaper } from "lucide-react";

interface BlockEditorProps {
  initialContent?: string;
  onChange: (content: string) => void;
  onInsertImageRequest?: () => void;
  onEditorReady?: (editor: LexicalEditor) => void;
}

const theme = {
  paragraph: "mb-2",
  heading: {
    h1: "text-3xl font-bold mb-3",
    h2: "text-2xl font-bold mb-2",
    h3: "text-xl font-bold mb-2",
  },
  list: {
    ul: "list-disc pl-6 mb-2",
    ol: "list-decimal pl-6 mb-2",
    listitem: "mb-1",
  },
  quote: "border-l-4 pl-4 italic my-3",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    code: "font-mono bg-gray-100 px-1 rounded",
  },
  image: "max-w-full rounded-lg my-3",
};

// ─── Articles Block Picker Popover ───────────────────────────────────────────
function ArticlesBlockPicker({ onInsert, onClose }: {
  onInsert: (blockType: ArticlesBlockType, count: number) => void;
  onClose: () => void;
}) {
  const [blockType, setBlockType] = useState<ArticlesBlockType>("recent");
  const [count, setCount] = useState(3);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: "calc(100% + 4px)",
        right: 0,
        zIndex: 100,
        background: "#fff",
        border: "1px solid #E5E3DE",
        borderRadius: 10,
        padding: 16,
        minWidth: 220,
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 13, color: "#1A1A1A", marginBottom: 10 }}>
        Insertar bloque de artículos
      </div>

      {/* Tipo */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: "#6B6B6B", marginBottom: 4 }}>Tipo</div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["recent", "recommended"] as ArticlesBlockType[]).map((t) => (
            <button
              key={t}
              onClick={() => setBlockType(t)}
              style={{
                flex: 1,
                padding: "6px 0",
                borderRadius: 6,
                border: "1px solid",
                borderColor: blockType === t ? "#7B4FB8" : "#E5E3DE",
                background: blockType === t ? "#F3EEFF" : "#F8F7F4",
                color: blockType === t ? "#2B037D" : "#6B6B6B",
                fontWeight: blockType === t ? 700 : 400,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {t === "recent" ? "Recientes" : "Recomendados"}
            </button>
          ))}
        </div>
      </div>

      {/* Cantidad */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#6B6B6B", marginBottom: 4 }}>
          Cantidad de artículos: <strong style={{ color: "#2B037D" }}>{count}</strong>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[2, 3, 4, 6].map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              style={{
                width: 36,
                height: 32,
                borderRadius: 6,
                border: "1px solid",
                borderColor: count === n ? "#7B4FB8" : "#E5E3DE",
                background: count === n ? "#F3EEFF" : "#F8F7F4",
                color: count === n ? "#2B037D" : "#6B6B6B",
                fontWeight: count === n ? 700 : 400,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => { onInsert(blockType, count); onClose(); }}
        style={{
          width: "100%",
          padding: "8px 0",
          borderRadius: 7,
          background: "linear-gradient(135deg, #2B037D, #5B2C8F)",
          color: "#fff",
          fontWeight: 700,
          fontSize: 13,
          border: "none",
          cursor: "pointer",
        }}
      >
        Insertar
      </button>
    </div>
  );
}

// ─── Floating Toolbar ─────────────────────────────────────────────────────────
function FloatingToolbar({ onInsertImageRequest }: { onInsertImageRequest?: () => void }) {
  const [editor] = useLexicalComposerContext();
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [formats, setFormats] = useState({ bold: false, italic: false, underline: false });
  const toolbarRef = useRef<HTMLDivElement>(null);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection) && !selection.isCollapsed()) {
      const nativeSelection = window.getSelection();
      if (nativeSelection && nativeSelection.rangeCount > 0) {
        const range = nativeSelection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setPosition({ top: rect.top + window.scrollY - 50, left: rect.left + rect.width / 2 });
        setIsVisible(true);
        setFormats({
          bold: selection.hasFormat("bold"),
          italic: selection.hasFormat("italic"),
          underline: selection.hasFormat("underline"),
        });
      }
    } else {
      setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => { updateToolbar(); return false; },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, updateToolbar]);

  const format = (type: "bold" | "italic" | "underline") => editor.dispatchCommand(FORMAT_TEXT_COMMAND, type);

  const setHeading = (tag: "h1" | "h2" | "h3") => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) $setBlocksType(selection, () => $createHeadingNode(tag));
    });
  };

  const insertList = (type: "bullet" | "number") => {
    if (type === "bullet") editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    else editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  };

  const insertQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) $setBlocksType(selection, () => $createQuoteNode());
    });
  };

  if (!isVisible) return null;

  return (
    <div ref={toolbarRef} className="floating-toolbar" style={{ top: position.top, left: position.left }}>
      <button onClick={() => format("bold")} className={formats.bold ? "active" : ""} title="Negrita"><Bold className="w-4 h-4" /></button>
      <button onClick={() => format("italic")} className={formats.italic ? "active" : ""} title="Cursiva"><Italic className="w-4 h-4" /></button>
      <button onClick={() => format("underline")} className={formats.underline ? "active" : ""} title="Subrayado"><Underline className="w-4 h-4" /></button>
      <div style={{ width: 1, background: "#E5E3DE", margin: "0 2px" }} />
      <button onClick={() => setHeading("h2")} title="Título H2"><span className="text-xs font-bold">H2</span></button>
      <button onClick={() => setHeading("h3")} title="Título H3"><span className="text-xs font-bold">H3</span></button>
      <div style={{ width: 1, background: "#E5E3DE", margin: "0 2px" }} />
      <button onClick={() => insertList("bullet")} title="Lista"><List className="w-4 h-4" /></button>
      <button onClick={() => insertList("number")} title="Lista numerada"><ListOrdered className="w-4 h-4" /></button>
      <button onClick={insertQuote} title="Cita"><Quote className="w-4 h-4" /></button>
      {onInsertImageRequest && (
        <>
          <div style={{ width: 1, background: "#E5E3DE", margin: "0 2px" }} />
          <button onClick={onInsertImageRequest} title="Insertar imagen"><ImageIcon className="w-4 h-4" /></button>
        </>
      )}
    </div>
  );
}

// ─── Main Toolbar ─────────────────────────────────────────────────────────────
function Toolbar({
  onInsertImageRequest,
  onInsertArticlesBlock,
}: {
  onInsertImageRequest?: () => void;
  onInsertArticlesBlock?: (blockType: ArticlesBlockType, count: number) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const [showArticlesPicker, setShowArticlesPicker] = useState(false);

  const format = (type: "bold" | "italic" | "underline") => editor.dispatchCommand(FORMAT_TEXT_COMMAND, type);

  const setHeading = (tag: "h1" | "h2" | "h3") => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) $setBlocksType(selection, () => $createHeadingNode(tag));
    });
  };

  const setParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) $setBlocksType(selection, () => $createParagraphNode());
    });
  };

  const handleInsertArticlesBlock = (blockType: ArticlesBlockType, count: number) => {
    editor.update(() => {
      const node = $createArticlesBlockNode(blockType, count);
      $insertNodes([node]);
    });
    onInsertArticlesBlock?.(blockType, count);
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1 p-2"
      style={{ borderBottom: "1px solid #E5E3DE", backgroundColor: "#F8F7F4" }}
    >
      <button onClick={setParagraph} className="px-2 py-1 rounded text-xs font-medium transition-colors" style={{ color: "#6B6B6B" }} title="Párrafo">
        <Type className="w-4 h-4" />
      </button>
      <button onClick={() => setHeading("h1")} className="px-2 py-1 rounded text-xs font-bold transition-colors" style={{ color: "#6B6B6B" }}>H1</button>
      <button onClick={() => setHeading("h2")} className="px-2 py-1 rounded text-xs font-bold transition-colors" style={{ color: "#6B6B6B" }}>H2</button>
      <button onClick={() => setHeading("h3")} className="px-2 py-1 rounded text-xs font-bold transition-colors" style={{ color: "#6B6B6B" }}>H3</button>
      <div style={{ width: 1, height: 20, background: "#E5E3DE", margin: "0 4px" }} />
      <button onClick={() => format("bold")} className="px-2 py-1 rounded transition-colors" style={{ color: "#6B6B6B" }} title="Negrita"><Bold className="w-4 h-4" /></button>
      <button onClick={() => format("italic")} className="px-2 py-1 rounded transition-colors" style={{ color: "#6B6B6B" }} title="Cursiva"><Italic className="w-4 h-4" /></button>
      <button onClick={() => format("underline")} className="px-2 py-1 rounded transition-colors" style={{ color: "#6B6B6B" }} title="Subrayado"><Underline className="w-4 h-4" /></button>
      <div style={{ width: 1, height: 20, background: "#E5E3DE", margin: "0 4px" }} />
      <button onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)} className="px-2 py-1 rounded transition-colors" style={{ color: "#6B6B6B" }} title="Lista"><List className="w-4 h-4" /></button>
      <button onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)} className="px-2 py-1 rounded transition-colors" style={{ color: "#6B6B6B" }} title="Lista numerada"><ListOrdered className="w-4 h-4" /></button>
      <button
        onClick={() => {
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) $setBlocksType(selection, () => $createQuoteNode());
          });
        }}
        className="px-2 py-1 rounded transition-colors"
        style={{ color: "#6B6B6B" }}
        title="Cita"
      >
        <Quote className="w-4 h-4" />
      </button>
      {onInsertImageRequest && (
        <>
          <div style={{ width: 1, height: 20, background: "#E5E3DE", margin: "0 4px" }} />
          <button
            onClick={onInsertImageRequest}
            className="px-2 py-1 rounded transition-colors flex items-center gap-1 text-xs"
            style={{ color: "#6B6B6B" }}
            title="Insertar imagen"
          >
            <ImageIcon className="w-4 h-4" />
            Imagen
          </button>
        </>
      )}
      {/* Articles block button */}
      <div style={{ width: 1, height: 20, background: "#E5E3DE", margin: "0 4px" }} />
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowArticlesPicker((v) => !v)}
          className="px-2 py-1 rounded transition-colors flex items-center gap-1 text-xs"
          style={{
            color: showArticlesPicker ? "#2B037D" : "#6B6B6B",
            background: showArticlesPicker ? "#F3EEFF" : "transparent",
            border: showArticlesPicker ? "1px solid #7B4FB8" : "1px solid transparent",
          }}
          title="Insertar bloque de artículos"
        >
          <Newspaper className="w-4 h-4" />
          Artículos
        </button>
        {showArticlesPicker && (
          <ArticlesBlockPicker
            onInsert={handleInsertArticlesBlock}
            onClose={() => setShowArticlesPicker(false)}
          />
        )}
      </div>
    </div>
  );
}

// ─── Plugins ──────────────────────────────────────────────────────────────────
function EditorRefPlugin({ onReady }: { onReady: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => { onReady(editor); }, [editor, onReady]);
  return null;
}

function ContentLoaderPlugin({ content }: { content: string }) {
  const [editor] = useLexicalComposerContext();
  const loadedRef = useRef(false);
  useEffect(() => {
    if (!content || content === "{}" || loadedRef.current) return;
    try {
      const parsed = JSON.parse(content);
      if (!parsed?.root) return;
      editor.update(() => {
        const editorState = editor.parseEditorState(content);
        editor.setEditorState(editorState);
      });
      loadedRef.current = true;
    } catch (e) {
      console.warn("[Editor] No se pudo cargar el contenido:", e);
    }
  }, [content, editor]);
  return null;
}

// ─── Public helpers ───────────────────────────────────────────────────────────
export function insertImageIntoEditor(editor: LexicalEditor, src: string, altText: string = "") {
  editor.update(() => {
    const imageNode = $createImageNode({ src, altText, maxWidth: 800 });
    $insertNodes([imageNode]);
  });
}

// ─── BlockEditor ──────────────────────────────────────────────────────────────
export function BlockEditor({ initialContent, onChange, onInsertImageRequest, onEditorReady }: BlockEditorProps) {
  const initialConfig = {
    namespace: "CuriosoAndoEditor",
    theme,
    onError: (error: Error) => console.error("[Editor]", error),
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode, ImageNode, ArticlesBlockNode],
  };

  const handleChange = (editorState: EditorState) => {
    const json = JSON.stringify(editorState.toJSON());
    onChange(json);
  };

  const handleEditorReady = useCallback((editor: LexicalEditor) => {
    onEditorReady?.(editor);
  }, [onEditorReady]);

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor-container">
        <Toolbar onInsertImageRequest={onInsertImageRequest} />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="editor-content"
                aria-placeholder="Escribe tu artículo aquí..."
                placeholder={
                  <div
                    className="absolute top-6 left-6 pointer-events-none select-none"
                    style={{ color: "#5A5C5E" }}
                  >
                    Escribe tu artículo aquí...
                  </div>
                }
              />
            }
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <FloatingToolbar onInsertImageRequest={onInsertImageRequest} />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <OnChangePlugin onChange={handleChange} />
        {onEditorReady && <EditorRefPlugin onReady={handleEditorReady} />}
        {initialContent && initialContent !== "{}" && <ContentLoaderPlugin content={initialContent} />}
      </div>
    </LexicalComposer>
  );
}
