/// Integration tests for file operations and state management
/// 
/// These tests verify that the underlying file operations and state management
/// work correctly. The Tauri command layer is thin wrapper that will be tested
/// via manual testing in Tauri dev mode.

use mdx_desktop_lib::{AppState, AppError};
use mdx_desktop_lib::fs::{
    read_file_content, write_file_atomic, create_file, rename_path, delete_path,
    create_folder, read_directory_lazy, get_directory_page,
    validate_path_with_state,
};
use std::env;
use std::path::PathBuf;
use tokio::fs;

/// Setup helper to create a test directory and AppState
async fn setup_test() -> (AppState, PathBuf, PathBuf) {
    let test_id = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    
    // Create workspace directory
    let workspace = env::temp_dir().join(format!("mdx_cmd_test_workspace_{}", test_id));
    fs::create_dir_all(&workspace).await.unwrap();
    
    // Create config file path
    let config_path = env::temp_dir().join(format!("mdx_cmd_test_config_{}.json", test_id));
    
    // Initialize state
    let state = AppState::new(config_path.clone());
    
    // Set workspace
    state.set_workspace(workspace.clone()).unwrap();
    
    (state, workspace, config_path)
}

/// Cleanup helper
async fn cleanup_test(workspace: &PathBuf, config_path: &PathBuf) {
    let _ = fs::remove_dir_all(workspace).await;
    let _ = fs::remove_file(config_path).await;
}

// ============================================================================
// File Operation Tests
// ============================================================================

#[tokio::test]
async fn test_write_and_read_file() {
    let (state, workspace, config_path) = setup_test().await;
    
    let content = "# Hello World\n\nThis is a test file.";
    let file_path = workspace.join("test.md");
    
    // Write file
    let write_result = write_file_atomic(&file_path, content).await;
    assert!(write_result.is_ok(), "Failed to write file: {:?}", write_result.err());
    
    // Read file back
    let read_result = read_file_content(&file_path).await;
    assert!(read_result.is_ok(), "Failed to read file: {:?}", read_result.err());
    assert_eq!(read_result.unwrap(), content);
    
    cleanup_test(&workspace, &config_path).await;
}

#[tokio::test]
async fn test_create_file() {
    let (state, workspace, config_path) = setup_test().await;
    
    let file_path = workspace.join("newfile.md");
    
    // Create file
    let result = create_file(&file_path).await;
    assert!(result.is_ok(), "Failed to create file: {:?}", result.err());
    
    // Verify file exists
    assert!(file_path.exists());
    
    cleanup_test(&workspace, &config_path).await;
}

#[tokio::test]
async fn test_rename_file() {
    let (state, workspace, config_path) = setup_test().await;
    
    // Create a file first
    let old_path = workspace.join("old.md");
    let new_path = workspace.join("new.md");
    fs::write(&old_path, "content").await.unwrap();
    
    // Rename it
    let result = rename_path(&old_path, &new_path).await;
    assert!(result.is_ok(), "Failed to rename file: {:?}", result.err());
    
    // Verify
    assert!(!old_path.exists());
    assert!(new_path.exists());
    
    cleanup_test(&workspace, &config_path).await;
}

#[tokio::test]
async fn test_delete_file() {
    let (state, workspace, config_path) = setup_test().await;
    
    // Create a file first
    let file_path = workspace.join("delete_me.md");
    fs::write(&file_path, "content").await.unwrap();
    assert!(file_path.exists());
    
    // Delete it
    let result = delete_path(&file_path).await;
    assert!(result.is_ok(), "Failed to delete file: {:?}", result.err());
    
    // Verify
    assert!(!file_path.exists());
    
    cleanup_test(&workspace, &config_path).await;
}

// ============================================================================
// Directory Operation Tests
// ============================================================================

#[tokio::test]
async fn test_create_folder() {
    let (state, workspace, config_path) = setup_test().await;
    
    let folder_path = workspace.join("newfolder");
    
    // Create folder
    let result = create_folder(&folder_path).await;
    assert!(result.is_ok(), "Failed to create folder: {:?}", result.err());
    
    // Verify
    assert!(folder_path.exists());
    assert!(folder_path.is_dir());
    
    cleanup_test(&workspace, &config_path).await;
}

#[tokio::test]
async fn test_read_directory() {
    let (state, workspace, config_path) = setup_test().await;
    
    // Create some files and folders
    fs::write(workspace.join("file1.md"), "content").await.unwrap();
    fs::write(workspace.join("file2.md"), "content").await.unwrap();
    fs::create_dir(workspace.join("folder1")).await.unwrap();
    fs::create_dir(workspace.join("folder2")).await.unwrap();
    
    // Read directory
    let result = read_directory_lazy(&workspace, false).await;
    assert!(result.is_ok(), "Failed to read directory: {:?}", result.err());
    
    let dir_node = result.unwrap();
    assert!(dir_node.children.is_some());
    
    let children = dir_node.children.unwrap();
    assert_eq!(children.len(), 4); // 2 files + 2 folders
    
    // Verify folders come first (sorting)
    assert!(!children[0].is_file);
    assert!(!children[1].is_file);
    assert!(children[2].is_file);
    assert!(children[3].is_file);
    
    cleanup_test(&workspace, &config_path).await;
}

