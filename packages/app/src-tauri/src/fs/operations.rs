use crate::error::{AppError, Result};
use crate::fs::types::FileNode;
use std::path::Path;
use tokio::fs;
use tokio::io::AsyncWriteExt;

/// Maximum file size that can be read (4GB)
const MAX_FILE_SIZE: u64 = 4 * 1024 * 1024 * 1024;

/// Read file content as a string
/// 
/// # Arguments
/// 
/// * `path` - The path to the file to read
/// 
/// # Returns
/// 
/// * `Ok(String)` - The file contents
/// * `Err(AppError)` - If file doesn't exist, permission denied, or file too large
pub async fn read_file_content(path: &Path) -> Result<String> {
    // Check file size first
    let metadata = fs::metadata(path).await?;
    
    if metadata.len() > MAX_FILE_SIZE {
        return Err(AppError::FileTooLarge(
            format!("File size {} bytes exceeds maximum of {} bytes", 
                metadata.len(), MAX_FILE_SIZE)
        ));
    }
    
    let content = fs::read_to_string(path).await?;
    Ok(content)
}

/// Get file or directory metadata as a FileNode
/// 
/// # Arguments
/// 
/// * `path` - The path to get metadata for
/// 
/// # Returns
/// 
/// * `Ok(FileNode)` - The file/directory metadata
/// * `Err(AppError)` - If path doesn't exist or permission denied
pub async fn get_metadata(path: &Path) -> Result<FileNode> {
    let metadata = fs::metadata(path).await?;
    
    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();
    
    let is_file = metadata.is_file();
    let size = if is_file { Some(metadata.len()) } else { None };
    let modified = metadata.modified().ok();
    
    Ok(FileNode::new(
        path.to_path_buf(),
        name,
        is_file,
        size,
        modified,
    ))
}

/// Write content to a file atomically using a temporary file
/// 
/// # Arguments
/// 
/// * `path` - The target file path
/// * `content` - The content to write
/// 
/// # Returns
/// 
/// * `Ok(())` - If write succeeded
/// * `Err(AppError)` - If write failed
/// 
/// # Implementation
/// 
/// Uses atomic write pattern:
/// 1. Write to temporary file {path}.tmp
/// 2. Atomically rename temp file to target
/// 3. Clean up temp file on error
pub async fn write_file_atomic(path: &Path, content: &str) -> Result<()> {
    let temp_path = {
        let file_name = path.file_name()
            .and_then(|n| n.to_str())
            .ok_or_else(|| AppError::InvalidPath("Invalid file name".into()))?;
        path.with_file_name(format!("{}.tmp", file_name))
    };
    
    // Write to temp file
    let mut file = fs::File::create(&temp_path).await?;
    file.write_all(content.as_bytes()).await?;
    file.sync_all().await?;
    drop(file);
    
    // Atomic rename
    match fs::rename(&temp_path, path).await {
        Ok(_) => Ok(()),
        Err(e) => {
            // Clean up temp file on error
            let _ = fs::remove_file(&temp_path).await;
            Err(e.into())
        }
    }
}

/// Create a new empty file
/// 
/// # Arguments
/// 
/// * `path` - The path where the file should be created
/// 
/// # Returns
/// 
/// * `Ok(())` - If file created successfully
/// * `Err(AppError)` - If file already exists or permission denied
pub async fn create_file(path: &Path) -> Result<()> {
    // Create will fail if file already exists
    let file = fs::File::create(path).await?;
    file.sync_all().await?;
    Ok(())
}

/// Create a new directory
/// 
/// # Arguments
/// 
/// * `path` - The path where the directory should be created
/// 
/// # Returns
/// 
/// * `Ok(())` - If directory created successfully
/// * `Err(AppError)` - If directory already exists or permission denied
pub async fn create_folder(path: &Path) -> Result<()> {
    fs::create_dir(path).await?;
    Ok(())
}

