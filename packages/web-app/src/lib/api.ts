import type { DirectoryPage, FileNode } from "../types";
import * as fsService from "./fs-service";

export async function showOpenDialog(): Promise<string | null> {
  try {
    return await fsService.openWorkspace();
  } catch (error) {
    console.error("Failed to open workspace:", error);
    throw new Error(`Failed to open folder dialog: ${error}`);
  }
}

export async function getWorkspace(): Promise<string | null> {
  try {
    return await fsService.restoreWorkspace();
  } catch (error) {
    console.error("Failed to restore workspace:", error);
    throw new Error(`Failed to get workspace: ${error}`);
  }
}

export async function requestWorkspacePermission(): Promise<string | null> {
  try {
    return await fsService.requestWorkspacePermission();
  } catch (error) {
    console.error("Failed to request workspace permission:", error);
    throw new Error(`Failed to request workspace permission: ${error}`);
  }
}

export async function hasStoredWorkspace(): Promise<boolean> {
  try {
    return await fsService.hasStoredWorkspace();
  } catch (error) {
    console.error("Failed to check stored workspace:", error);
    throw new Error(`Failed to check stored workspace: ${error}`);
  }
}

export async function readDirectory(
  path: string,
  includeHidden: boolean = false
): Promise<FileNode> {
  try {
    return await fsService.readDirectory(path, includeHidden);
  } catch (error) {
    console.error("Failed to read directory:", error);
    throw new Error(`Failed to read directory "${path}": ${error}`);
  }
}

export async function getDirectoryPage(
  path: string,
  offset: number,
  limit: number,
  includeHidden: boolean = false
): Promise<DirectoryPage> {
  try {
    return await fsService.getDirectoryPage(path, offset, limit, includeHidden);
  } catch (error) {
    console.error("Failed to get directory page:", error);
    throw new Error(`Failed to get directory page "${path}": ${error}`);
  }
}

export async function readFile(path: string): Promise<string> {
  try {
    return await fsService.readFile(path);
  } catch (error) {
    console.error("Failed to read file:", error);
    throw new Error(`Failed to read file "${path}": ${error}`);
  }
}

export async function writeFile(path: string, content: string): Promise<void> {
  try {
    await fsService.writeFile(path, content);
  } catch (error) {
    console.error("Failed to write file:", error);
    throw new Error(`Failed to write file "${path}": ${error}`);
  }
}

export async function createFile(path: string): Promise<void> {
  try {
    await fsService.createFile(path);
  } catch (error) {
    console.error("Failed to create file:", error);
    throw new Error(String(error));
  }
}

export async function createFolder(path: string): Promise<void> {
  try {
    await fsService.createFolder(path);
  } catch (error) {
    console.error("Failed to create folder:", error);
    throw new Error(String(error));
  }
}

export async function renamePath(oldPath: string, newPath: string): Promise<void> {
  try {
    await fsService.renamePath(oldPath, newPath);
  } catch (error) {
    console.error("Failed to rename:", error);
    throw new Error(String(error));
  }
}

export async function deletePath(path: string): Promise<void> {
  try {
    await fsService.deletePath(path);
  } catch (error) {
    console.error("Failed to delete:", error);
    throw new Error(String(error));
  }
}

export async function clearWorkspace(): Promise<void> {
  try {
    await fsService.clearWorkspace();
  } catch (error) {
    console.error("Failed to clear workspace:", error);
    throw new Error(`Failed to clear workspace: ${error}`);
  }
}

export async function uploadImage(file: File): Promise<string> {
  return URL.createObjectURL(file);
}
