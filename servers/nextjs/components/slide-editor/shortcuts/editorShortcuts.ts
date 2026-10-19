export type EditorShortcutKey =
  | "Mod"
  | "Shift"
  | "Alt"
  | "Click"
  | "Backspace"
  | "Delete"
  | "ArrowLeft"
  | "ArrowRight"
  | "ArrowUp"
  | "ArrowDown"
  | "C"
  | "G"
  | "J"
  | "K"
  | "V"
  | "Y"
  | "Z"
  | "?";

export type EditorShortcut = {
  id:
    | "multi-select"
    | "group"
    | "delete"
    | "copy"
    | "paste"
    | "undo"
    | "redo"
    | "bring-forward"
    | "bring-to-front"
    | "send-backward"
    | "send-to-back"
    | "previous-slide"
    | "next-slide"
    | "shortcut-help";
  label: string;
  description: string;
  chords: EditorShortcutKey[][];
};

export type EditorShortcutSection = {
  id: "selection" | "editing" | "arrange" | "navigation" | "help";
  title: string;
  description: string;
  shortcuts: EditorShortcut[];
};

const ARROW_KEY_LABELS: Partial<Record<EditorShortcutKey, string>> = {
  ArrowLeft: "←",
  ArrowRight: "→",
  ArrowUp: "↑",
  ArrowDown: "↓",
};

export const EDITOR_SHORTCUT_SECTIONS: EditorShortcutSection[] = [
  {
    id: "selection",
    title: "选择",
    description: "在当前幻灯片上选择并整理对象。",
    shortcuts: [
      {
        id: "multi-select",
        label: "加入选择",
        description: "按住 Shift 点击以添加或移除对象。",
        chords: [["Shift", "Click"]],
      },
      {
        id: "group",
        label: "组合对象",
        description: "将两个或更多选中对象组合为一组。",
        chords: [["Mod", "G"]],
      },
      {
        id: "delete",
        label: "删除选中项",
        description: "从幻灯片中移除选中的对象。",
        chords: [["Backspace"], ["Delete"]],
      },
    ],
  },
  {
    id: "editing",
    title: "编辑",
    description: "幻灯片对象的常用编辑命令。",
    shortcuts: [
      {
        id: "undo",
        label: "撤销",
        description: "撤销当前幻灯片上的上一次更改。",
        chords: [["Mod", "Z"]],
      },
      {
        id: "redo",
        label: "重做",
        description: "恢复最近撤销的幻灯片更改。",
        chords: [["Mod", "Shift", "Z"], ["Mod", "Y"]],
      },
      {
        id: "copy",
        label: "复制选中项",
        description: "复制选中的对象。",
        chords: [["Mod", "C"]],
      },
      {
        id: "paste",
        label: "粘贴",
        description: "粘贴已复制的对象，并略微偏移位置。",
        chords: [["Mod", "V"]],
      },
    ],
  },
  {
    id: "arrange",
    title: "排列",
    description: "更改选中对象的图层位置。",
    shortcuts: [
      {
        id: "bring-forward",
        label: "上移一层",
        description: "将选中对象向前移动一层。",
        chords: [["Alt", "K"]],
      },
      {
        id: "bring-to-front",
        label: "置于顶层",
        description: "将选中对象移到所有对象之上。",
        chords: [["Shift", "Alt", "K"]],
      },
      {
        id: "send-backward",
        label: "下移一层",
        description: "将选中对象向后移动一层。",
        chords: [["Alt", "J"]],
      },
      {
        id: "send-to-back",
        label: "置于底层",
        description: "将选中对象移到所有对象之下。",
        chords: [["Shift", "Alt", "J"]],
      },
    ],
  },
  {
    id: "navigation",
    title: "幻灯片导航",
    description: "在不离开画布的情况下切换幻灯片。",
    shortcuts: [
      {
        id: "previous-slide",
        label: "上一张幻灯片",
        description: "打开当前幻灯片的上一张。",
        chords: [["ArrowLeft"], ["ArrowUp"]],
      },
      {
        id: "next-slide",
        label: "下一张幻灯片",
        description: "打开当前幻灯片的下一张。",
        chords: [["ArrowRight"], ["ArrowDown"]],
      },
    ],
  },
  {
    id: "help",
    title: "帮助",
    description: "快速打开本参考。",
    shortcuts: [
      {
        id: "shortcut-help",
        label: "键盘快捷键",
        description: "打开此键盘快捷键指南。",
        chords: [["?"]],
      },
    ],
  },
];

export function editorShortcutById(id: EditorShortcut["id"]) {
  return EDITOR_SHORTCUT_SECTIONS.flatMap(
    (section) => section.shortcuts,
  ).find((shortcut) => shortcut.id === id);
}

export function shortcutKeyLabel(
  key: EditorShortcutKey,
  applePlatform: boolean,
) {
  const arrowLabel = ARROW_KEY_LABELS[key];
  if (arrowLabel) return arrowLabel;

  if (!applePlatform) {
    if (key === "Mod") return "Ctrl";
    return key;
  }

  switch (key) {
    case "Mod":
      return "⌘";
    case "Shift":
      return "⇧";
    case "Alt":
      return "⌥";
    case "Backspace":
      return "⌫";
    default:
      return key;
  }
}