/// Delete a file or directory recursively
/// 
/// # Arguments
/// 
/// * `path` - The path to delete
/// 
/// # Returns
/// 
/// * `Ok(())` - If deletion succeeded
/// * `Err(AppError)` - If path doesn't exist or permission denied
pub async fn delete_path(path: &Path) -> Result<()> {
    let metadata = fs::metadata(path).await?;
    
    if metadata.is_file() {
        fs::remove_file(path).await?;
    } else {
        fs::remove_dir_all(path).await?;
    }
    
    Ok(())
}

/// Rename or move a file or directory
/// 
/// # Arguments
/// 
/// * `old_path` - The current path
/// * `new_path` - The new path
/// 
/// # Returns
/// 
/// * `Ok(())` - If rename succeeded
/// * `Err(AppError)` - If old path doesn't exist or permission denied
/// 
/// # Note
/// 
/// If rename fails due to cross-device error, this will attempt a copy + delete
pub async fn rename_path(old_path: &Path, new_path: &Path) -> Result<()> {
    match fs::rename(old_path, new_path).await {
        Ok(_) => Ok(()),
        Err(e) if e.raw_os_error() == Some(18) => {
            // EXDEV (cross-device link) - need to copy and delete
            copy_recursive(old_path, new_path).await?;
            delete_path(old_path).await?;
            Ok(())
        }
        Err(e) => Err(e.into()),
    }
}

