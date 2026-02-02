use crate::error::{AppError, Result};
use crate::fs::types::{DirectoryPage, FileNode};
use jwalk::WalkDir;
use rayon::prelude::*;
use std::path::Path;
use tokio::fs;

/// Options for filtering directory entries
#[derive(Debug, Clone)]
pub struct ScanOptions {
    /// Include hidden files (starting with '.')
    pub include_hidden: bool,
    
    /// Maximum depth to scan (0 = current dir only, 1 = include immediate children, etc.)
    pub max_depth: usize,
}

impl Default for ScanOptions {
    fn default() -> Self {
        Self {
            include_hidden: false,
            max_depth: 1,
        }
    }
}

/// Scan a directory and return its entries as FileNodes
/// 
/// # Arguments
/// 
/// * `path` - The directory to scan
/// * `options` - Scanning options (hidden files, depth)
/// 
/// # Returns
/// 
/// * `Ok(Vec<FileNode>)` - The directory entries sorted (directories first, then alphabetically)
/// * `Err(AppError)` - If directory doesn't exist or permission denied
pub async fn scan_directory(path: &Path, options: &ScanOptions) -> Result<Vec<FileNode>> {
    if !path.is_dir() {
        return Err(AppError::InvalidPath(
            format!("{} is not a directory", path.display())
        ));
    }
    
    // Use jwalk for parallel directory scanning
    let walk = WalkDir::new(path)
        .max_depth(options.max_depth)
        .skip_hidden(!options.include_hidden);
    
    // Collect entries in parallel using rayon
    let entries: Vec<_> = walk
        .into_iter()
        .filter_map(|e| e.ok())
        .collect::<Vec<_>>()
        .into_par_iter()
        .filter_map(|entry| {
            let entry_path = entry.path();
            
            // Skip the root path itself
            if entry_path == path {
                return None;
            }
            
            // Get metadata
            let metadata = match entry.metadata() {
                Ok(m) => m,
                Err(_) => return None, // Skip entries we can't read
            };
            
            let name = entry
                .file_name()
                .to_string_lossy()
                .to_string();
            
            let is_file = metadata.is_file();
            let size = if is_file { Some(metadata.len()) } else { None };
            let modified = metadata.modified().ok();
            
            Some(FileNode::new(
                entry_path.to_path_buf(),
                name,
                is_file,
                size,
                modified,
            ))
        })
        .collect();
    
    // Sort: directories first, then alphabetically by name
    let mut sorted_entries = entries;
    sorted_entries.sort_by(|a, b| {
        match (a.is_file, b.is_file) {
            (false, true) => std::cmp::Ordering::Less,
            (true, false) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });
    
    Ok(sorted_entries)
}

/// Read a directory and return a FileNode with immediate children (lazy loading)
/// 
/// # Arguments
/// 
/// * `path` - The directory to read
/// * `include_hidden` - Whether to include hidden files
/// 
/// # Returns
/// 
/// * `Ok(FileNode)` - The directory node with children populated (but children's children not loaded)
/// * `Err(AppError)` - If directory doesn't exist or permission denied
pub async fn read_directory_lazy(path: &Path, include_hidden: bool) -> Result<FileNode> {
    // Get metadata for the directory itself
    let metadata = fs::metadata(path).await?;
    
    if !metadata.is_dir() {
        return Err(AppError::InvalidPath(
            format!("{} is not a directory", path.display())
        ));
    }
    
    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();
    
    // Scan immediate children only (depth = 1)
    let options = ScanOptions {
        include_hidden,
        max_depth: 1,
    };
    
    let children = scan_directory(path, &options).await?;
    
    // Create the parent node with children
    Ok(FileNode::new(
        path.to_path_buf(),
        name,
        false, // is_file = false (it's a directory)
        None,  // directories don't have size
        metadata.modified().ok(),
    ).with_children(children))
}

/// Get a paginated page of directory entries
/// 
/// # Arguments
/// 
/// * `path` - The directory to read
/// * `offset` - Number of items to skip
/// * `limit` - Maximum number of items to return
/// * `include_hidden` - Whether to include hidden files
/// 
/// # Returns
/// 
/// * `Ok(DirectoryPage)` - A page of directory entries with pagination info
/// * `Err(AppError)` - If directory doesn't exist or permission denied
pub async fn get_directory_page(
    path: &Path,
    offset: usize,
    limit: usize,
    include_hidden: bool,
) -> Result<DirectoryPage> {
    let options = ScanOptions {
        include_hidden,
        max_depth: 1,
    };
    
    let all_entries = scan_directory(path, &options).await?;
    let total_count = all_entries.len();
    
    // Slice the entries for pagination
    let end = (offset + limit).min(total_count);
    let page_entries = if offset < total_count {
        all_entries[offset..end].to_vec()
    } else {
        Vec::new()
    };
    
    let has_more = end < total_count;
    
    Ok(DirectoryPage::new(page_entries, total_count, has_more))
}

/// Count the number of items in a directory (non-recursive)
/// 
/// # Arguments
/// 
/// * `path` - The directory to count
/// * `include_hidden` - Whether to include hidden files
/// 
/// # Returns
/// 
/// * `Ok(usize)` - The number of items in the directory
/// * `Err(AppError)` - If directory doesn't exist or permission denied
pub async fn count_directory_items(path: &Path, include_hidden: bool) -> Result<usize> {
    let options = ScanOptions {
        include_hidden,
        max_depth: 1,
    };
    
    let entries = scan_directory(path, &options).await?;
    Ok(entries.len())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;
    use std::path::PathBuf;
    use tokio::fs;
    
    async fn setup_test_dir() -> PathBuf {
        let test_id = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let temp_dir = env::temp_dir().join(format!("mdx_explorer_test_{}", test_id));
        let _ = fs::remove_dir_all(&temp_dir).await;
        fs::create_dir_all(&temp_dir).await.unwrap();
        temp_dir
    }
    
    async fn cleanup_test_dir(dir: &Path) {
        let _ = fs::remove_dir_all(dir).await;
    }
    
    async fn create_test_structure(base: &Path) {
        // Create files in root
        for i in 1..=5 {
            fs::write(base.join(format!("file{}.txt", i)), "content").await.unwrap();
        }
        
        // Create hidden file
        fs::write(base.join(".hidden"), "hidden content").await.unwrap();
        
        // Create folders with files
        for i in 1..=2 {
            let folder = base.join(format!("folder{}", i));
            fs::create_dir(&folder).await.unwrap();
            
            for j in 1..=10 {
                fs::write(folder.join(format!("file{}.txt", j)), "content").await.unwrap();
            }
        }
        
        // Create nested structure
        let nested = base.join("nested").join("deep").join("structure");
        fs::create_dir_all(&nested).await.unwrap();
        fs::write(nested.join("deep_file.txt"), "deep content").await.unwrap();
    }
    
    #[tokio::test]
    async fn test_scan_directory_basic() {
        let base = setup_test_dir().await;
        create_test_structure(&base).await;
        
        let options = ScanOptions {
            include_hidden: false,
            max_depth: 1,
        };
        
        let result = scan_directory(&base, &options).await;
        assert!(result.is_ok());
        
        let entries = result.unwrap();
        
        // Should have 5 files + 3 folders = 8 items (no hidden)
        assert_eq!(entries.len(), 8);
        
        // Verify folders come first
        assert!(!entries[0].is_file);
        assert!(!entries[1].is_file);
        assert!(!entries[2].is_file);
        
        cleanup_test_dir(&base).await;
    }
    
    #[tokio::test]
    async fn test_scan_directory_with_hidden() {
        let base = setup_test_dir().await;
        create_test_structure(&base).await;
        
        let options = ScanOptions {
            include_hidden: true,
            max_depth: 1,
        };
        
        let result = scan_directory(&base, &options).await;
        assert!(result.is_ok());
        
        let entries = result.unwrap();
        
        // Should include hidden file: 5 files + 1 hidden + 3 folders = 9 items
        assert_eq!(entries.len(), 9);
        
        cleanup_test_dir(&base).await;
    }
    
    #[tokio::test]
    async fn test_read_directory_lazy() {
        let base = setup_test_dir().await;
        create_test_structure(&base).await;
        
        let result = read_directory_lazy(&base, false).await;
        assert!(result.is_ok());
        
        let node = result.unwrap();
        assert!(!node.is_file);
        assert!(node.children.is_some());
        
        let children = node.children.unwrap();
        assert_eq!(children.len(), 8); // 5 files + 3 folders
        
        // Verify children don't have their children loaded
        for child in &children {
            if !child.is_file {
                assert!(child.children.is_none());
            }
        }
        
        cleanup_test_dir(&base).await;
    }
    
    #[tokio::test]
    async fn test_get_directory_page() {
        let base = setup_test_dir().await;
        create_test_structure(&base).await;
        
        // Get first page (3 items)
        let result = get_directory_page(&base, 0, 3, false).await;
        assert!(result.is_ok());
        
        let page = result.unwrap();
        assert_eq!(page.nodes.len(), 3);
        assert_eq!(page.total_count, 8);
        assert!(page.has_more);
        
        // Get second page (3 items)
        let result = get_directory_page(&base, 3, 3, false).await;
        assert!(result.is_ok());
        
        let page = result.unwrap();
        assert_eq!(page.nodes.len(), 3);
        assert_eq!(page.total_count, 8);
        assert!(page.has_more);
        
        // Get third page (remaining 2 items)
        let result = get_directory_page(&base, 6, 3, false).await;
        assert!(result.is_ok());
        
        let page = result.unwrap();
        assert_eq!(page.nodes.len(), 2);
        assert_eq!(page.total_count, 8);
        assert!(!page.has_more);
        
        cleanup_test_dir(&base).await;
    }
    
    #[tokio::test]
    async fn test_count_directory_items() {
        let base = setup_test_dir().await;
        create_test_structure(&base).await;
        
        let result = count_directory_items(&base, false).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 8);
        
        let result_with_hidden = count_directory_items(&base, true).await;
        assert!(result_with_hidden.is_ok());
        assert_eq!(result_with_hidden.unwrap(), 9);
        
        cleanup_test_dir(&base).await;
    }
    
    #[tokio::test]
    async fn test_scan_empty_directory() {
        let base = setup_test_dir().await;
        
        let options = ScanOptions::default();
        let result = scan_directory(&base, &options).await;
        assert!(result.is_ok());
        
        let entries = result.unwrap();
        assert_eq!(entries.len(), 0);
        
        cleanup_test_dir(&base).await;
    }
    
    #[tokio::test]
    async fn test_scan_nonexistent_directory() {
        let base = setup_test_dir().await;
        let nonexistent = base.join("nonexistent");
        
        let options = ScanOptions::default();
        let result = scan_directory(&nonexistent, &options).await;
        assert!(result.is_err());
        
        cleanup_test_dir(&base).await;
    }
    
    #[tokio::test]
    async fn test_alphabetical_sorting() {
        let base = setup_test_dir().await;
        
        // Create files with specific names to test sorting
        fs::write(base.join("zebra.txt"), "").await.unwrap();
        fs::write(base.join("apple.txt"), "").await.unwrap();
        fs::write(base.join("banana.txt"), "").await.unwrap();
        
        fs::create_dir(base.join("zoo")).await.unwrap();
        fs::create_dir(base.join("archive")).await.unwrap();
        
        let options = ScanOptions::default();
        let result = scan_directory(&base, &options).await;
        assert!(result.is_ok());
        
        let entries = result.unwrap();
        
        // Folders first: archive, zoo
        assert_eq!(entries[0].name, "archive");
        assert_eq!(entries[1].name, "zoo");
        
        // Then files alphabetically: apple, banana, zebra
        assert_eq!(entries[2].name, "apple.txt");
        assert_eq!(entries[3].name, "banana.txt");
        assert_eq!(entries[4].name, "zebra.txt");
        
        cleanup_test_dir(&base).await;
    }
}
