fn main() {
    // tauri-build watches tauri.conf.json and capabilities, which replaces
    // Cargo's default package scan. embed-resource does not watch the .ico
    // it compiles into the exe. The Windows title-bar icon is that resource.
    println!("cargo:rerun-if-changed=icons/icon.ico");
    tauri_build::build()
}