/// Helper function to copy a file or directory recursively
fn copy_recursive<'a>(from: &'a Path, to: &'a Path) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<()>> + 'a>> {
    Box::pin(async move {
        let metadata = fs::metadata(from).await?;
        
        if metadata.is_file() {
            fs::copy(from, to).await?;
        } else {
            fs::create_dir_all(to).await?;
            
            let mut entries = fs::read_dir(from).await?;
            while let Some(entry) = entries.next_entry().await? {
                let file_name = entry.file_name();
                let from_path = from.join(&file_name);
                let to_path = to.join(&file_name);
                copy_recursive(&from_path, &to_path).await?;
            }
        }
        
        Ok(())
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;
    use std::path::PathBuf;
    
    async fn setup_test_dir() -> PathBuf {
        let test_id = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let temp_dir = env::temp_dir().join(format!("mdx_operations_test_{}", test_id));
        let _ = tokio::fs::remove_dir_all(&temp_dir).await;
        tokio::fs::create_dir_all(&temp_dir).await.unwrap();
        temp_dir
    }
    
    async fn cleanup_test_dir(dir: &Path) {
        let _ = tokio::fs::remove_dir_all(dir).await;
    }
    
    #[tokio::test]
    async fn test_read_file_content() {
        let base = setup_test_dir().await;
        let test_file = base.join("test.txt");
        let content = "Hello, World!";
        
        tokio::fs::write(&test_file, content).await.unwrap();
        
        let result = read_file_content(&test_file).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), content);
        
        cleanup_test_dir(&base).await;
    }
    
    #[tokio::test]
    async fn test_read_file_not_found() {
        let base = setup_test_dir().await;
        let test_file = base.join("nonexistent.txt");
        
        let result = read_file_content(&test_file).await;
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), AppError::FileNotFound(_)));
        
        cleanup_test_dir(&base).await;
    }
    
    #[tokio::test]
    async fn test_get_metadata_file() {
        let base = setup_test_dir().await;
        let test_file = base.join("test.txt");
        tokio::fs::write(&test_file, "content").await.unwrap();
        
        let result = get_metadata(&test_file).await;
        assert!(result.is_ok());
        
        let node = result.unwrap();
        assert_eq!(node.name, "test.txt");
        assert!(node.is_file);
        assert!(node.size.is_some());
        assert!(node.modified.is_some());
        
        cleanup_test_dir(&base).await;
    }
    
    #[tokio::test]
    async fn test_get_metadata_directory() {
        let base = setup_test_dir().await;
        let test_dir = base.join("testdir");
        tokio::fs::create_dir(&test_dir).await.unwrap();
        
        let result = get_metadata(&test_dir).await;
        assert!(result.is_ok());
        
        let node = result.unwrap();
        assert_eq!(node.name, "testdir");
        assert!(!node.is_file);
        assert!(node.size.is_none());
        
        cleanup_test_dir(&base).await;
    }
    
    #[tokio::test]
    async fn test_write_file_atomic() {
        let base = setup_test_dir().await;
        let test_file = base.join("test.txt");
        let content = "Atomic write test";
        
        let result = write_file_atomic(&test_file, content).await;
        assert!(result.is_ok());
        
        let read_content = tokio::fs::read_to_string(&test_file).await.unwrap();
        assert_eq!(read_content, content);
        
        // Ensure temp file is cleaned up
        let temp_file = test_file.with_extension("tmp");
        assert!(!temp_file.exists());
        
        cleanup_test_dir(&base).await;
    }
    
    #[tokio::test]
    async fn test_create_file() {
        let base = setup_test_dir().await;
        let test_file = base.join("newfile.txt");
        
        let result = create_file(&test_file).await;
        assert!(result.is_ok());
        assert!(test_file.exists());
        
        cleanup_test_dir(&base).await;
    }
    
    #[tokio::test]
    async fn test_create_folder() {
        let base = setup_test_dir().await;
        let test_dir = base.join("newfolder");
        
        let result = create_folder(&test_dir).await;
        assert!(result.is_ok());
        assert!(test_dir.exists());
        assert!(test_dir.is_dir());
        
        cleanup_test_dir(&base).await;
    }
    
    #[tokio::test]
    async fn test_delete_file() {
        let base = setup_test_dir().await;
        let test_file = base.join("delete_me.txt");
        tokio::fs::write(&test_file, "content").await.unwrap();
        
        assert!(test_file.exists());
        
        let result = delete_path(&test_file).await;
        assert!(result.is_ok());
        assert!(!test_file.exists());
        
        cleanup_test_dir(&base).await;
    }
    
    #[tokio::test]
    async fn test_delete_directory() {
        let base = setup_test_dir().await;
        let test_dir = base.join("delete_me");
        tokio::fs::create_dir(&test_dir).await.unwrap();
        tokio::fs::write(test_dir.join("file.txt"), "content").await.unwrap();
        
        assert!(test_dir.exists());
        
        let result = delete_path(&test_dir).await;
        assert!(result.is_ok());
        assert!(!test_dir.exists());
        
        cleanup_test_dir(&base).await;
    }
    
    #[tokio::test]
    async fn test_rename_file() {
        let base = setup_test_dir().await;
        let old_path = base.join("old.txt");
        let new_path = base.join("new.txt");
        let content = "rename test";
        
        tokio::fs::write(&old_path, content).await.unwrap();
        
        let result = rename_path(&old_path, &new_path).await;
        assert!(result.is_ok());
        assert!(!old_path.exists());
        assert!(new_path.exists());
        
        let read_content = tokio::fs::read_to_string(&new_path).await.unwrap();
        assert_eq!(read_content, content);
        
        cleanup_test_dir(&base).await;
    }
    
    #[tokio::test]
    async fn test_rename_directory() {
        let base = setup_test_dir().await;
        let old_dir = base.join("old_dir");
        let new_dir = base.join("new_dir");
        
        tokio::fs::create_dir(&old_dir).await.unwrap();
        tokio::fs::write(old_dir.join("file.txt"), "content").await.unwrap();
        
        let result = rename_path(&old_dir, &new_dir).await;
        assert!(result.is_ok());
        assert!(!old_dir.exists());
        assert!(new_dir.exists());
        assert!(new_dir.join("file.txt").exists());
        
        cleanup_test_dir(&base).await;
    }
}
