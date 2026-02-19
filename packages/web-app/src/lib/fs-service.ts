import type { DirectoryPage, FileNode } from "../types";
import {
  clearWorkspaceHandle,
  loadWorkspaceHandle,
  saveWorkspaceHandle,
} from "./handle-store";

let workspaceHandle: FileSystemDirectoryHandle | null = null;
let workspacePath: string | null = null;

const ALLOWED_IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg"]);
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const IMAGE_SOURCE_PASSTHROUGH_PATTERN = /^(https?:\/\/|data:|blob:|file:|\/\/)/i;

const imagePreviewCache = new Map<
  string,
  {
    url: string;
    size: number;
    lastModified: number;
  }
>();

function ensureFsAccessSupport(): void {
  if (typeof window.showDirectoryPicker !== "function") {
    throw new Error("This browser does not support the File System Access API");
  }
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+|\/+$/g, "");
}

function sanitizeFilename(filename: string): string {
  const sanitized = filename
    .split("")
    .map((char) => {
      if (/^[A-Za-z0-9._-]$/.test(char)) {
        return char;
      }
      return "_";
    })
    .join("")
    .replace(/^_+|_+$/g, "");

  return sanitized || "image";
}

function getFileExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === filename.length - 1) {
    return "";
  }
  return filename.slice(dotIndex + 1).toLowerCase();
}

function splitExtension(filename: string, extension: string): { name: string; extension: string } {
  if (!extension) {
    return { name: filename, extension: "" };
  }

  const suffix = `.${extension}`;
  if (!filename.toLowerCase().endsWith(suffix)) {
    return { name: filename, extension };
  }

  return {
    name: filename.slice(0, -suffix.length),
    extension,
  };
}

function getUtcMonthDirectory(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function isTypeMismatch(error: unknown): boolean {
  return error instanceof DOMException && error.name === "TypeMismatchError";
}

function clearImagePreviewCache(): void {
  for (const cached of imagePreviewCache.values()) {
    URL.revokeObjectURL(cached.url);
  }
  imagePreviewCache.clear();
}

function validateSegments(segments: string[]): void {
  for (const segment of segments) {
    if (!segment || segment === "." || segment === "..") {
      throw new Error(`Invalid path segment: ${segment}`);
    }
  }
}

function toRelativeSegments(path: string, currentWorkspacePath: string): string[] {
  const normalized = normalizePath(path);

  if (normalized === "" || normalized === ".") {
    return [];
  }

  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0) {
    return [];
  }

  validateSegments(segments);

  if (segments[0] === currentWorkspacePath) {
    return segments.slice(1);
  }

  return segments;
}

function buildWorkspacePath(currentWorkspacePath: string, segments: string[]): string {
  if (segments.length === 0) {
    return currentWorkspacePath;
  }
  return `${currentWorkspacePath}/${segments.join("/")}`;
}

function getDisplayName(currentWorkspacePath: string, segments: string[]): string {
  if (segments.length === 0) {
    return currentWorkspacePath;
  }
  return segments[segments.length - 1];
}

type FsHandle = FileSystemFileHandle | FileSystemDirectoryHandle;

function sortByTypeThenName(a: FsHandle, b: FsHandle): number {
  if (a.kind !== b.kind) {
    return a.kind === "directory" ? -1 : 1;
  }
  return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
}

async function ensureWorkspace(): Promise<{ handle: FileSystemDirectoryHandle; path: string }> {
  if (workspaceHandle && workspacePath) {
    return { handle: workspaceHandle, path: workspacePath };
  }

  const restored = await restoreWorkspace();
  if (!restored || !workspaceHandle) {
    throw new Error("No workspace selected");
  }

  return { handle: workspaceHandle, path: restored };
}

async function resolveDirectoryHandle(
  root: FileSystemDirectoryHandle,
  segments: string[],
  create: boolean
): Promise<FileSystemDirectoryHandle> {
  let current = root;
  for (const segment of segments) {
    current = await current.getDirectoryHandle(segment, { create });
  }
  return current;
}

