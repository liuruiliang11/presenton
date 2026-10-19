"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, CirclePlus } from "lucide-react";
import { toast } from "sonner";
import CreateCustomTemplate from "./CreateCustomTemplate";
import Link from "next/link";
import { trackEvent, MixpanelEvent } from "@/utils/mixpanel";
import { ensureTailwindBrowserScript } from "@/lib/tailwind-browser";
import { useTemplateSummaries, TemplateTab } from "../../../hooks/useTemplateSummaries";
import {
  ProcessingTemplateListCard,
  TemplateListLoadingState,
  TemplateListEmptyState,
} from "../../../components/TemplateListUi";
import {
  compareTemplateLibraryItems,
  TemplateLibraryCard,
  TemplateLibraryControls,
  type TemplateLibrarySort,
} from "./TemplateLibraryUi";

const LayoutPreview = () => {
  const [tab, setTab] = useState<TemplateTab>("default");
  const router = useRouter();
  const {
    defaultTemplates,
    customTemplates,
    processingTemplateTasks,
    retryTemplateTask,
    loading,
    error,
  } = useTemplateSummaries({ includeProcessingTemplateTasks: true });
  const [retryingTaskId, setRetryingTaskId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<TemplateLibrarySort>("name-asc");

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (requestedTab === "custom" || requestedTab === "default") {
      setTab(requestedTab);
    }

    trackEvent(MixpanelEvent.Templates_Page_Viewed);
    ensureTailwindBrowserScript();
  }, []);

  const handleOpenTemplate = useCallback(
    (templateId: string, templateName: string, isDefault: boolean) => {
      trackEvent(
        isDefault
          ? MixpanelEvent.Templates_Inbuilt_Opened
          : MixpanelEvent.Templates_Custom_Opened,
        {
          template_id: templateId,
          template_name: templateName,
        }
      );
      router.push(`/template-preview?templateV2Id=${templateId}`);
    },
    [router]
  );

  const handleTabChange = useCallback((nextTab: TemplateTab) => {
    trackEvent(MixpanelEvent.Templates_Tab_Switched, { tab: nextTab });
    setTab(nextTab);
  }, []);

  const handleRetryTemplate = useCallback(
    async (taskId: string) => {
      setRetryingTaskId(taskId);
      try {
        await retryTemplateTask(taskId);
        toast.success("已重新开始生成模板");
      } catch (error) {
        toast.error("无法重试模板生成", {
          description:
            error instanceof Error ? error.message : "发生了意外错误",
        });
      } finally {
        setRetryingTaskId(null);
      }
    },
    [retryTemplateTask]
  );

  const activeTemplates = tab === "default" ? defaultTemplates : customTemplates;
  const normalizedQuery = query.trim().toLowerCase();
  const visibleTemplates = useMemo(
    () => activeTemplates
      .filter((template) => [template.name, template.description]
        .some((value) => value?.toLowerCase().includes(normalizedQuery)))
      .sort((left, right) => compareTemplateLibraryItems(left, right, sort)),
    [activeTemplates, normalizedQuery, sort],
  );
  const visibleTasks = useMemo(
    () => processingTemplateTasks
      .filter((task) => [task.data?.name || "新模板", task.message]
        .some((value) => value?.toLowerCase().includes(normalizedQuery)))
      .sort((left, right) => compareTemplateLibraryItems(
        { name: left.data?.name, created_at: left.created_at },
        { name: right.data?.name, created_at: right.created_at },
        sort,
      )),
    [processingTemplateTasks, normalizedQuery, sort],
  );

  return (
    <div className="relative min-h-screen min-w-0 font-syne">
      <div className="sticky top-0 right-0 z-50 py-[28px] px-6 backdrop-blur">
        <div className="flex xl:flex-row flex-col gap-6 xl:gap-0 items-center justify-between">
          <h3 className="text-[28px] tracking-[-0.84px] font-syne font-normal text-[#101828] flex items-center gap-2">
            模板
          </h3>
          <div className="flex gap-2.5 max-sm:w-full max-md:justify-center max-sm:flex-wrap">
            <Link
              href="/custom-template"
              onClick={() => trackEvent(MixpanelEvent.Templates_New_Template_Clicked)}
              className="inline-flex items-center font-syne font-semibold gap-2 rounded-xl px-4 py-2.5 text-black text-sm shadow-sm hover:shadow-md"
              aria-label="创建新模板"
              style={{
                borderRadius: "48px",
                background:
                  "linear-gradient(270deg, #D5CAFC 2.4%, #E3D2EB 27.88%, #F4DCD3 69.23%, #FDE4C2 100%)",
              }}
            >
              <span className="hidden md:inline">新建模板</span>
              <span className="md:hidden">新建</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <section aria-label="模板库" className="mx-auto flex min-w-0 flex-col gap-5 px-4 pb-8 pt-[19px] sm:pl-6 sm:pr-2">
        <p className="flex min-h-[26px] flex-wrap items-center gap-1.5 text-base font-medium text-[#191919]">
          <span>选择模板，或</span>
          <Link href="/custom-template" onClick={() => trackEvent(MixpanelEvent.Templates_New_Template_Clicked)} className="inline-flex items-center gap-1.5 rounded outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#7A5AF8]/30">
            <CirclePlus aria-hidden="true" className="h-4 w-4 text-[#7A5AF8]" strokeWidth={1.67} />自行创建。
          </Link>
        </p>
        <TemplateLibraryControls tab={tab} onTabChange={handleTabChange} query={query} onQueryChange={setQuery} sort={sort} onSortChange={setSort} />

        <div aria-live="polite" aria-busy={loading}>
          {loading ? (
            <TemplateListLoadingState />
          ) : error ? (
            <TemplateListEmptyState message={`无法加载模板：${error}`} />
          ) : tab === "custom" ? (
            <>
              <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
                <CreateCustomTemplate libraryPage />
                {visibleTasks.map((task) => (
                  <ProcessingTemplateListCard
                    key={task.id}
                    task={task}
                    retrying={retryingTaskId === task.id}
                    onRetry={() => void handleRetryTemplate(task.id)}
                  />
                ))}
                {visibleTemplates.map((template) => (
                  <TemplateLibraryCard
                    key={template.id}
                    template={template}
                    onOpen={() => handleOpenTemplate(template.id, template.name, false)}
                  />
                ))}
              </div>
              {normalizedQuery && visibleTemplates.length === 0 && visibleTasks.length === 0 && <TemplateListEmptyState message="没有符合搜索条件的模板。" />}
            </>
          ) : visibleTemplates.length === 0 ? (
            <TemplateListEmptyState message={normalizedQuery ? "没有符合搜索条件的模板。" : "暂无内置模板。"} />
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              {visibleTemplates.map((template) => (
                <TemplateLibraryCard
                  key={template.id}
                  template={template}
                  onOpen={() => handleOpenTemplate(template.id, template.name, true)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default LayoutPreview;
