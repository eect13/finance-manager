#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            if let Some(win) = app.get_webview_window("main") {
                // Path is relative to src-tauri/ (Cargo.toml), not this file.
                let _ = win.set_icon(tauri::include_image!("icons/icon.png"));
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Finance Manager");
}