async function getParentDirectoryAndName(
  root: FileSystemDirectoryHandle,
  pathSegments: string[],
  createParent: boolean
): Promise<{ parent: FileSystemDirectoryHandle; name: string }> {
  if (pathSegments.length === 0) {
    throw new Error("Path cannot reference workspace root");
  }

  const parentSegments = pathSegments.slice(0, -1);
  const name = pathSegments[pathSegments.length - 1];
  const parent = await resolveDirectoryHandle(root, parentSegments, createParent);
  return { parent, name };
}

function isNotFound(error: unknown): boolean {
  return error instanceof DOMException && error.name === "NotFoundError";
}

function splitPathAndSuffix(path: string): { basePath: string; suffix: string } {
  const queryIndex = path.indexOf("?");
  const hashIndex = path.indexOf("#");
  const firstSuffixIndex =
    queryIndex === -1
      ? hashIndex
      : hashIndex === -1
        ? queryIndex
        : Math.min(queryIndex, hashIndex);

  if (firstSuffixIndex === -1) {
    return { basePath: path, suffix: "" };
  }

  return {
    basePath: path.slice(0, firstSuffixIndex),
    suffix: path.slice(firstSuffixIndex),
  };
}

function resolveImageSourcePath(
  imageSource: string,
  currentWorkspacePath: string,
  currentDocumentPath: string | null
): string {
  const trimmedSource = imageSource.trim();
  const { basePath } = splitPathAndSuffix(trimmedSource);
  const normalizedSource = normalizePath(basePath);

  if (!normalizedSource) {
    throw new Error("Image path cannot be empty");
  }

  const sourceSegments = normalizedSource.split("/").filter(Boolean);
  const isWorkspaceAbsolute = basePath.startsWith("/");

  let segments: string[] = [];

  if (!isWorkspaceAbsolute && currentDocumentPath) {
    const documentSegments = toRelativeSegments(currentDocumentPath, currentWorkspacePath);
    segments = documentSegments.slice(0, -1);
  }

  for (const segment of sourceSegments) {
    if (segment === ".") {
      continue;
    }

    if (segment === "..") {
      if (segments.length === 0) {
        throw new Error("Image path cannot traverse outside workspace");
      }
      segments.pop();
      continue;
    }

    validateSegments([segment]);
    segments.push(segment);
  }

  if (segments.length === 0) {
    throw new Error("Image path must reference a file");
  }

  return buildWorkspacePath(currentWorkspacePath, segments);
}

async function getExistingHandle(
  directory: FileSystemDirectoryHandle,
  name: string
): Promise<FileSystemFileHandle | FileSystemDirectoryHandle | null> {
  try {
    return await directory.getFileHandle(name);
  } catch (error) {
    if (!isNotFound(error)) {
      if (!(error instanceof DOMException && error.name === "TypeMismatchError")) {
        throw error;
      }
    }
  }

  try {
    return await directory.getDirectoryHandle(name);
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    if (error instanceof DOMException && error.name === "TypeMismatchError") {
      return null;
    }
    throw error;
  }
}

async function copyFileTo(
  source: FileSystemFileHandle,
  destinationDirectory: FileSystemDirectoryHandle,
  destinationName: string
): Promise<void> {
  const sourceFile = await source.getFile();
  const targetHandle = await destinationDirectory.getFileHandle(destinationName, { create: true });
  const writable = await targetHandle.createWritable();
  try {
    await writable.write(await sourceFile.arrayBuffer());
  } finally {
    await writable.close();
  }
}

async function copyDirectoryTo(
  source: FileSystemDirectoryHandle,
  destinationDirectory: FileSystemDirectoryHandle,
  destinationName: string
): Promise<void> {
  const targetDirectory = await destinationDirectory.getDirectoryHandle(destinationName, { create: true });

  for await (const [entryName, entryHandle] of source.entries()) {
    if (entryHandle.kind === "directory") {
      await copyDirectoryTo(entryHandle, targetDirectory, entryName);
    } else {
      await copyFileTo(entryHandle, targetDirectory, entryName);
    }
  }
}

