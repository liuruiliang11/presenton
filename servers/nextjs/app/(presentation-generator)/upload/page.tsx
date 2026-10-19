import React from "react";

import UploadPage from "./components/UploadPage";
import GenerateHeader from "./components/GenerateHeader";
import { Metadata } from "next";
import { normalizePresentationGenerationMode } from "@/utils/presentationGenerationMode";
import { isCommunityEnabled } from "@/utils/community";

export const metadata: Metadata = {
  title: "Presenton | 开源 AI 演示文稿生成器",
  description:
    "开源 AI 演示文稿生成器，支持自定义布局、多模型（OpenAI、Gemini、Ollama）以及 PDF/PPTX 导出。免费的 Gamma 替代方案。",
  alternates: {
    canonical: "https://presenton.ai/create",
  },
  keywords: [
    "演示文稿生成器",
    "AI 演示文稿",
    "数据可视化",
    "自动演示文稿制作",
    "专业幻灯片",
    "数据驱动演示文稿",
    "文档转演示文稿",
    "演示文稿自动化",
    "智能演示文稿工具",
    "商务演示文稿",
  ],
  openGraph: {
    title: "创建数据演示文稿 | PresentOn",
    description:
      "开源 AI 演示文稿生成器，支持自定义布局、多模型（OpenAI、Gemini、Ollama）以及 PDF/PPTX 导出。免费的 Gamma 替代方案。",
    type: "website",
    url: "https://presenton.ai/create",
    siteName: "PresentOn",
  },
  twitter: {
    card: "summary_large_image",
    title: "创建数据演示文稿 | PresentOn",
    description:
      "开源 AI 演示文稿生成器，支持自定义布局、多模型（OpenAI、Gemini、Ollama）以及 PDF/PPTX 导出。免费的 Gamma 替代方案。",
    site: "@presenton_ai",
    creator: "@presenton_ai",
  },
};

const page = () => {
  const presentationGenerationMode = normalizePresentationGenerationMode(
    process.env.PRESENTATION_GENERATION_MODE,
  );

  return (
    <div className="relative flex min-h-dvh flex-col">
      <GenerateHeader />
      <main className="flex flex-1 flex-col pb-10 pt-[46px]">
        <div className="mb-7 flex flex-col items-center justify-center gap-1.5 px-4 text-center">
          <h1 className="font-syne text-[36px] font-medium leading-normal tracking-[-0.58px] text-[#101323] sm:text-[48px] lg:text-[58px] lg:leading-[70px]">
            把想法变成幻灯片
          </h1>
          <p className="max-w-[609px] font-syne text-base leading-[1.4] tracking-[0.2px] text-[#101323CC] sm:text-xl">用 AI 将提示词或文档转化为演示文稿</p>
        </div>

        <UploadPage
          communityEnabled={isCommunityEnabled(process.env.PRESENTON_COMMUNITY_ENABLED)}
          presentationGenerationMode={presentationGenerationMode}
        />
      </main>
    </div>
  );
};

export default page;
