"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { GenerationMode } from "@/utils/presentationGenerationMode";

const GUIDE_KEY = "presenton_generate_guide_v3";

export default function GenerateUserGuide({ mode, communityEnabled }: { mode: GenerationMode; communityEnabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const steps = [
    { target: "setup", title: "选择幻灯片设计方式", description: "智能模式会围绕内容生成布局。标准模式使用你选择的模板。在模式切换旁可设置页数、语言和高级设置。" },
    { target: "prompt", title: "填写演示文稿简介", description: "描述主题、受众和要点。使用回形针图标附加支持文档。处理文档时请选择语言。" },
    ...(mode === "smart" && communityEnabled ? [{ target: "designs", title: "可选：选择设计参考", description: "搜索社区设计，用眼睛按钮预览，然后点「使用」。菜单还可复用提示词。「我的设计」打开已保存演示文稿；「浏览全部」打开完整社区库。" }] : []),
    { target: "prompt", title: "生成演示文稿", description: "点击紫色箭头，或在简介框中按 Command/Ctrl + Enter。智能模式直接打开生成结果；标准模式先进入大纲与模板选择。在此页面按 ? 可重新打开本指南。" },
  ];
  const current = steps[Math.min(step, steps.length - 1)];

  useEffect(() => {
    try { if (localStorage.getItem(GUIDE_KEY) !== "seen") setOpen(true); } catch { /* The page remains usable without storage. */ }
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key !== "?" || target?.closest("input, textarea, [contenteditable=true], [role=dialog]") || document.querySelector("[role=dialog]")) return;
      event.preventDefault();
      setStep(0);
      setOpen(true);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const target = document.querySelector<HTMLElement>(`[data-generate-guide="${current.target}"]`);
    if (!target) return;
    const previousOutline = target.style.outline;
    const previousOffset = target.style.outlineOffset;
    target.style.outline = "2px solid #7A5AF8";
    target.style.outlineOffset = "6px";
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    return () => { target.style.outline = previousOutline; target.style.outlineOffset = previousOffset; };
  }, [open, current.target]);

  const close = () => {
    try { localStorage.setItem(GUIDE_KEY, "seen"); } catch { /* Closing does not depend on storage. */ }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) close(); }}>
      <DialogContent overlayClassName="bg-black/15 backdrop-blur-none" className="top-auto bottom-4 max-w-[440px] translate-y-0 rounded-xl border-[#EDEEEF] bg-white p-6 font-syne sm:bottom-6">
        <p className="text-xs text-[#7A5AF8]">用户指南 · 第 {Math.min(step + 1, steps.length)} / {steps.length} 步</p>
        <DialogTitle className="pr-4 text-lg text-[#191919]">{current.title}</DialogTitle>
        <DialogDescription className="text-sm leading-6 text-[#666666]">{current.description}</DialogDescription>
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={close} className="text-xs text-[#808080] hover:text-[#191919]">跳过指南</button>
          <div className="flex gap-2">
            {step > 0 && <Button variant="outline" onClick={() => setStep((value) => value - 1)}>返回</Button>}
            <Button className="bg-[#7A5AF8] text-white hover:bg-[#6847E8]" onClick={() => step >= steps.length - 1 ? close() : setStep((value) => value + 1)}>{step >= steps.length - 1 ? "开始使用" : "下一步"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
