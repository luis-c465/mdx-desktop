use serde::{Deserialize, Serialize};
use std::fmt;

/// Application error types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "message")]
pub enum AppError {
    /// Permission denied when accessing file or directory
    PermissionDenied(String),

    /// Invalid or malformed path
    InvalidPath(String),

    /// File or directory not found
    FileNotFound(String),

    /// Path traversal attack detected
    PathTraversal(String),

    /// Generic I/O error
    IoError(String),

    /// File too large to read
    FileTooLarge(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::PermissionDenied(msg) => write!(f, "Permission denied: {}", msg),
            AppError::InvalidPath(msg) => write!(f, "Invalid path: {}", msg),
            AppError::FileNotFound(msg) => write!(f, "File not found: {}", msg),
            AppError::PathTraversal(msg) => write!(f, "Path traversal detected: {}", msg),
            AppError::IoError(msg) => write!(f, "I/O error: {}", msg),
            AppError::FileTooLarge(msg) => write!(f, "File too large: {}", msg),
        }
    }
}

impl std::error::Error for AppError {}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        use std::io::ErrorKind;

        match err.kind() {
            ErrorKind::NotFound => AppError::FileNotFound(err.to_string()),
            ErrorKind::PermissionDenied => AppError::PermissionDenied(err.to_string()),
            ErrorKind::InvalidInput => AppError::InvalidPath(err.to_string()),
            _ => AppError::IoError(err.to_string()),
        }
    }
}

pub type Result<T> = std::result::Result<T, AppError>;