async function toFileNode(
  handle: FsHandle,
  parentSegments: string[],
  currentWorkspacePath: string
): Promise<FileNode> {
  const segments = [...parentSegments, handle.name];
  const path = buildWorkspacePath(currentWorkspacePath, segments);

  if (handle.kind === "directory") {
    return {
      path,
      name: handle.name,
      is_file: false,
      size: null,
      modified: null,
      children: null,
    };
  }

  const file = await handle.getFile();
  return {
    path,
    name: handle.name,
    is_file: true,
    size: file.size,
    modified: new Date(file.lastModified).toISOString(),
    children: null,
  };
}

async function listDirectoryNodes(
  directory: FileSystemDirectoryHandle,
  parentSegments: string[],
  currentWorkspacePath: string,
  includeHidden: boolean
): Promise<FileNode[]> {
  const entries: FsHandle[] = [];

  for await (const [, handle] of directory.entries()) {
    if (!includeHidden && handle.name.startsWith(".")) {
      continue;
    }
    entries.push(handle);
  }

  entries.sort(sortByTypeThenName);

  const nodes: FileNode[] = [];
  for (const handle of entries) {
    nodes.push(await toFileNode(handle, parentSegments, currentWorkspacePath));
  }

  return nodes;
}

export async function openWorkspace(): Promise<string> {
  ensureFsAccessSupport();

  const handle = await window.showDirectoryPicker({ mode: "readwrite" });
  workspaceHandle = handle;
  workspacePath = handle.name;
  clearImagePreviewCache();
  await saveWorkspaceHandle(handle);

  return handle.name;
}

export async function restoreWorkspace(): Promise<string | null> {
  if (workspaceHandle && workspacePath) {
    return workspacePath;
  }

  const handle = await loadWorkspaceHandle();
  if (!handle) {
    return null;
  }

  if (!handle.queryPermission) {
    return null;
  }

  const permission = await handle.queryPermission({ mode: "readwrite" });
  if (permission !== "granted") {
    return null;
  }

  workspaceHandle = handle;
  workspacePath = handle.name;
  return workspacePath;
}

export async function requestWorkspacePermission(): Promise<string | null> {
  let handle = workspaceHandle;

  if (!handle) {
    handle = await loadWorkspaceHandle();
  }

  if (!handle || !handle.requestPermission) {
    return null;
  }

  const permission = await handle.requestPermission({ mode: "readwrite" });
  if (permission !== "granted") {
    return null;
  }

  workspaceHandle = handle;
  workspacePath = handle.name;
  await saveWorkspaceHandle(handle);

  return workspacePath;
}

export async function hasStoredWorkspace(): Promise<boolean> {
  if (workspaceHandle && workspacePath) {
    return true;
  }

  const handle = await loadWorkspaceHandle();
  return handle !== null;
}

export async function clearWorkspace(): Promise<void> {
  workspaceHandle = null;
  workspacePath = null;
  clearImagePreviewCache();
  await clearWorkspaceHandle();
}

async function fileExists(directory: FileSystemDirectoryHandle, name: string): Promise<boolean> {
  try {
    await directory.getFileHandle(name);
    return true;
  } catch (error) {
    if (isNotFound(error) || isTypeMismatch(error)) {
      return isTypeMismatch(error);
    }
    throw error;
  }
}

