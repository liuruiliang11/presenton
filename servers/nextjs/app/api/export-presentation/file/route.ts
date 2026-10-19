import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";
import { authStatusForRequest } from "@/lib/server-auth-role";

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".zip": "application/zip",
};

function getExportsDirectory(): string {
  const appDataDirectory = process.env.APP_DATA_DIRECTORY?.trim();
  if (!appDataDirectory) {
    throw new Error("APP_DATA_DIRECTORY is required to download exported files.");
  }
  return path.join(appDataDirectory, "exports");
}

function getSafeExportName(
  request: NextRequest,
  userId: string | null,
  isAdmin: boolean,
): string | null {
  const decodedName = request.nextUrl.searchParams.get("name");

  if (
    !decodedName ||
    decodedName.includes("\\") ||
    path.isAbsolute(decodedName)
  ) {
    return null;
  }

  const normalized = path.normalize(decodedName);
  if (
    normalized === ".." ||
    normalized.startsWith(`..${path.sep}`)
  ) {
    return null;
  }
  if (!userId) return normalized;

  const parts = normalized.split(path.sep);
  if (parts[0] === "users") {
    return parts.length >= 3 && parts[1] === userId ? normalized : null;
  }
  return isAdmin && parts.length === 1 ? normalized : null;
}

function contentDisposition(filename: string): string {
  const safeName = path.basename(filename).replace(/[\r\n"]/g, "");
  const fallback = safeName.replace(/[^\x20-\x7E]/g, "_") || "presentation";
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(safeName)}`;
}

function preferredDownloadFilename(
  request: NextRequest,
  storedRelativePath: string
): string {
  const requested = request.nextUrl.searchParams.get("download");
  if (!requested) {
    return path.basename(storedRelativePath);
  }
  const cleaned = path
    .basename(requested)
    .replace(/[<>:"/\\|?*\x00-\x1f]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[-_.]{2,}/g, "-")
    .replace(/^[-_.]+|[-_.]+$/g, "");
  if (!cleaned) {
    return path.basename(storedRelativePath);
  }
  const storedExt = path.extname(storedRelativePath);
  if (storedExt && !cleaned.toLowerCase().endsWith(storedExt.toLowerCase())) {
    return `${cleaned}${storedExt}`;
  }
  return cleaned;
}

export async function GET(request: NextRequest) {
  const auth = await authStatusForRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  const filename = getSafeExportName(
    request,
    auth.user_id,
    auth.role === "admin",
  );
  if (!filename) {
    return NextResponse.json({ error: "Invalid export file name" }, { status: 400 });
  }

  try {
    const exportsDirectory = getExportsDirectory();
    const resolvedExportsDirectory = await fsPromises.realpath(exportsDirectory);
    const filePath = path.join(exportsDirectory, filename);
    const resolvedFilePath = await fsPromises.realpath(filePath);

    if (
      resolvedFilePath !== resolvedExportsDirectory &&
      !resolvedFilePath.startsWith(resolvedExportsDirectory + path.sep)
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const ext = path.extname(resolvedFilePath).toLowerCase();
    const stats = await fsPromises.stat(resolvedFilePath);
    const stream = Readable.toWeb(fs.createReadStream(resolvedFilePath));
    const downloadName = preferredDownloadFilename(request, filename);
    return new NextResponse(stream as unknown as BodyInit, {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Content-Disposition": contentDisposition(downloadName),
        "Content-Length": String(stats.size),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return NextResponse.json({ error: "Export file not found" }, { status: 404 });
    }

    console.error("[export-presentation:file]", error);
    return NextResponse.json(
      { error: "Failed to download export file" },
      { status: 500 }
    );
  }
}
