/// File operation commands
/// 
/// This module provides Tauri commands for file operations (read, write, create,
/// rename, delete). All commands validate paths against the workspace and use
/// spawn_blocking for non-blocking I/O.

use crate::error::{AppError, Result};
use crate::fs::{validate_path_with_state, read_file_content, write_file_atomic, create_file, rename_path, delete_path};
use crate::state::AppState;

/// Read file content as a string
/// 
/// # Arguments
/// 
/// * `state` - Application state (injected by Tauri)
/// * `path` - Relative path to the file (relative to workspace)
/// 
/// # Returns
/// 
/// * `Ok(String)` - The file contents
/// * `Err(AppError)` - If no workspace is open, file doesn't exist, or permission denied
/// 
/// # Example (from frontend)
/// 
/// ```javascript
/// const content = await invoke('read_file', { path: 'notes/hello.md' })
/// ```
#[tauri::command]
pub async fn read_file(
    state: tauri::State<'_, AppState>,
    path: String,
) -> Result<String> {
    // Validate path against workspace
    let validated_path = validate_path_with_state(&state, &path)?;
    
    // Run file I/O on blocking thread pool
    let content = tokio::task::spawn_blocking(move || {
        tokio::runtime::Handle::current().block_on(async {
            read_file_content(&validated_path).await
        })
    })
    .await
    .map_err(|e| AppError::IoError(format!("Task execution failed: {}", e)))??;
    
    Ok(content)
}

/// Write content to a file atomically
/// 
/// Uses atomic write pattern (temp file + rename) to prevent data corruption.
/// 
/// # Arguments
/// 
/// * `state` - Application state (injected by Tauri)
/// * `path` - Relative path to the file (relative to workspace)
/// * `content` - Content to write
/// 
/// # Returns
/// 
/// * `Ok(())` - If write succeeded
/// * `Err(AppError)` - If no workspace is open, permission denied, or write failed
/// 
/// # Example (from frontend)
/// 
/// ```javascript
/// await invoke('write_file', { path: 'notes/hello.md', content: '# Hello World' })
/// ```
#[tauri::command]
pub async fn write_file(
    state: tauri::State<'_, AppState>,
    path: String,
    content: String,
) -> Result<()> {
    // Validate path against workspace
    let validated_path = validate_path_with_state(&state, &path)?;
    
    // Run file I/O on blocking thread pool
    tokio::task::spawn_blocking(move || {
        tokio::runtime::Handle::current().block_on(async {
            write_file_atomic(&validated_path, &content).await
        })
    })
    .await
    .map_err(|e| AppError::IoError(format!("Task execution failed: {}", e)))??;
    
    Ok(())
}

/// Create a new empty file
/// 
/// # Arguments
/// 
/// * `state` - Application state (injected by Tauri)
/// * `path` - Relative path where the file should be created (relative to workspace)
/// 
/// # Returns
/// 
/// * `Ok(())` - If file created successfully
/// * `Err(AppError)` - If no workspace is open, file already exists, or permission denied
/// 
/// # Example (from frontend)
/// 
/// ```javascript
/// await invoke('create_file', { path: 'notes/new-note.md' })
/// ```
#[tauri::command]
pub async fn create_file_command(
    state: tauri::State<'_, AppState>,
    path: String,
) -> Result<()> {
    // Validate path against workspace
    let validated_path = validate_path_with_state(&state, &path)?;
    
    // Run file I/O on blocking thread pool
    tokio::task::spawn_blocking(move || {
        tokio::runtime::Handle::current().block_on(async {
            create_file(&validated_path).await
        })
    })
    .await
    .map_err(|e| AppError::IoError(format!("Task execution failed: {}", e)))??;
    
    Ok(())
}

/// Rename or move a file or directory
/// 
/// # Arguments
/// 
/// * `state` - Application state (injected by Tauri)
/// * `old_path` - Current relative path (relative to workspace)
/// * `new_path` - New relative path (relative to workspace)
/// 
/// # Returns
/// 
/// * `Ok(())` - If rename succeeded
/// * `Err(AppError)` - If no workspace is open, old path doesn't exist, or permission denied
/// 
/// # Example (from frontend)
/// 
/// ```javascript
/// await invoke('rename_path', { oldPath: 'old.md', newPath: 'new.md' })
/// ```
#[tauri::command]
pub async fn rename_path_command(
    state: tauri::State<'_, AppState>,
    old_path: String,
    new_path: String,
) -> Result<()> {
    // Validate both paths against workspace
    let validated_old = validate_path_with_state(&state, &old_path)?;
    let validated_new = validate_path_with_state(&state, &new_path)?;
    
    // Run file I/O on blocking thread pool
    tokio::task::spawn_blocking(move || {
        tokio::runtime::Handle::current().block_on(async {
            rename_path(&validated_old, &validated_new).await
        })
    })
    .await
    .map_err(|e| AppError::IoError(format!("Task execution failed: {}", e)))??;
    
    Ok(())
}

/// Delete a file or directory recursively
/// 
/// # Arguments
/// 
/// * `state` - Application state (injected by Tauri)
/// * `path` - Relative path to delete (relative to workspace)
/// 
/// # Returns
/// 
/// * `Ok(())` - If deletion succeeded
/// * `Err(AppError)` - If no workspace is open, path doesn't exist, or permission denied
/// 
/// # Example (from frontend)
/// 
/// ```javascript
/// await invoke('delete_path', { path: 'notes/old-note.md' })
/// ```
#[tauri::command]
pub async fn delete_path_command(
    state: tauri::State<'_, AppState>,
    path: String,
) -> Result<()> {
    // Validate path against workspace
    let validated_path = validate_path_with_state(&state, &path)?;
    
    // Run file I/O on blocking thread pool
    tokio::task::spawn_blocking(move || {
        tokio::runtime::Handle::current().block_on(async {
            delete_path(&validated_path).await
        })
    })
    .await
    .map_err(|e| AppError::IoError(format!("Task execution failed: {}", e)))??;
    
    Ok(())
}
