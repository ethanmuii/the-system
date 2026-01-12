use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use window_vibrancy::apply_acrylic;

/// Command to quit the application (called from frontend after confirmation)
#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

/// Toggle window visibility - shows if hidden, hides if visible
fn toggle_window_visibility(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if let Ok(visible) = window.is_visible() {
            if visible {
                let _ = window.hide();
            } else {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }
    }
}

/// Show the window (used by tray click and menu)
fn show_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

/// Navigate to a specific view by emitting an event to the frontend
fn navigate_to_view(app: &tauri::AppHandle, view: &str) {
    show_window(app);
    let _ = app.emit("navigate-to-view", view);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![quit_app])
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        // Global shortcut plugin with handler
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    let ctrl_shift_a =
                        Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyA);
                    if shortcut == &ctrl_shift_a && event.state == ShortcutState::Pressed {
                        toggle_window_visibility(app);
                    }
                })
                .build(),
        )
        .setup(|app| {
            // Register the global shortcut - ignore error if already registered
            let ctrl_shift_a =
                Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyA);

            // Try to unregister first (in case of previous crash/hot-reload)
            let _ = app.global_shortcut().unregister_all();

            // Register the shortcut, log but don't fail if it doesn't work
            if let Err(e) = app.global_shortcut().register(ctrl_shift_a) {
                log::warn!("Failed to register global shortcut Ctrl+Shift+A: {}", e);
            }

            // Set up logging in debug mode
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Apply Acrylic effect on Windows
            let window = app.get_webview_window("main").unwrap();

            #[cfg(target_os = "windows")]
            apply_acrylic(&window, None)
                .expect("Failed to apply acrylic effect");

            // Create system tray menu items
            let show_item = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let timer_item = MenuItem::with_id(app, "timer", "Timer", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            // Build the tray menu
            let menu = Menu::with_items(app, &[&show_item, &timer_item, &quit_item])?;

            // Create system tray icon
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false) // Left click shows window, right click shows menu
                .tooltip("ARISE")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        show_window(app);
                    }
                    "timer" => {
                        navigate_to_view(app, "timer");
                    }
                    "quit" => {
                        // Emit event to frontend - it will show confirmation if timer is running
                        show_window(app);
                        let _ = app.emit("quit-requested", ());
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_window(tray.app_handle());
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
