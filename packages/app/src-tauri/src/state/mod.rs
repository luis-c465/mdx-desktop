/// Application state management
///
/// Manages the application's workspace directory and provides persistence
/// across app restarts. Designed to be extensible for future features like
/// individual file access outside the workspace.
use crate::error::{AppError, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::{Arc, RwLock};

/// Configuration that persists between app restarts
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    /// Currently open workspace directory
    pub workspace_dir: Option<PathBuf>,

    /// Last directory shown in the file picker (for UX)
    pub last_dialog_dir: Option<PathBuf>,
    // Future: Add support for individual files outside workspace
    // pub allowed_paths: Vec<PathBuf>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            workspace_dir: None,
            last_dialog_dir: None,
        }
    }
}

/// Application state shared across all Tauri commands
///
/// This state is thread-safe and can be accessed concurrently by multiple commands.
/// Uses Arc<RwLock<T>> for interior mutability across command invocations.
#[derive(Debug, Clone)]
pub struct AppState {
    /// Current configuration
    config: Arc<RwLock<AppConfig>>,

    /// Path to the config file for persistence
    config_path: Arc<PathBuf>,
}

impl AppState {
    /// Create a new AppState with a config file path
    ///
    /// # Arguments
    ///
    /// * `config_path` - Path where configuration will be saved/loaded
    pub fn new(config_path: PathBuf) -> Self {
        Self {
            config: Arc::new(RwLock::new(AppConfig::default())),
            config_path: Arc::new(config_path),
        }
    }

    /// Load configuration from disk
    ///
    /// If the config file doesn't exist or is invalid, returns default config
    /// without error (graceful degradation).
    pub fn load(&self) -> Result<()> {
        if !self.config_path.exists() {
            // No config file yet, use defaults
            return Ok(());
        }

        let content = std::fs::read_to_string(self.config_path.as_ref())
            .map_err(|e| AppError::IoError(format!("Failed to read config file: {}", e)))?;

        let loaded_config: AppConfig = serde_json::from_str(&content)
            .map_err(|e| AppError::IoError(format!("Failed to parse config file: {}", e)))?;

        let mut config = self.config.write().unwrap();
        *config = loaded_config;

        Ok(())
    }

    /// Save configuration to disk
    pub fn save(&self) -> Result<()> {
        let config = self.config.read().unwrap();

        // Ensure parent directory exists
        if let Some(parent) = self.config_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| {
                AppError::IoError(format!("Failed to create config directory: {}", e))
            })?;
        }

        let content = serde_json::to_string_pretty(&*config)
            .map_err(|e| AppError::IoError(format!("Failed to serialize config: {}", e)))?;

        std::fs::write(self.config_path.as_ref(), content)
            .map_err(|e| AppError::IoError(format!("Failed to write config file: {}", e)))?;

        Ok(())
    }

    /// Get the current workspace directory
    ///
    /// Returns None if no workspace is currently open
    pub fn get_workspace(&self) -> Option<PathBuf> {
        let config = self.config.read().unwrap();
        config.workspace_dir.clone()
    }

    /// Set the workspace directory and save to disk
    ///
    /// # Arguments
    ///
    /// * `workspace` - The new workspace directory path
    pub fn set_workspace(&self, workspace: PathBuf) -> Result<()> {
        {
            let mut config = self.config.write().unwrap();
            config.workspace_dir = Some(workspace.clone());
            config.last_dialog_dir = Some(workspace);
        }
        self.save()
    }

    /// Clear the current workspace
    pub fn clear_workspace(&self) -> Result<()> {
        {
            let mut config = self.config.write().unwrap();
            config.workspace_dir = None;
        }
        self.save()
    }

    /// Get the last directory used in the file picker dialog
    ///
    /// This provides better UX by opening the dialog in the last used location
    pub fn get_last_dialog_dir(&self) -> Option<PathBuf> {
        let config = self.config.read().unwrap();
        config.last_dialog_dir.clone()
    }

    /// Set the last directory used in the file picker dialog
    pub fn set_last_dialog_dir(&self, dir: PathBuf) -> Result<()> {
        {
            let mut config = self.config.write().unwrap();
            config.last_dialog_dir = Some(dir);
        }
        self.save()
    }

    /// Get the entire configuration (for debugging/inspection)
    pub fn get_config(&self) -> AppConfig {
        let config = self.config.read().unwrap();
        config.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    fn setup_test_config_path() -> PathBuf {
        let test_id = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        env::temp_dir().join(format!("mdx_state_test_{}.json", test_id))
    }

    #[test]
    fn test_new_state_has_no_workspace() {
        let config_path = setup_test_config_path();
        let state = AppState::new(config_path.clone());

        assert!(state.get_workspace().is_none());

        let _ = std::fs::remove_file(config_path);
    }

    #[test]
    fn test_set_and_get_workspace() {
        let config_path = setup_test_config_path();
        let state = AppState::new(config_path.clone());

        let workspace = PathBuf::from("/home/user/my-notes");
        state.set_workspace(workspace.clone()).unwrap();

        assert_eq!(state.get_workspace(), Some(workspace));

        let _ = std::fs::remove_file(config_path);
    }

    #[test]
    fn test_clear_workspace() {
        let config_path = setup_test_config_path();
        let state = AppState::new(config_path.clone());

        let workspace = PathBuf::from("/home/user/my-notes");
        state.set_workspace(workspace).unwrap();
        state.clear_workspace().unwrap();

        assert!(state.get_workspace().is_none());

        let _ = std::fs::remove_file(config_path);
    }

    #[test]
    fn test_persistence_across_instances() {
        let config_path = setup_test_config_path();

        // First instance sets workspace
        {
            let state1 = AppState::new(config_path.clone());
            let workspace = PathBuf::from("/home/user/my-notes");
            state1.set_workspace(workspace).unwrap();
        }

        // Second instance loads from disk
        {
            let state2 = AppState::new(config_path.clone());
            state2.load().unwrap();

            assert_eq!(
                state2.get_workspace(),
                Some(PathBuf::from("/home/user/my-notes"))
            );
        }

        let _ = std::fs::remove_file(config_path);
    }

    #[test]
    fn test_last_dialog_dir() {
        let config_path = setup_test_config_path();
        let state = AppState::new(config_path.clone());

        let dir = PathBuf::from("/home/user/documents");
        state.set_last_dialog_dir(dir.clone()).unwrap();

        assert_eq!(state.get_last_dialog_dir(), Some(dir));

        let _ = std::fs::remove_file(config_path);
    }

    #[test]
    fn test_set_workspace_updates_last_dialog_dir() {
        let config_path = setup_test_config_path();
        let state = AppState::new(config_path.clone());

        let workspace = PathBuf::from("/home/user/my-notes");
        state.set_workspace(workspace.clone()).unwrap();

        // Should also update last_dialog_dir
        assert_eq!(state.get_last_dialog_dir(), Some(workspace));

        let _ = std::fs::remove_file(config_path);
    }

    #[test]
    fn test_load_nonexistent_config_uses_defaults() {
        let config_path = setup_test_config_path();
        let state = AppState::new(config_path.clone());

        // Should not error even though file doesn't exist
        assert!(state.load().is_ok());
        assert!(state.get_workspace().is_none());

        let _ = std::fs::remove_file(config_path);
    }
}
