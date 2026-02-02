use crate::error::{AppError, Result};
use crate::state::AppState;
use std::path::{Path, PathBuf};

/// Validates a path against a base directory to prevent path traversal attacks
///
/// # Arguments
///
/// * `base_dir` - The base directory that all paths must be within
/// * `target` - The target path to validate (can be relative or absolute)
///
/// # Returns
///
/// * `Ok(PathBuf)` - The canonicalized absolute path if valid
/// * `Err(AppError)` - If the path is invalid or attempts to escape base_dir
///
/// # Security
///
/// This function prevents directory traversal attacks by:
/// 1. Rejecting paths containing ".."
/// 2. Canonicalizing both base and target paths
/// 3. Verifying the final path starts with the base directory
pub fn validate_path(base_dir: &Path, target: &str) -> Result<PathBuf> {
    // Reject paths containing ".." explicitly
    if target.contains("..") {
        return Err(AppError::PathTraversal(format!(
            "Path contains '..' which is not allowed: {}",
            target
        )));
    }

    // Canonicalize the base directory
    let base_canonical = base_dir
        .canonicalize()
        .map_err(|e| AppError::InvalidPath(format!("Invalid base directory: {}", e)))?;

    // Convert target to PathBuf and join with base if relative
    let target_path = PathBuf::from(target);
    let full_path = if target_path.is_absolute() {
        target_path
    } else {
        base_canonical.join(target_path)
    };

    // Canonicalize the full path
    // Note: This will fail if the path doesn't exist, which is fine for validation
    // For operations that create new files, we'll canonicalize the parent instead
    let final_path = match full_path.canonicalize() {
        Ok(p) => p,
        Err(_) => {
            // If path doesn't exist, try to canonicalize parent
            if let Some(parent) = full_path.parent() {
                let parent_canonical = parent
                    .canonicalize()
                    .map_err(|e| AppError::InvalidPath(format!("Invalid parent path: {}", e)))?;

                // Verify parent is within base_dir
                if !parent_canonical.starts_with(&base_canonical) {
                    return Err(AppError::PathTraversal(format!(
                        "Path attempts to escape base directory: {}",
                        target
                    )));
                }

                // Return the non-canonical full path (it will be created)
                return Ok(full_path);
            } else {
                return Err(AppError::InvalidPath(format!(
                    "Path has no parent: {}",
                    target
                )));
            }
        }
    };

    // Verify the canonicalized path is within base_dir
    if !final_path.starts_with(&base_canonical) {
        return Err(AppError::PathTraversal(format!(
            "Path attempts to escape base directory: {}",
            target
        )));
    }

    Ok(final_path)
}

/// Validates a path against the current workspace from AppState
///
/// This is the primary validation function used by Tauri commands.
/// It retrieves the workspace from state and validates the target path against it.
///
/// # Arguments
///
/// * `state` - The application state containing the workspace directory
/// * `target` - The target path to validate (relative to workspace)
///
/// # Returns
///
/// * `Ok(PathBuf)` - The canonicalized absolute path if valid
/// * `Err(AppError)` - If no workspace is set, path is invalid, or attempts to escape workspace
///
/// # Future Extension
///
/// When individual file support is added, this function will also check against
/// the `allowed_paths` set in AppState, allowing access to specific files outside
/// the workspace that the user has explicitly opened.
pub fn validate_path_with_state(state: &AppState, target: &str) -> Result<PathBuf> {
    // Get the current workspace
    let workspace = state.get_workspace().ok_or_else(|| {
        AppError::InvalidPath("No workspace is open. Please select a folder first.".to_string())
    })?;

    // Validate against workspace using existing validation logic
    validate_path(&workspace, target)

    // Future: Also check if target is in allowed_paths
    // if !result.is_ok() {
    //     let config = state.get_config();
    //     if config.allowed_paths.iter().any(|p| target.starts_with(p)) {
    //         // Allow access to individually opened files
    //         return validate_path(allowed_path, target);
    //     }
    // }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;
    use std::fs;

    fn setup_test_dir() -> PathBuf {
        let test_id = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let temp_dir = env::temp_dir().join(format!("mdx_validation_test_{}", test_id));
        let _ = fs::remove_dir_all(&temp_dir);
        fs::create_dir_all(&temp_dir).unwrap();
        temp_dir
    }

    #[test]
    fn test_valid_relative_path() {
        let base = setup_test_dir();
        let test_file = base.join("test.txt");
        fs::write(&test_file, "test").unwrap();

        let result = validate_path(&base, "test.txt");
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), test_file);

        fs::remove_dir_all(&base).unwrap();
    }

    #[test]
    fn test_reject_parent_traversal() {
        let base = setup_test_dir();

        let result = validate_path(&base, "../etc/passwd");
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), AppError::PathTraversal(_)));

        fs::remove_dir_all(&base).unwrap();
    }

    #[test]
    fn test_reject_double_dot() {
        let base = setup_test_dir();

        let result = validate_path(&base, "foo/../bar");
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), AppError::PathTraversal(_)));

        fs::remove_dir_all(&base).unwrap();
    }

    #[test]
    fn test_nested_path() {
        let base = setup_test_dir();
        let nested = base.join("a").join("b").join("c");
        fs::create_dir_all(&nested).unwrap();
        let test_file = nested.join("test.txt");
        fs::write(&test_file, "test").unwrap();

        let result = validate_path(&base, "a/b/c/test.txt");
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), test_file);

        fs::remove_dir_all(&base).unwrap();
    }

    #[test]
    fn test_nonexistent_path() {
        let base = setup_test_dir();

        // Should allow non-existent paths if parent exists
        let result = validate_path(&base, "newfile.txt");
        assert!(result.is_ok());

        fs::remove_dir_all(&base).unwrap();
    }

    #[test]
    fn test_absolute_path_outside_base() {
        let base = setup_test_dir();

        let result = validate_path(&base, "/etc/passwd");
        assert!(result.is_err());

        fs::remove_dir_all(&base).unwrap();
    }

    #[test]
    fn test_empty_path() {
        let base = setup_test_dir();

        let result = validate_path(&base, "");
        // Empty path should resolve to base dir itself
        assert!(result.is_ok());

        fs::remove_dir_all(&base).unwrap();
    }
}
