use serde::Serialize;
use std::collections::HashSet;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

/// Must match `SUPPORTED_EXTENSIONS` in `src/lib/constants.ts`.
pub const SUPPORTED_EXTENSIONS: &[&str] = &["jpg", "jpeg", "png", "webp", "bmp", "pdf"];

#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ScannedFile {
    pub path: String,
    pub name: String,
    pub kind: &'static str,
    pub size: u64,
    /// The imported folder this file was found in; `None` for an explicit file.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub root: Option<String>,
    /// Directory components from `root` to the file's parent; empty directly in `root`.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dirs: Option<Vec<String>>,
}

#[derive(Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanResult {
    pub files: Vec<ScannedFile>,
    /// Files with an unsupported extension.
    pub ignored: u32,
    /// Directory entries that could not be read.
    pub skipped_dirs: u32,
}

fn kind_of(path: &Path) -> Option<&'static str> {
    let ext = path.extension()?.to_str()?.to_ascii_lowercase();
    if !SUPPORTED_EXTENSIONS.contains(&ext.as_str()) {
        return None;
    }
    Some(if ext == "pdf" { "pdf" } else { "image" })
}

fn is_hidden(path: &Path) -> bool {
    if path
        .file_name()
        .and_then(|n| n.to_str())
        .is_some_and(|n| n.starts_with('.'))
    {
        return true;
    }
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        const HIDDEN: u32 = 0x2;
        const SYSTEM: u32 = 0x4;
        if let Ok(meta) = std::fs::metadata(path) {
            return meta.file_attributes() & (HIDDEN | SYSTEM) != 0;
        }
    }
    false
}

struct Scanner {
    result: ScanResult,
    seen: HashSet<PathBuf>,
}

impl Scanner {
    /// `root` is the imported folder for a file found by `scan_dir`.
    fn push_file(&mut self, path: &Path, size: u64, root: Option<&Path>) {
        let Some(kind) = kind_of(path) else {
            self.result.ignored += 1;
            return;
        };
        let key = std::fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf());
        if !self.seen.insert(key) {
            return;
        }
        self.result.files.push(ScannedFile {
            path: path.to_string_lossy().into_owned(),
            name: path
                .file_name()
                .map(|n| n.to_string_lossy().into_owned())
                .unwrap_or_default(),
            kind,
            size,
            root: root.map(|r| r.to_string_lossy().into_owned()),
            dirs: root.map(|r| {
                path.parent()
                    .and_then(|p| p.strip_prefix(r).ok())
                    .map(|rel| {
                        rel.components()
                            .map(|c| c.as_os_str().to_string_lossy().into_owned())
                            .collect()
                    })
                    .unwrap_or_default()
            }),
        });
    }

    fn scan_dir(&mut self, root: &Path) {
        let mut found: Vec<(PathBuf, u64)> = Vec::new();
        let walker = WalkDir::new(root)
            .follow_links(false)
            .into_iter()
            .filter_entry(|e| e.depth() == 0 || !is_hidden(e.path()));
        for entry in walker {
            match entry {
                Ok(e) if e.file_type().is_file() => {
                    let size = e.metadata().map(|m| m.len()).unwrap_or(0);
                    found.push((e.into_path(), size));
                }
                Ok(_) => {}
                Err(_) => self.result.skipped_dirs += 1,
            }
        }
        found.sort_by(|a, b| a.0.cmp(&b.0));
        for (path, size) in found {
            self.push_file(&path, size, Some(root));
        }
    }
}

/// Expand files and directories (recursively) into supported files.
/// Explicit files keep their given order; directory contents follow, sorted by path.
pub fn scan(paths: &[String]) -> ScanResult {
    let mut scanner = Scanner {
        result: ScanResult::default(),
        seen: HashSet::new(),
    };
    let (dirs, files): (Vec<&Path>, Vec<&Path>) =
        paths.iter().map(Path::new).partition(|p| p.is_dir());
    for file in files {
        match std::fs::metadata(file) {
            Ok(meta) => scanner.push_file(file, meta.len(), None),
            Err(_) => scanner.result.ignored += 1,
        }
    }
    for dir in dirs {
        scanner.scan_dir(dir);
    }
    scanner.result
}

#[tauri::command]
pub async fn scan_paths(paths: Vec<String>) -> Result<ScanResult, String> {
    tauri::async_runtime::spawn_blocking(move || scan(&paths))
        .await
        .map_err(|e| format!("扫描失败：{e}"))
}

