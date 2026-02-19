import type { DirectoryPage, FileNode } from "../types";

const PLACEHOLDER_WORKSPACE = "web-workspace";

let workspacePath: string | null = null;

function nowIso(): string {
  return new Date().toISOString();
}

export async function showOpenDialog(): Promise<string | null> {
  workspacePath = PLACEHOLDER_WORKSPACE;
  return workspacePath;
}

export async function getWorkspace(): Promise<string | null> {
  return workspacePath;
}

export async function readDirectory(
  path: string,
  _includeHidden: boolean = false
): Promise<FileNode> {
  const pathParts = path.split("/").filter(Boolean);
  const fallbackName = pathParts.length > 0 ? pathParts[pathParts.length - 1] : "workspace";

  return {
    path,
    name: path === "." || path === "" ? "workspace" : fallbackName,
    is_file: false,
    size: null,
    modified: nowIso(),
    children: [],
  };
}

export async function getDirectoryPage(
  _path: string,
  _offset: number,
  _limit: number,
  _includeHidden: boolean = false
): Promise<DirectoryPage> {
  return {
    nodes: [],
    total_count: 0,
    has_more: false,
  };
}

export async function readFile(_path: string): Promise<string> {
  return "";
}

export async function writeFile(_path: string, _content: string): Promise<void> {
  return;
}

export async function createFile(_path: string): Promise<void> {
  return;
}

export async function createFolder(_path: string): Promise<void> {
  return;
}

export async function renamePath(_oldPath: string, _newPath: string): Promise<void> {
  return;
}

export async function deletePath(_path: string): Promise<void> {
  return;
}

export async function clearWorkspace(): Promise<void> {
  workspacePath = null;
}

export async function uploadImage(file: File): Promise<string> {
  return URL.createObjectURL(file);
}
