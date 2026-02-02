/// Directory operation commands
/// 
/// This module provides Tauri commands for directory operations (create, read,
/// paginated read). All commands validate paths against the workspace.

use crate::error::{AppError, Result};
use crate::fs::{validate_path_with_state, create_folder, read_directory_lazy, get_directory_page as get_dir_page};
use crate::fs::types::{FileNode, DirectoryPage};
use crate::state::AppState;

/// Create a new directory
/// 
/// # Arguments
/// 
/// * `state` - Application state (injected by Tauri)
/// * `path` - Relative path where the directory should be created (relative to workspace)
/// 
/// # Returns
/// 
/// * `Ok(())` - If directory created successfully
/// * `Err(AppError)` - If no workspace is open, directory already exists, or permission denied
/// 
/// # Example (from frontend)
/// 
/// ```javascript
/// await invoke('create_folder', { path: 'notes/new-folder' })
/// ```
#[tauri::command]
pub async fn create_folder_command(
    state: tauri::State<'_, AppState>,
    path: String,
) -> Result<()> {
    // Validate path against workspace
    let validated_path = validate_path_with_state(&state, &path)?;
    
    // Run file I/O on blocking thread pool
    tokio::task::spawn_blocking(move || {
        tokio::runtime::Handle::current().block_on(async {
            create_folder(&validated_path).await
        })
    })
    .await
    .map_err(|e| AppError::IoError(format!("Task execution failed: {}", e)))??;
    
    Ok(())
}

/// Read a directory and return a FileNode with immediate children (lazy loading)
/// 
/// This returns the directory node with its immediate children populated, but
/// children's children are not loaded (lazy loading pattern for performance).
/// 
/// # Arguments
/// 
/// * `state` - Application state (injected by Tauri)
/// * `path` - Relative path to the directory (relative to workspace). Use "." or "" for workspace root.
/// * `include_hidden` - Whether to include hidden files (files starting with '.')
/// 
/// # Returns
/// 
/// * `Ok(FileNode)` - The directory node with children populated
/// * `Err(AppError)` - If no workspace is open, directory doesn't exist, or permission denied
/// 
/// # Example (from frontend)
/// 
/// ```javascript
/// const dirNode = await invoke('read_directory', { 
///   path: 'notes', 
///   includeHidden: false 
/// })
/// console.log(dirNode.children) // Array of FileNode
/// ```
#[tauri::command]
pub async fn read_directory(
    state: tauri::State<'_, AppState>,
    path: String,
    include_hidden: bool,
) -> Result<FileNode> {
    // Handle empty path or "." as workspace root
    let target_path = if path.is_empty() || path == "." {
        state.get_workspace().ok_or_else(|| {
            AppError::InvalidPath(
                "No workspace is open. Please select a folder first.".to_string()
            )
        })?
    } else {
        // Validate path against workspace
        validate_path_with_state(&state, &path)?
    };
    
    // Run file I/O on blocking thread pool
    let dir_node = tokio::task::spawn_blocking(move || {
        tokio::runtime::Handle::current().block_on(async {
            read_directory_lazy(&target_path, include_hidden).await
        })
    })
    .await
    .map_err(|e| AppError::IoError(format!("Task execution failed: {}", e)))??;
    
    Ok(dir_node)
}

/// Get a paginated page of directory entries
/// 
/// For large directories with 1000+ items, pagination helps maintain performance.
/// Returns a page of results with metadata about total count and whether more
/// items are available.
/// 
/// # Arguments
/// 
/// * `state` - Application state (injected by Tauri)
/// * `path` - Relative path to the directory (relative to workspace). Use "." or "" for workspace root.
/// * `offset` - Number of items to skip
/// * `limit` - Maximum number of items to return
/// * `include_hidden` - Whether to include hidden files
/// 
/// # Returns
/// 
/// * `Ok(DirectoryPage)` - A page of directory entries with pagination info
/// * `Err(AppError)` - If no workspace is open, directory doesn't exist, or permission denied
/// 
/// # Example (from frontend)
/// 
/// ```javascript
/// const page = await invoke('get_directory_page', { 
///   path: 'notes', 
///   offset: 0,
///   limit: 100,
///   includeHidden: false 
/// })
/// console.log(page.nodes)       // Array of FileNode (up to 100)
/// console.log(page.totalCount)  // Total items in directory
/// console.log(page.hasMore)     // true if more items available
/// ```
#[tauri::command]
pub async fn get_directory_page(
    state: tauri::State<'_, AppState>,
    path: String,
    offset: usize,
    limit: usize,
    include_hidden: bool,
) -> Result<DirectoryPage> {
    // Handle empty path or "." as workspace root
    let target_path = if path.is_empty() || path == "." {
        state.get_workspace().ok_or_else(|| {
            AppError::InvalidPath(
                "No workspace is open. Please select a folder first.".to_string()
            )
        })?
    } else {
        // Validate path against workspace
        validate_path_with_state(&state, &path)?
    };
    
    // Run file I/O on blocking thread pool
    let page = tokio::task::spawn_blocking(move || {
        tokio::runtime::Handle::current().block_on(async {
            get_dir_page(&target_path, offset, limit, include_hidden).await
        })
    })
    .await
    .map_err(|e| AppError::IoError(format!("Task execution failed: {}", e)))??;
    
    Ok(page)
}