#[tauri::command]
pub async fn read_file(path: String) -> Result<tauri::ipc::Response, String> {
    tauri::async_runtime::spawn_blocking(move || std::fs::read(&path))
        .await
        .map_err(|e| format!("文件无法读取：{e}"))?
        .map(tauri::ipc::Response::new)
        .map_err(|e| format!("文件无法读取：{e}"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn names(r: &ScanResult) -> Vec<&str> {
        r.files.iter().map(|f| f.name.as_str()).collect()
    }

    #[test]
    fn scans_directories_recursively_and_filters_extensions() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(dir.path().join("a.JPG"), b"x").unwrap();
        fs::write(dir.path().join("notes.txt"), b"x").unwrap();
        fs::create_dir(dir.path().join("sub")).unwrap();
        fs::write(dir.path().join("sub").join("b.png"), b"x").unwrap();
        fs::write(dir.path().join("sub").join("c.pdf"), b"x").unwrap();

        let r = scan(&[dir.path().to_string_lossy().into_owned()]);
        assert_eq!(names(&r), vec!["a.JPG", "b.png", "c.pdf"]);
        assert_eq!(r.files[2].kind, "pdf");
        assert_eq!(r.files[0].kind, "image");
        assert_eq!(r.ignored, 1);
    }

    #[test]
    fn skips_hidden_entries() {
        let dir = tempfile::tempdir().unwrap();
        fs::create_dir(dir.path().join(".cache")).unwrap();
        fs::write(dir.path().join(".cache").join("x.png"), b"x").unwrap();
        fs::write(dir.path().join(".y.png"), b"x").unwrap();
        fs::write(dir.path().join("z.png"), b"x").unwrap();

        let r = scan(&[dir.path().to_string_lossy().into_owned()]);
        assert_eq!(names(&r), vec!["z.png"]);
    }

    #[test]
    fn deduplicates_and_keeps_explicit_files_first() {
        let dir = tempfile::tempdir().unwrap();
        let a = dir.path().join("a.png");
        let b = dir.path().join("b.webp");
        fs::write(&a, b"x").unwrap();
        fs::write(&b, b"x").unwrap();
        let a_str = a.to_string_lossy().into_owned();

        let r = scan(&[
            dir.path().to_string_lossy().into_owned(),
            b.to_string_lossy().into_owned(),
            a_str.clone(),
            a_str,
        ]);
        assert_eq!(names(&r), vec!["b.webp", "a.png"]);
    }

    #[test]
    fn folder_files_carry_root_and_relative_dirs() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path().join("证书");
        fs::create_dir_all(root.join("2024").join("省赛")).unwrap();
        fs::write(root.join("a.jpg"), b"x").unwrap();
        fs::write(root.join("2024").join("b.png"), b"x").unwrap();
        fs::write(root.join("2024").join("省赛").join("c.pdf"), b"x").unwrap();
        let loose = dir.path().join("x.png");
        fs::write(&loose, b"x").unwrap();
        let root_str = root.to_string_lossy().into_owned();

        let r = scan(&[root_str.clone(), loose.to_string_lossy().into_owned()]);
        let by_name = |n: &str| r.files.iter().find(|f| f.name == n).unwrap();
        assert_eq!(by_name("x.png").root, None);
        assert_eq!(by_name("x.png").dirs, None);
        assert_eq!(by_name("a.jpg").root.as_deref(), Some(root_str.as_str()));
        assert_eq!(by_name("a.jpg").dirs, Some(vec![]));
        assert_eq!(by_name("b.png").dirs, Some(vec!["2024".to_string()]));
        assert_eq!(
            by_name("c.pdf").dirs,
            Some(vec!["2024".to_string(), "省赛".to_string()])
        );
    }

    #[test]
    fn explicit_file_inside_a_scanned_folder_has_no_root() {
        let dir = tempfile::tempdir().unwrap();
        let a = dir.path().join("a.png");
        fs::write(&a, b"x").unwrap();
        let r = scan(&[
            dir.path().to_string_lossy().into_owned(),
            a.to_string_lossy().into_owned(),
        ]);
        assert_eq!(r.files.len(), 1);
        assert_eq!(r.files[0].root, None);
    }

    #[test]
    fn root_with_trailing_separator_gives_relative_dirs() {
        // Same shape as a drive root such as `D:\`, which ends with a separator.
        let dir = tempfile::tempdir().unwrap();
        fs::create_dir(dir.path().join("sub")).unwrap();
        fs::write(dir.path().join("sub").join("b.png"), b"x").unwrap();
        let root = format!(
            "{}{}",
            dir.path().to_string_lossy(),
            std::path::MAIN_SEPARATOR
        );
        let r = scan(&[root]);
        assert_eq!(r.files[0].dirs, Some(vec!["sub".to_string()]));
    }

    #[test]
    fn counts_missing_explicit_files_as_ignored() {
        let r = scan(&["Z:/does/not/exist.png".to_string()]);
        assert!(r.files.is_empty());
        assert_eq!(r.ignored, 1);
    }
}