export async function uploadImage(file: File): Promise<string> {
  const { handle: root } = await ensureWorkspace();

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(
      `Image size ${file.size} bytes exceeds maximum of ${MAX_IMAGE_SIZE} bytes (10MB)`
    );
  }

  const sanitizedFilename = sanitizeFilename(file.name);

  if (sanitizedFilename.includes("/") || sanitizedFilename.includes("\\")) {
    throw new Error("Filename cannot contain path separators");
  }

  const extension = getFileExtension(sanitizedFilename);
  if (!ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    throw new Error(
      `Unsupported image format. Allowed: ${Array.from(ALLOWED_IMAGE_EXTENSIONS).join(", ")}`
    );
  }

  const now = new Date();
  const monthDirectory = getUtcMonthDirectory(now);

  const assetsDirectory = await root.getDirectoryHandle("assets", { create: true });
  const monthHandle = await assetsDirectory.getDirectoryHandle(monthDirectory, { create: true });

  const { name: baseName } = splitExtension(sanitizedFilename, extension);

  let finalFilename = sanitizedFilename;
  let collisionAttempt = 0;

  while (await fileExists(monthHandle, finalFilename)) {
    const timestamp = Math.floor(Date.now() / 1000);
    const collisionSuffix = collisionAttempt === 0 ? `${timestamp}` : `${timestamp}-${collisionAttempt}`;
    finalFilename = `${baseName}-${collisionSuffix}.${extension}`;
    collisionAttempt += 1;
  }

  const fileHandle = await monthHandle.getFileHandle(finalFilename, { create: true });
  const writable = await fileHandle.createWritable();

  try {
    await writable.write(await file.arrayBuffer());
  } finally {
    await writable.close();
  }

  return `assets/${monthDirectory}/${finalFilename}`;
}

export async function resolveImagePreviewSource(
  imageSource: string,
  currentDocumentPath: string | null
): Promise<string> {
  const trimmedSource = imageSource.trim();
  if (!trimmedSource || IMAGE_SOURCE_PASSTHROUGH_PATTERN.test(trimmedSource)) {
    return imageSource;
  }

  const { handle: root, path: currentWorkspacePath } = await ensureWorkspace();
  const resolvedPath = resolveImageSourcePath(trimmedSource, currentWorkspacePath, currentDocumentPath);

  const segments = toRelativeSegments(resolvedPath, currentWorkspacePath);
  const { parent, name } = await getParentDirectoryAndName(root, segments, false);
  const fileHandle = await parent.getFileHandle(name);
  const file = await fileHandle.getFile();

  const cached = imagePreviewCache.get(resolvedPath);
  if (cached && cached.size === file.size && cached.lastModified === file.lastModified) {
    return cached.url;
  }

  if (cached) {
    URL.revokeObjectURL(cached.url);
  }

  const objectUrl = URL.createObjectURL(file);
  imagePreviewCache.set(resolvedPath, {
    url: objectUrl,
    size: file.size,
    lastModified: file.lastModified,
  });

  return objectUrl;
}

export async function readFile(path: string): Promise<string> {
  const { handle: root, path: currentWorkspacePath } = await ensureWorkspace();
  const segments = toRelativeSegments(path, currentWorkspacePath);

  if (segments.length === 0) {
    throw new Error("Expected file path, received workspace root");
  }

  const { parent, name } = await getParentDirectoryAndName(root, segments, false);
  const fileHandle = await parent.getFileHandle(name);
  const file = await fileHandle.getFile();

  return file.text();
}

export async function writeFile(path: string, content: string): Promise<void> {
  const { handle: root, path: currentWorkspacePath } = await ensureWorkspace();
  const segments = toRelativeSegments(path, currentWorkspacePath);
  const { parent, name } = await getParentDirectoryAndName(root, segments, true);

  const fileHandle = await parent.getFileHandle(name, { create: true });
  const writable = await fileHandle.createWritable();

  try {
    await writable.write(content);
  } finally {
    await writable.close();
  }
}

