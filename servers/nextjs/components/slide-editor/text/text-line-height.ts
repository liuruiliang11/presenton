const TEXT_AVERAGE_CHAR_EM_LATIN = 0.52;
const TEXT_AVERAGE_CHAR_EM_CJK = 0.95;
const CJK_CHAR_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/;

export function shouldApplyLineHeight({
  text,
  width,
  fontSize,
  wrap,
}: {
  text: string;
  width: number;
  fontSize: number;
  wrap?: string | null;
}) {
  const lines = text.split(/\r?\n/);
  if (lines.length > 1) return true;
  if (wrap === "none") return false;
  if (!Number.isFinite(width) || width <= 0) return false;
  if (!Number.isFinite(fontSize) || fontSize <= 0) return false;

  const em = CJK_CHAR_RE.test(text)
    ? TEXT_AVERAGE_CHAR_EM_CJK
    : TEXT_AVERAGE_CHAR_EM_LATIN;
  const averageCharWidth = Math.max(1, fontSize * em);
  return lines.some((line) => line.length * averageCharWidth > width);
}

export function effectiveLineHeight({
  text,
  width,
  fontSize,
  lineHeight,
  fallback,
  wrap,
}: {
  text: string;
  width: number;
  fontSize: number;
  lineHeight: number | null | undefined;
  fallback: number;
  wrap?: string | null;
}) {
  return shouldApplyLineHeight({ text, width, fontSize, wrap })
    ? lineHeight ?? fallback
    : fallback;
}
