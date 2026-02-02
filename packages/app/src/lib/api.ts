/**
 * Type-safe wrappers around Tauri commands
 * Provides centralized error handling and consistent API
 */

import { invoke } from "@tauri-apps/api/core";
import type { FileNode, DirectoryPage } from "../types";

/**
 * Parse and format API error messages for better user experience
 * @param error - Error from Tauri command
 * @returns User-friendly error message
 */
function formatApiError(error: unknown): string {
  const errorString = typeof error === 'string' ? error : String(error);
  
  // Parse common backend error types
  if (errorString.includes("FileNotFound") || errorString.includes("not found")) {
    return "File or folder no longer exists";
  } else if (errorString.includes("PermissionDenied") || errorString.includes("permission")) {
    return "Permission denied. Check file permissions";
  } else if (errorString.includes("InvalidPath") || errorString.includes("invalid")) {
    return "Invalid file name. Use only letters, numbers, and dashes";
  } else if (errorString.includes("AlreadyExists") || errorString.includes("already exists")) {
    return "A file or folder with this name already exists";
  } else if (errorString.includes("IoError")) {
    // Try to extract the specific IO error
    return errorString.split("IoError:")[1]?.trim() || "File system error occurred";
  }
  
  // Return original error if no match
  return errorString;
}


/**
 * Show native folder selection dialog
 * @returns Selected folder path or null if cancelled
 */
export async function showOpenDialog(): Promise<string | null> {
  try {
    const path = await invoke<string>("show_open_dialog");
    return path;
  } catch (error) {
    console.error("Failed to open dialog:", error);
    throw new Error(`Failed to open folder dialog: ${error}`);
  }
}

/**
 * Get current workspace path
 * @returns Workspace path or null if not set
 */
export async function getWorkspace(): Promise<string | null> {
  try {
    return await invoke<string | null>("get_workspace");
  } catch (error) {
    console.error("Failed to get workspace:", error);
    throw new Error(`Failed to get workspace: ${error}`);
  }
}

/**
 * Read directory contents with lazy loading
 * @param path Relative path to directory (use "." or "" for root)
 * @param includeHidden Whether to include hidden files
 * @returns FileNode with immediate children populated
 */
export async function readDirectory(
  path: string,
  includeHidden: boolean = false
): Promise<FileNode> {
  try {
    return await invoke<FileNode>("read_directory", {
      path,
      includeHidden,
    });
  } catch (error) {
    console.error("Failed to read directory:", error);
    throw new Error(`Failed to read directory "${path}": ${error}`);
  }
}

/**
 * Get paginated directory contents
 * @param path Relative path to directory
 * @param offset Number of items to skip
 * @param limit Maximum items to return
 * @param includeHidden Whether to include hidden files
 * @returns DirectoryPage with pagination info
 */
export async function getDirectoryPage(
  path: string,
  offset: number,
  limit: number,
  includeHidden: boolean = false
): Promise<DirectoryPage> {
  try {
    return await invoke<DirectoryPage>("get_directory_page", {
      path,
      offset,
      limit,
      includeHidden,
    });
  } catch (error) {
    console.error("Failed to get directory page:", error);
    throw new Error(`Failed to get directory page "${path}": ${error}`);
  }
}

/**
 * Read file contents
 * @param path Relative path to file
 * @returns File contents as string
 */
export async function readFile(path: string): Promise<string> {
  try {
    return await invoke<string>("read_file", { path });
  } catch (error) {
    console.error("Failed to read file:", error);
    throw new Error(`Failed to read file "${path}": ${error}`);
  }
}

/**
 * Write content to file
 * @param path Relative path to file
 * @param content File content to write
 */
export async function writeFile(path: string, content: string): Promise<void> {
  try {
    await invoke<void>("write_file", { path, content });
  } catch (error) {
    console.error("Failed to write file:", error);
    throw new Error(`Failed to write file "${path}": ${error}`);
  }
}

/**
 * Create a new file
 * @param path Relative path for new file
 */
export async function createFile(path: string): Promise<void> {
  try {
    await invoke<void>("create_file_command", { path });
  } catch (error) {
    console.error("Failed to create file:", error);
    throw new Error(formatApiError(error));
  }
}

/**
 * Create a new folder
 * @param path Relative path for new folder
 */
export async function createFolder(path: string): Promise<void> {
  try {
    await invoke<void>("create_folder_command", { path });
  } catch (error) {
    console.error("Failed to create folder:", error);
    throw new Error(formatApiError(error));
  }
}

/**
 * Rename a file or folder
 * @param oldPath Current path
 * @param newPath New path
 */
export async function renamePath(
  oldPath: string,
  newPath: string
): Promise<void> {
  try {
    await invoke<void>("rename_path", { old: oldPath, new: newPath });
  } catch (error) {
    console.error("Failed to rename:", error);
    throw new Error(formatApiError(error));
  }
}

/**
 * Delete a file or folder
 * @param path Path to delete
 */
export async function deletePath(path: string): Promise<void> {
  try {
    await invoke<void>("delete_path_command", { path });
  } catch (error) {
    console.error("Failed to delete:", error);
    throw new Error(formatApiError(error));
  }
}

/**
 * Clear the current workspace
 */
export async function clearWorkspace(): Promise<void> {
  try {
    await invoke<void>("clear_workspace");
  } catch (error) {
    console.error("Failed to clear workspace:", error);
    throw new Error(`Failed to clear workspace: ${error}`);
  }
}
