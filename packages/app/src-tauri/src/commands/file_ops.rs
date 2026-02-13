/// File operation commands
/// 
/// This module provides Tauri commands for file operations (read, write, create,
/// rename, delete). All commands validate paths against the workspace and use
/// spawn_blocking for non-blocking I/O.

use crate::error::{AppError, Result};
use crate::fs::{validate_path_with_state, read_file_content, write_file_atomic, write_file_binary, rename_path, delete_path};
use crate::state::AppState;
use chrono::{Datelike, Utc};

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

/// Allowed image file extensions (case-insensitive)
const ALLOWED_IMAGE_EXTENSIONS: &[&str] = &["png", "jpg", "jpeg", "gif", "webp", "svg"];

/// Maximum image file size (10MB)
const MAX_IMAGE_SIZE: usize = 10 * 1024 * 1024;

/// Sanitize a filename by removing/replacing invalid characters
/// 
/// # Arguments
/// 
/// * `filename` - The original filename
/// 
/// # Returns
/// 
/// A sanitized filename with only alphanumeric, dash, underscore, and dot characters
fn sanitize_filename(filename: &str) -> String {
    filename
        .chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '-' || c == '_' || c == '.' {
                c
            } else {
                '_'
            }
        })
        .collect()
}

/// Upload an image file to the workspace assets directory
/// 
/// Images are stored in assets/YYYY-MM/ directories organized by month.
/// If a file with the same name exists, a timestamp suffix is added.
/// 
/// # Arguments
/// 
/// * `state` - Application state (injected by Tauri)
/// * `filename` - Original filename of the image
/// * `data` - Binary image data
/// 
/// # Returns
/// 
/// * `Ok(String)` - Relative path to the saved image (e.g., "assets/2025-02/image.png")
/// * `Err(AppError)` - If no workspace is open, invalid format, file too large, or write failed
/// 
/// # Example (from frontend)
/// 
/// ```javascript
/// const relativePath = await invoke('upload_image', { 
///   filename: 'screenshot.png', 
///   data: [/* byte array */] 
/// })
/// ```
#[tauri::command]
pub async fn upload_image(
    state: tauri::State<'_, AppState>,
    filename: String,
    data: Vec<u8>,
) -> Result<String> {
    // Check file size
    if data.len() > MAX_IMAGE_SIZE {
        return Err(AppError::FileTooLarge(format!(
            "Image size {} bytes exceeds maximum of {} bytes (10MB)",
            data.len(),
            MAX_IMAGE_SIZE
        )));
    }

    // Get workspace
    let workspace = state.get_workspace()
        .ok_or_else(|| AppError::InvalidPath("No workspace open".into()))?;

    // Sanitize filename and validate extension
    let sanitized = sanitize_filename(&filename);
    
    // Check for path separators in sanitized filename
    if sanitized.contains('/') || sanitized.contains('\\') {
        return Err(AppError::InvalidPath(
            "Filename cannot contain path separators".into()
        ));
    }

    // Extract and validate extension
    let extension = sanitized
        .rsplit('.')
        .next()
        .unwrap_or("")
        .to_lowercase();

    if !ALLOWED_IMAGE_EXTENSIONS.contains(&extension.as_str()) {
        return Err(AppError::InvalidPath(format!(
            "Unsupported image format. Allowed: {}",
            ALLOWED_IMAGE_EXTENSIONS.join(", ")
        )));
    }

    // Generate month-based directory path (YYYY-MM)
    let now = Utc::now();
    let month_dir = format!("{:04}-{:02}", now.year(), now.month());
    let assets_dir = workspace.join("assets").join(&month_dir);

    // Create directory if it doesn't exist
    tokio::fs::create_dir_all(&assets_dir).await?;

    // Handle duplicate filenames with timestamp suffix
    let mut target_path = assets_dir.join(&sanitized);
    let mut final_filename = sanitized.clone();

    if target_path.exists() {
        // Add timestamp before extension
        let timestamp = now.timestamp();
        let name_without_ext = sanitized.trim_end_matches(&format!(".{}", extension));
        final_filename = format!("{}-{}.{}", name_without_ext, timestamp, extension);
        target_path = assets_dir.join(&final_filename);
    }

    // Write file atomically
    tokio::task::spawn_blocking(move || {
        tokio::runtime::Handle::current().block_on(async {
            write_file_binary(&target_path, &data).await
        })
    })
    .await
    .map_err(|e| AppError::IoError(format!("Task execution failed: {}", e)))??;

    // Return relative path from workspace
    let relative_path = format!("assets/{}/{}", month_dir, final_filename);
    Ok(relative_path)
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
