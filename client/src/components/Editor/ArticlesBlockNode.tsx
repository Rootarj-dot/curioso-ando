/**
 * ArticlesBlockNode — Lexical custom node for inserting a block of
 * recent or recommended articles inside an article's content.
 *
 * Stored as JSON: { type: "articles-block", blockType: "recent"|"recommended", count: number }
 * Rendered in the editor as a visual placeholder.
 * Rendered on the public page as real article cards.
 */
import {
  DecoratorNode,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { ReactNode } from "react";
import { Newspaper, Star } from "lucide-react";

export type ArticlesBlockType = "recent" | "recommended";

export type SerializedArticlesBlockNode = Spread<
  {
    blockType: ArticlesBlockType;
    count: number;
  },
  SerializedLexicalNode
>;

export class ArticlesBlockNode extends DecoratorNode<ReactNode> {
  __blockType: ArticlesBlockType;
  __count: number;

  static getType(): string {
    return "articles-block";
  }

  static clone(node: ArticlesBlockNode): ArticlesBlockNode {
    return new ArticlesBlockNode(node.__blockType, node.__count, node.__key);
  }

  constructor(blockType: ArticlesBlockType, count: number, key?: NodeKey) {
    super(key);
    this.__blockType = blockType;
    this.__count = count;
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.style.display = "block";
    return div;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedArticlesBlockNode): ArticlesBlockNode {
    return new ArticlesBlockNode(serializedNode.blockType, serializedNode.count);
  }

  exportJSON(): SerializedArticlesBlockNode {
    return {
      type: "articles-block",
      version: 1,
      blockType: this.__blockType,
      count: this.__count,
    };
  }

  decorate(): ReactNode {
    const label = this.__blockType === "recent" ? "Artículos Recientes" : "Artículos Recomendados";
    const Icon = this.__blockType === "recent" ? Newspaper : Star;
    return (
      <div
        contentEditable={false}
        style={{
          border: "2px dashed #7B4FB8",
          borderRadius: 10,
          padding: "16px 20px",
          margin: "16px 0",
          background: "#F3EEFF",
          display: "flex",
          alignItems: "center",
          gap: 12,
          userSelect: "none",
          cursor: "default",
        }}
      >
        <Icon style={{ color: "#7B4FB8", width: 22, height: 22, flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, color: "#2B037D", fontSize: 14 }}>{label}</div>
          <div style={{ color: "#6B6B6B", fontSize: 12 }}>
            Mostrará {this.__count} artículo{this.__count !== 1 ? "s" : ""} al publicar
          </div>
        </div>
      </div>
    );
  }
}

export function $createArticlesBlockNode(
  blockType: ArticlesBlockType,
  count: number
): ArticlesBlockNode {
  return new ArticlesBlockNode(blockType, count);
}

export function $isArticlesBlockNode(
  node: LexicalNode | null | undefined
): node is ArticlesBlockNode {
  return node instanceof ArticlesBlockNode;
}
