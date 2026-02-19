import type { DirectoryPage, FileNode } from "../types";
import {
  clearWorkspaceHandle,
  loadWorkspaceHandle,
  saveWorkspaceHandle,
} from "./handle-store";

let workspaceHandle: FileSystemDirectoryHandle | null = null;
let workspacePath: string | null = null;

function ensureFsAccessSupport(): void {
  if (typeof window.showDirectoryPicker !== "function") {
    throw new Error("This browser does not support the File System Access API");
  }
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+|\/+$/g, "");
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

export async function clearWorkspace(): Promise<void> {
  workspaceHandle = null;
  workspacePath = null;
  await clearWorkspaceHandle();
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
