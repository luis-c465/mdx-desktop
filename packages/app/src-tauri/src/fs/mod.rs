/// File system operations module
/// 
/// This module provides core file system functionality including:
/// - Directory exploration and scanning
/// - File operations (read, write, delete, rename)
/// - Path validation and security
/// - Support for lazy loading and pagination

pub mod types;
pub mod validation;
pub mod operations;
pub mod explorer;

pub use types::{FileNode, DirectoryPage, FsEventPayload};
pub use validation::{validate_path, validate_path_with_state};
pub use operations::*;
pub use explorer::*;
