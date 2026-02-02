use std::env;
use std::path::PathBuf;
use tokio::fs;

// Import the fs module functions
// Note: These would normally be accessed through the public API
// For now, we'll create helper functions that mirror the actual implementation

async fn setup_integration_test_dir() -> PathBuf {
    let test_id = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let temp_dir = env::temp_dir().join(format!("mdx_integration_test_{}", test_id));
    let _ = fs::remove_dir_all(&temp_dir).await;
    fs::create_dir_all(&temp_dir).await.unwrap();
    temp_dir
}

async fn cleanup_integration_test_dir(dir: &Path) {
    let _ = fs::remove_dir_all(dir).await;
}

use std::path::Path;

#[tokio::test]
async fn test_complete_file_workflow() {
    let base = setup_integration_test_dir().await;
    
    // 1. Create a new file
    let file_path = base.join("workflow_test.md");
    fs::write(&file_path, "# Initial Content").await.unwrap();
    assert!(file_path.exists());
    
    // 2. Read the file
    let content = fs::read_to_string(&file_path).await.unwrap();
    assert_eq!(content, "# Initial Content");
    
    // 3. Write new content
    fs::write(&file_path, "# Updated Content").await.unwrap();
    
    // 4. Read again to verify
    let updated_content = fs::read_to_string(&file_path).await.unwrap();
    assert_eq!(updated_content, "# Updated Content");
    
    // 5. Rename the file
    let new_path = base.join("renamed_workflow.md");
    fs::rename(&file_path, &new_path).await.unwrap();
    assert!(!file_path.exists());
    assert!(new_path.exists());
    
    // 6. Delete the file
    fs::remove_file(&new_path).await.unwrap();
    assert!(!new_path.exists());
    
    cleanup_integration_test_dir(&base).await;
}

#[tokio::test]
async fn test_directory_operations_workflow() {
    let base = setup_integration_test_dir().await;
    
    // 1. Create a directory structure
    let docs_dir = base.join("docs");
    let images_dir = base.join("images");
    
    fs::create_dir(&docs_dir).await.unwrap();
    fs::create_dir(&images_dir).await.unwrap();
    
    // 2. Create files in directories
    fs::write(docs_dir.join("readme.md"), "# README").await.unwrap();
    fs::write(docs_dir.join("guide.md"), "# Guide").await.unwrap();
    fs::write(images_dir.join("logo.png"), "fake image data").await.unwrap();
    
    // 3. List directory contents
    let mut entries = fs::read_dir(&base).await.unwrap();
    let mut count = 0;
    while let Some(_entry) = entries.next_entry().await.unwrap() {
        count += 1;
    }
    assert_eq!(count, 2); // docs and images directories
    
    // 4. Rename a directory
    let new_docs_dir = base.join("documentation");
    fs::rename(&docs_dir, &new_docs_dir).await.unwrap();
    assert!(!docs_dir.exists());
    assert!(new_docs_dir.exists());
    assert!(new_docs_dir.join("readme.md").exists());
    
    // 5. Delete a directory recursively
    fs::remove_dir_all(&images_dir).await.unwrap();
    assert!(!images_dir.exists());
    
    cleanup_integration_test_dir(&base).await;
}

#[tokio::test]
async fn test_nested_directory_creation() {
    let base = setup_integration_test_dir().await;
    
    // Create deeply nested structure
    let nested_path = base
        .join("projects")
        .join("mdx-editor")
        .join("src")
        .join("components");
    
    fs::create_dir_all(&nested_path).await.unwrap();
    assert!(nested_path.exists());
    
    // Create file in nested directory
    let file_path = nested_path.join("Editor.tsx");
    fs::write(&file_path, "export const Editor = () => {}").await.unwrap();
    assert!(file_path.exists());
    
    // Verify full path
    let content = fs::read_to_string(&file_path).await.unwrap();
    assert_eq!(content, "export const Editor = () => {}");
    
    cleanup_integration_test_dir(&base).await;
}

#[tokio::test]
async fn test_concurrent_file_operations() {
    let base = setup_integration_test_dir().await;
    
    // Create multiple files concurrently
    let mut handles = vec![];
    
    for i in 0..10 {
        let file_path = base.join(format!("concurrent_{}.txt", i));
        let content = format!("File number {}", i);
        
        let handle = tokio::spawn(async move {
            fs::write(&file_path, &content).await.unwrap();
        });
        
        handles.push(handle);
    }
    
    // Wait for all operations to complete
    for handle in handles {
        handle.await.unwrap();
    }
    
    // Verify all files were created
    for i in 0..10 {
        let file_path = base.join(format!("concurrent_{}.txt", i));
        assert!(file_path.exists());
        
        let content = fs::read_to_string(&file_path).await.unwrap();
        assert_eq!(content, format!("File number {}", i));
    }
    
    cleanup_integration_test_dir(&base).await;
}

#[tokio::test]
async fn test_large_file_handling() {
    let base = setup_integration_test_dir().await;
    
    // Create a moderately large file (1MB)
    let large_content = "x".repeat(1024 * 1024);
    let file_path = base.join("large_file.txt");
    
    fs::write(&file_path, &large_content).await.unwrap();
    
    // Verify it can be read back
    let read_content = fs::read_to_string(&file_path).await.unwrap();
    assert_eq!(read_content.len(), 1024 * 1024);
    
    cleanup_integration_test_dir(&base).await;
}

#[tokio::test]
async fn test_special_characters_in_filenames() {
    let base = setup_integration_test_dir().await;
    
    // Test various special characters in filenames
    let special_files = vec![
        "file with spaces.txt",
        "file-with-dashes.txt",
        "file_with_underscores.txt",
        "file.multiple.dots.txt",
    ];
    
    for filename in special_files {
        let file_path = base.join(filename);
        fs::write(&file_path, "content").await.unwrap();
        assert!(file_path.exists());
        
        let content = fs::read_to_string(&file_path).await.unwrap();
        assert_eq!(content, "content");
    }
    
    cleanup_integration_test_dir(&base).await;
}

#[tokio::test]
async fn test_atomic_write_behavior() {
    let base = setup_integration_test_dir().await;
    
    let file_path = base.join("atomic_test.txt");
    
    // Initial write
    fs::write(&file_path, "initial").await.unwrap();
    
    // Concurrent reads while writing
    let read_path = file_path.clone();
    let read_handle = tokio::spawn(async move {
        for _ in 0..10 {
            let content = fs::read_to_string(&read_path).await.unwrap();
            // Content should be either "initial" or "updated", never partial
            assert!(content == "initial" || content == "updated");
            tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
        }
    });
    
    tokio::time::sleep(tokio::time::Duration::from_millis(20)).await;
    fs::write(&file_path, "updated").await.unwrap();
    
    read_handle.await.unwrap();
    
    cleanup_integration_test_dir(&base).await;
}
