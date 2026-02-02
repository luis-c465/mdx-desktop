/// Tauri command layer
/// 
/// This module exposes file system operations as Tauri commands that can be
/// invoked from the frontend. All commands validate paths against the current
/// workspace and use spawn_blocking for non-blocking I/O operations.

pub mod file_ops;
pub mod dir_ops;
pub mod dialog;

// Re-export all commands for easy registration
pub use file_ops::*;
pub use dir_ops::*;
pub use dialog::*;
