mod error;
pub mod fs;
mod state;
pub mod commands;

pub use error::{AppError, Result};
pub use state::AppState;

use std::path::PathBuf;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|app| {
            // Determine config file path (use app data directory)
            let config_path = app
                .path()
                .app_data_dir()
                .map(|p: PathBuf| p.join("config.json"))
                .unwrap_or_else(|_| PathBuf::from("config.json"));

            // Initialize state
            let state = AppState::new(config_path);

            // Load saved configuration
            if let Err(e) = state.load() {
                eprintln!("Warning: Failed to load config: {}", e);
            }

            // Make state available to all commands
            app.manage(state);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // File operations
            commands::read_file,
            commands::write_file,
            commands::create_file_command,
            commands::rename_path_command,
            commands::delete_path_command,
            commands::upload_image,
            // Directory operations
            commands::create_folder_command,
            commands::read_directory,
            commands::get_directory_page,
            // Dialog operations
            commands::show_open_dialog,
            commands::get_workspace,
            commands::clear_workspace,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