#[tokio::test]
async fn test_get_directory_page() {
    let (state, workspace, config_path) = setup_test().await;
    
    // Create many files
    for i in 1..=10 {
        fs::write(workspace.join(format!("file{}.md", i)), "content").await.unwrap();
    }
    
    // Get first page
    let result = get_directory_page(&workspace, 0, 5, false).await;
    assert!(result.is_ok(), "Failed to get directory page: {:?}", result.err());
    
    let page = result.unwrap();
    assert_eq!(page.nodes.len(), 5);
    assert_eq!(page.total_count, 10);
    assert!(page.has_more);
    
    // Get second page
    let result2 = get_directory_page(&workspace, 5, 5, false).await;
    assert!(result2.is_ok());
    
    let page2 = result2.unwrap();
    assert_eq!(page2.nodes.len(), 5);
    assert_eq!(page2.total_count, 10);
    assert!(!page2.has_more);
    
    cleanup_test(&workspace, &config_path).await;
}

// ============================================================================
// State Management Tests
// ============================================================================

#[tokio::test]
async fn test_get_workspace() {
    let (state, workspace, config_path) = setup_test().await;
    
    // Get workspace
    let workspace_path = state.get_workspace();
    assert!(workspace_path.is_some());
    assert_eq!(workspace_path.unwrap(), workspace);
    
    cleanup_test(&workspace, &config_path).await;
}

#[tokio::test]
async fn test_clear_workspace() {
    let (state, workspace, config_path) = setup_test().await;
    
    // Clear workspace
    let result = state.clear_workspace();
    assert!(result.is_ok());
    
    // Verify workspace is cleared
    assert!(state.get_workspace().is_none());
    
    cleanup_test(&workspace, &config_path).await;
}

// ============================================================================
// Path Validation Tests
// ============================================================================

#[tokio::test]
async fn test_path_validation_with_state() {
    let (state, workspace, config_path) = setup_test().await;
    
    // Valid relative path
    let result = validate_path_with_state(&state, "test.md");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), workspace.join("test.md"));
    
    cleanup_test(&workspace, &config_path).await;
}

#[tokio::test]
async fn test_path_validation_no_workspace() {
    let test_id = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let config_path = env::temp_dir().join(format!("mdx_cmd_test_config_{}.json", test_id));
    
    // Create state without setting workspace
    let state = AppState::new(config_path.clone());
    
    // Try to validate a path
    let result = validate_path_with_state(&state, "test.md");
    
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), AppError::InvalidPath(_)));
    
    let _ = fs::remove_file(config_path).await;
}

#[tokio::test]
async fn test_path_traversal_blocked() {
    let (state, workspace, config_path) = setup_test().await;
    
    // Try to access parent directory
    let result = validate_path_with_state(&state, "../etc/passwd");
    
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), AppError::PathTraversal(_)));
    
    cleanup_test(&workspace, &config_path).await;
}

#[tokio::test]
async fn test_nested_paths_work() {
    let (state, workspace, config_path) = setup_test().await;
    
    // Create nested structure
    let nested = workspace.join("folder1").join("folder2");
    fs::create_dir_all(&nested).await.unwrap();
    fs::write(nested.join("deep.md"), "deep content").await.unwrap();
    
    // Validate nested path
    let result = validate_path_with_state(&state, "folder1/folder2/deep.md");
    assert!(result.is_ok());
    
    // Read nested file
    let validated_path = result.unwrap();
    let content = read_file_content(&validated_path).await;
    assert!(content.is_ok());
    assert_eq!(content.unwrap(), "deep content");
    
    cleanup_test(&workspace, &config_path).await;
}

// ============================================================================
// Persistence Tests
// ============================================================================

#[tokio::test]
async fn test_workspace_persistence() {
    let test_id = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    
    let workspace = env::temp_dir().join(format!("mdx_cmd_test_workspace_{}", test_id));
    fs::create_dir_all(&workspace).await.unwrap();
    
    let config_path = env::temp_dir().join(format!("mdx_cmd_test_config_{}.json", test_id));
    
    // First instance: set workspace
    {
        let state1 = AppState::new(config_path.clone());
        state1.set_workspace(workspace.clone()).unwrap();
    }
    
    // Second instance: load from config
    {
        let state2 = AppState::new(config_path.clone());
        state2.load().unwrap();
        
        assert_eq!(state2.get_workspace(), Some(workspace.clone()));
    }
    
    cleanup_test(&workspace, &config_path).await;
}

#[tokio::test]
async fn test_last_dialog_dir_persistence() {
    let test_id = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    
    let config_path = env::temp_dir().join(format!("mdx_cmd_test_config_{}.json", test_id));
    let test_dir = PathBuf::from("/home/user/documents");
    
    // First instance: set last dialog dir
    {
        let state1 = AppState::new(config_path.clone());
        state1.set_last_dialog_dir(test_dir.clone()).unwrap();
    }
    
    // Second instance: load from config
    {
        let state2 = AppState::new(config_path.clone());
        state2.load().unwrap();
        
        assert_eq!(state2.get_last_dialog_dir(), Some(test_dir));
    }
    
    let _ = fs::remove_file(config_path).await;
}
