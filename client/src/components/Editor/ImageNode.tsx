import {
  DecoratorNode,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { JSX } from "react";

export type SerializedImageNode = Spread<
  { src: string; altText: string; maxWidth: number; type: "image"; version: 1 },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __maxWidth: number;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__altText, node.__maxWidth, node.__key);
  }

  constructor(src: string, altText: string, maxWidth: number, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__maxWidth = maxWidth;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement("span");
    span.style.display = "block";
    return span;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { src, altText, maxWidth } = serializedNode;
    return $createImageNode({ src, altText, maxWidth });
  }

  exportJSON(): SerializedImageNode {
    return {
      src: this.__src,
      altText: this.__altText,
      maxWidth: this.__maxWidth,
      type: "image",
      version: 1,
    };
  }

  decorate(): JSX.Element {
    return (
      <img
        src={this.__src}
        alt={this.__altText}
        style={{ maxWidth: this.__maxWidth, maxHeight: 400, borderRadius: 8, margin: "8px 0", display: "block" }}
      />
    );
  }
}

export function $createImageNode({
  src,
  altText,
  maxWidth = 800,
}: {
  src: string;
  altText?: string;
  maxWidth?: number;
}): ImageNode {
  return new ImageNode(src, altText || "", maxWidth);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}