export async function createFile(path: string): Promise<void> {
  const { handle: root, path: currentWorkspacePath } = await ensureWorkspace();
  const segments = toRelativeSegments(path, currentWorkspacePath);
  const { parent, name } = await getParentDirectoryAndName(root, segments, true);

  const existing = await getExistingHandle(parent, name);
  if (existing) {
    throw new Error(`Path already exists: ${path}`);
  }

  const fileHandle = await parent.getFileHandle(name, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.close();
}

export async function createFolder(path: string): Promise<void> {
  const { handle: root, path: currentWorkspacePath } = await ensureWorkspace();
  const segments = toRelativeSegments(path, currentWorkspacePath);

  if (segments.length === 0) {
    throw new Error("Cannot create workspace root");
  }

  let current = root;

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const isLast = index === segments.length - 1;

    if (isLast) {
      const existing = await getExistingHandle(current, segment);
      if (existing) {
        throw new Error(`Path already exists: ${path}`);
      }
    }

    current = await current.getDirectoryHandle(segment, { create: true });
  }
}

export async function deletePath(path: string): Promise<void> {
  const { handle: root, path: currentWorkspacePath } = await ensureWorkspace();
  const segments = toRelativeSegments(path, currentWorkspacePath);
  const { parent, name } = await getParentDirectoryAndName(root, segments, false);

  await parent.removeEntry(name, { recursive: true });
}

export async function renamePath(oldPath: string, newPath: string): Promise<void> {
  const { handle: root, path: currentWorkspacePath } = await ensureWorkspace();
  const oldSegments = toRelativeSegments(oldPath, currentWorkspacePath);
  const newSegments = toRelativeSegments(newPath, currentWorkspacePath);

  if (oldSegments.length === 0 || newSegments.length === 0) {
    throw new Error("Cannot rename workspace root");
  }

  if (oldSegments.join("/") === newSegments.join("/")) {
    return;
  }

  const oldInfo = await getParentDirectoryAndName(root, oldSegments, false);
  const oldHandle = await getExistingHandle(oldInfo.parent, oldInfo.name);
  if (!oldHandle) {
    throw new Error(`Path not found: ${oldPath}`);
  }

  if (
    oldHandle.kind === "directory" &&
    newSegments.length > oldSegments.length &&
    oldSegments.every((segment, index) => segment === newSegments[index])
  ) {
    throw new Error("Cannot move a folder into itself");
  }

  const newInfo = await getParentDirectoryAndName(root, newSegments, true);
  const destinationExisting = await getExistingHandle(newInfo.parent, newInfo.name);
  if (destinationExisting) {
    throw new Error(`Path already exists: ${newPath}`);
  }

  if (oldHandle.kind === "directory") {
    await copyDirectoryTo(oldHandle, newInfo.parent, newInfo.name);
  } else {
    await copyFileTo(oldHandle, newInfo.parent, newInfo.name);
  }

  await oldInfo.parent.removeEntry(oldInfo.name, { recursive: true });
}

export async function readDirectory(path: string, includeHidden: boolean = false): Promise<FileNode> {
  const { handle: root, path: currentWorkspacePath } = await ensureWorkspace();
  const segments = toRelativeSegments(path, currentWorkspacePath);
  const directory = await resolveDirectoryHandle(root, segments, false);
  const children = await listDirectoryNodes(directory, segments, currentWorkspacePath, includeHidden);

  return {
    path: buildWorkspacePath(currentWorkspacePath, segments),
    name: getDisplayName(currentWorkspacePath, segments),
    is_file: false,
    size: null,
    modified: null,
    children,
  };
}

export async function getDirectoryPage(
  path: string,
  offset: number,
  limit: number,
  includeHidden: boolean = false
): Promise<DirectoryPage> {
  if (offset < 0) {
    throw new Error("Offset must be >= 0");
  }
  if (limit <= 0) {
    throw new Error("Limit must be > 0");
  }

  const { handle: root, path: currentWorkspacePath } = await ensureWorkspace();
  const segments = toRelativeSegments(path, currentWorkspacePath);
  const directory = await resolveDirectoryHandle(root, segments, false);
  const allNodes = await listDirectoryNodes(directory, segments, currentWorkspacePath, includeHidden);

  return {
    nodes: allNodes.slice(offset, offset + limit),
    total_count: allNodes.length,
    has_more: offset + limit < allNodes.length,
  };
}
