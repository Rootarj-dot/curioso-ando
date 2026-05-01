import { useCallback, useEffect, useRef, useState } from "react";
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
} from "lexical";
import { $createHeadingNode, $createQuoteNode, HeadingNode, QuoteNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, ListNode, ListItemNode } from "@lexical/list";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { $createImageNode, ImageNode } from "./ImageNode";
import { Bold, Italic, Underline, List, ListOrdered, Quote, Image as ImageIcon, Type } from "lucide-react";

interface BlockEditorProps {
  initialContent?: string;
  onChange: (content: string) => void;
  onInsertImageRequest?: () => void;
  onEditorReady?: (editor: LexicalEditor) => void;
}

const theme = {
  paragraph: "mb-2",
  heading: {
    h1: "text-3xl font-bold text-white mb-3",
    h2: "text-2xl font-bold text-white mb-2",
    h3: "text-xl font-bold text-white mb-2",
  },
  list: {
    ul: "list-disc pl-6 mb-2 text-gray-300",
    ol: "list-decimal pl-6 mb-2 text-gray-300",
    listitem: "mb-1",
  },
  quote: "border-l-4 pl-4 italic text-gray-400 my-3",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    code: "font-mono bg-gray-800 px-1 rounded",
  },
  image: "max-w-full rounded-lg my-3",
};

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
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, updateToolbar]);

  const format = (type: "bold" | "italic" | "underline") => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, type);
  };

  const setHeading = (tag: "h1" | "h2" | "h3") => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(tag));
      }
    });
  };

  const insertList = (type: "bullet" | "number") => {
    if (type === "bullet") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  };

  const insertQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  };

  if (!isVisible) return null;

  return (
    <div
      ref={toolbarRef}
      className="floating-toolbar"
      style={{ top: position.top, left: position.left }}
    >
      <button onClick={() => format("bold")} className={formats.bold ? "active" : ""} title="Negrita">
        <Bold className="w-4 h-4" />
      </button>
      <button onClick={() => format("italic")} className={formats.italic ? "active" : ""} title="Cursiva">
        <Italic className="w-4 h-4" />
      </button>
      <button onClick={() => format("underline")} className={formats.underline ? "active" : ""} title="Subrayado">
        <Underline className="w-4 h-4" />
      </button>
      <div style={{ width: 1, background: "#3B3D3E", margin: "0 2px" }} />
      <button onClick={() => setHeading("h2")} title="Título H2">
        <span className="text-xs font-bold">H2</span>
      </button>
      <button onClick={() => setHeading("h3")} title="Título H3">
        <span className="text-xs font-bold">H3</span>
      </button>
      <div style={{ width: 1, background: "#3B3D3E", margin: "0 2px" }} />
      <button onClick={() => insertList("bullet")} title="Lista">
        <List className="w-4 h-4" />
      </button>
      <button onClick={() => insertList("number")} title="Lista numerada">
        <ListOrdered className="w-4 h-4" />
      </button>
      <button onClick={insertQuote} title="Cita">
        <Quote className="w-4 h-4" />
      </button>
      {onInsertImageRequest && (
        <>
          <div style={{ width: 1, background: "#3B3D3E", margin: "0 2px" }} />
          <button onClick={onInsertImageRequest} title="Insertar imagen">
            <ImageIcon className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}

function Toolbar({ onInsertImageRequest }: { onInsertImageRequest?: () => void }) {
  const [editor] = useLexicalComposerContext();

  const format = (type: "bold" | "italic" | "underline") => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, type);
  };

  const setHeading = (tag: "h1" | "h2" | "h3") => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(tag));
      }
    });
  };

  const setParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1 p-2"
      style={{ borderBottom: "1px solid #3B3D3E", backgroundColor: "#252728" }}
    >
      <button onClick={setParagraph} className="px-2 py-1 rounded text-xs font-medium transition-colors" style={{ color: "#A0A0A0" }} title="Párrafo">
        <Type className="w-4 h-4" />
      </button>
      <button onClick={() => setHeading("h1")} className="px-2 py-1 rounded text-xs font-bold transition-colors" style={{ color: "#A0A0A0" }}>H1</button>
      <button onClick={() => setHeading("h2")} className="px-2 py-1 rounded text-xs font-bold transition-colors" style={{ color: "#A0A0A0" }}>H2</button>
      <button onClick={() => setHeading("h3")} className="px-2 py-1 rounded text-xs font-bold transition-colors" style={{ color: "#A0A0A0" }}>H3</button>
      <div style={{ width: 1, height: 20, background: "#3B3D3E", margin: "0 4px" }} />
      <button onClick={() => format("bold")} className="px-2 py-1 rounded transition-colors" style={{ color: "#A0A0A0" }} title="Negrita">
        <Bold className="w-4 h-4" />
      </button>
      <button onClick={() => format("italic")} className="px-2 py-1 rounded transition-colors" style={{ color: "#A0A0A0" }} title="Cursiva">
        <Italic className="w-4 h-4" />
      </button>
      <button onClick={() => format("underline")} className="px-2 py-1 rounded transition-colors" style={{ color: "#A0A0A0" }} title="Subrayado">
        <Underline className="w-4 h-4" />
      </button>
      <div style={{ width: 1, height: 20, background: "#3B3D3E", margin: "0 4px" }} />
      <button onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)} className="px-2 py-1 rounded transition-colors" style={{ color: "#A0A0A0" }} title="Lista">
        <List className="w-4 h-4" />
      </button>
      <button onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)} className="px-2 py-1 rounded transition-colors" style={{ color: "#A0A0A0" }} title="Lista numerada">
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        onClick={() => {
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              $setBlocksType(selection, () => $createQuoteNode());
            }
          });
        }}
        className="px-2 py-1 rounded transition-colors"
        style={{ color: "#A0A0A0" }}
        title="Cita"
      >
        <Quote className="w-4 h-4" />
      </button>
      {onInsertImageRequest && (
        <>
          <div style={{ width: 1, height: 20, background: "#3B3D3E", margin: "0 4px" }} />
          <button
            onClick={onInsertImageRequest}
            className="px-2 py-1 rounded transition-colors flex items-center gap-1 text-xs"
            style={{ color: "#A0A0A0" }}
            title="Insertar imagen"
          >
            <ImageIcon className="w-4 h-4" />
            Imagen
          </button>
        </>
      )}
    </div>
  );
}

// Plugin to expose the editor instance to parent
function EditorRefPlugin({ onReady }: { onReady: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    onReady(editor);
  }, [editor, onReady]);
  return null;
}

export function insertImageIntoEditor(editor: LexicalEditor, src: string, altText: string = "") {
  editor.update(() => {
    const imageNode = $createImageNode({ src, altText, maxWidth: 800 });
    $insertNodes([imageNode]);
  });
}

export function BlockEditor({ initialContent, onChange, onInsertImageRequest, onEditorReady }: BlockEditorProps) {
  const initialConfig = {
    namespace: "CuriosoAndoEditor",
    theme,
    onError: (error: Error) => console.error("[Editor]", error),
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode, ImageNode],
    editorState: initialContent && initialContent !== "{}" ? initialContent : undefined,
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
      </div>
    </LexicalComposer>
  );
}
