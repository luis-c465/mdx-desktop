use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::time::SystemTime;

/// Represents a file or directory node in the file tree
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileNode {
    /// Absolute path to the file or directory
    pub path: PathBuf,

    /// Display name (file/folder name without path)
    pub name: String,

    /// True if this is a file, false if directory
    pub is_file: bool,

    /// File size in bytes (None for directories)
    pub size: Option<u64>,

    /// Last modified timestamp
    pub modified: Option<SystemTime>,

    /// Child nodes for directories (None if not loaded/lazy loaded)
    pub children: Option<Vec<FileNode>>,
}

impl FileNode {
    /// Create a new FileNode
    pub fn new(
        path: PathBuf,
        name: String,
        is_file: bool,
        size: Option<u64>,
        modified: Option<SystemTime>,
    ) -> Self {
        Self {
            path,
            name,
            is_file,
            size,
            modified,
            children: None,
        }
    }

    /// Create a FileNode with children
    pub fn with_children(mut self, children: Vec<FileNode>) -> Self {
        self.children = Some(children);
        self
    }
}

/// Pagination result for large directories
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirectoryPage {
    /// Page of file nodes
    pub nodes: Vec<FileNode>,

    /// Total number of items in the directory
    pub total_count: usize,

    /// Whether there are more items after this page
    pub has_more: bool,
}

impl DirectoryPage {
    /// Create a new DirectoryPage
    pub fn new(nodes: Vec<FileNode>, total_count: usize, has_more: bool) -> Self {
        Self {
            nodes,
            total_count,
            has_more,
        }
    }
}

/// File system event payload for watcher events
///
/// Emitted to the frontend when file system changes are detected.
/// Uses relative paths from the workspace root for frontend consumption.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum FsEventPayload {
    /// A file or folder was created
    Created { path: String },

    /// A file or folder was modified
    Modified { path: String },

    /// A file or folder was deleted
    Deleted { path: String },
}
