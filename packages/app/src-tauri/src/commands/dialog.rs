/// System dialog commands
/// 
/// This module provides Tauri commands for system dialogs, specifically
/// the folder picker for selecting a workspace.

use crate::error::{AppError, Result};
use crate::state::AppState;
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

/// Show a folder picker dialog and set the selected folder as the workspace
/// 
/// Opens a native folder picker dialog. If the user selects a folder:
/// - Sets it as the workspace in AppState
/// - Saves it to config for persistence
/// - Returns the selected folder path
/// 
/// The dialog starts in the last used directory for better UX.
/// 
/// # Arguments
/// 
/// * `app` - Tauri app handle (injected by Tauri)
/// * `state` - Application state (injected by Tauri)
/// 
/// # Returns
/// 
/// * `Ok(String)` - The selected folder path
/// * `Err(AppError)` - If user cancels or dialog fails
/// 
/// # Example (from frontend)
/// 
/// ```javascript
/// const workspacePath = await invoke('show_open_dialog')
/// console.log('Selected workspace:', workspacePath)
/// ```
#[tauri::command]
pub async fn show_open_dialog(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<String> {
    // Get the last used directory for better UX
    let start_dir = state.get_last_dialog_dir();
    
    // Use tokio::sync::oneshot to bridge the callback-based API
    let (tx, rx) = tokio::sync::oneshot::channel();
    
    // Build the dialog
    let mut dialog = app.dialog().file();
    
    // Set starting directory if we have one
    if let Some(dir) = start_dir {
        dialog = dialog.set_directory(dir);
    }
    
    // Show the dialog with callback
    dialog.pick_folder(move |folder_path| {
        let _ = tx.send(folder_path);
    });
    
    // Wait for the result
    let folder_path = rx.await
        .map_err(|_| AppError::IoError("Dialog was cancelled or closed".to_string()))?
        .ok_or_else(|| AppError::InvalidPath("No folder selected".to_string()))?;
    
    // Convert to PathBuf
    let path_buf = folder_path.as_path().ok_or_else(|| {
        AppError::InvalidPath("Invalid folder path".to_string())
    })?.to_path_buf();
    
    // Set as workspace and save
    state.set_workspace(path_buf.clone())?;
    
    // Return the path as a string
    path_buf
        .to_str()
        .map(|s: &str| s.to_string())
        .ok_or_else(|| AppError::InvalidPath("Path contains invalid UTF-8 characters".to_string()))
}

/// Get the current workspace path
/// 
/// Returns the currently open workspace path, if any.
/// 
/// # Arguments
/// 
/// * `state` - Application state (injected by Tauri)
/// 
/// # Returns
/// 
/// * `Ok(Some(String))` - The workspace path if one is open
/// * `Ok(None)` - If no workspace is currently open
/// 
/// # Example (from frontend)
/// 
/// ```javascript
/// const workspace = await invoke('get_workspace')
/// if (workspace) {
///   console.log('Current workspace:', workspace)
/// } else {
///   console.log('No workspace open')
/// }
/// ```
#[tauri::command]
pub async fn get_workspace(
    state: tauri::State<'_, AppState>,
) -> Result<Option<String>> {
    Ok(state.get_workspace().and_then(|p| p.to_str().map(|s: &str| s.to_string())))
}

/// Clear the current workspace
/// 
/// Closes the current workspace. 
/// The user will need to select a new workspace before performing file operations.
/// 
/// # Arguments
/// 
/// * `state` - Application state (injected by Tauri)
/// 
/// # Returns
/// 
/// * `Ok(())` - If workspace cleared successfully
/// 
/// # Example (from frontend)
/// 
/// ```javascript
/// await invoke('clear_workspace')
/// console.log('Workspace closed')
/// ```
#[tauri::command]
pub async fn clear_workspace(
    state: tauri::State<'_, AppState>,
) -> Result<()> {
    // Clear workspace
    state.clear_workspace()
}
