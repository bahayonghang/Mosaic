use image::codecs::{bmp::BmpEncoder, jpeg::JpegEncoder, png::PngEncoder, webp::WebPEncoder};
use image::{ExtendedColorType, ImageEncoder, ImageFormat, RgbaImage};
use percent_encoding::percent_decode_str;
use std::fs::{File, OpenOptions};
use std::io::{ErrorKind, Write};
use std::path::{Path, PathBuf};
use tauri::ipc::{InvokeBody, Request};

const MAX_SUFFIX: u32 = 9999;

fn fail(e: impl std::fmt::Display) -> String {
    format!("导出失败：{e}")
}

/// `<stem>_mosaic.<ext>` next to the source for n = 1, `<stem>_mosaic_<n>.<ext>` after that.
pub fn target_name(source: &Path, n: u32) -> PathBuf {
    let stem = source.file_stem().unwrap_or_default().to_string_lossy();
    let ext = source
        .extension()
        .map(|e| format!(".{}", e.to_string_lossy()))
        .unwrap_or_default();
    let name = if n == 1 {
        format!("{stem}_mosaic{ext}")
    } else {
        format!("{stem}_mosaic_{n}{ext}")
    };
    source.with_file_name(name)
}

/// Create the first free automatic target. `create_new` makes the check and the create one step.
pub fn create_unique(source: &Path) -> Result<(PathBuf, File), String> {
    for n in 1..=MAX_SUFFIX {
        let path = target_name(source, n);
        match OpenOptions::new().write(true).create_new(true).open(&path) {
            Ok(file) => return Ok((path, file)),
            Err(e) if e.kind() == ErrorKind::AlreadyExists => continue,
            Err(e) => return Err(fail(e)),
        }
    }
    Err(fail("同名文件过多"))
}

/// Save as: the user confirmed an overwrite in the system dialog, but the source is never written.
pub fn create_target(source: &Path, target: &Path) -> Result<File, String> {
    let same = matches!((source.canonicalize(), target.canonicalize()), (Ok(a), Ok(b)) if a == b);
    if same {
        return Err("不能覆盖原文件".into());
    }
    File::create(target).map_err(fail)
}

fn write_to(source: &Path, target: Option<&Path>, bytes: &[u8]) -> Result<PathBuf, String> {
    let (path, mut file) = match target {
        Some(t) => (t.to_path_buf(), create_target(source, t)?),
        None => create_unique(source)?,
    };
    if let Err(e) = file.write_all(bytes).and_then(|_| file.sync_all()) {
        drop(file);
        let _ = std::fs::remove_file(&path);
        return Err(fail(e));
    }
    Ok(path)
}

/// RGB over a white background, for formats without alpha.
fn flatten(img: &RgbaImage) -> Vec<u8> {
    img.pixels()
        .flat_map(|p| {
            let a = p[3] as u32;
            [0, 1, 2].map(|i| ((p[i] as u32 * a + 255 * (255 - a) + 127) / 255) as u8)
        })
        .collect()
}

/// Re-encode the PNG from the canvas in the format of `ext` (shared design 3.2). No metadata is written.
pub fn encode(png: &[u8], ext: &str) -> Result<Vec<u8>, String> {
    let img = image::load_from_memory_with_format(png, ImageFormat::Png)
        .map_err(fail)?
        .to_rgba8();
    let (w, h) = img.dimensions();
    let mut out = Vec::new();
    match ext.to_ascii_lowercase().as_str() {
        "jpg" | "jpeg" => JpegEncoder::new_with_quality(&mut out, 92).write_image(
            &flatten(&img),
            w,
            h,
            ExtendedColorType::Rgb8,
        ),
        "png" => PngEncoder::new(&mut out).write_image(&img, w, h, ExtendedColorType::Rgba8),
        "webp" => {
            WebPEncoder::new_lossless(&mut out).write_image(&img, w, h, ExtendedColorType::Rgba8)
        }
        "bmp" => {
            BmpEncoder::new(&mut out).write_image(&flatten(&img), w, h, ExtendedColorType::Rgb8)
        }
        other => return Err(format!("不支持的格式：{other}")),
    }
    .map_err(fail)?;
    Ok(out)
}

/// Header values are `encodeURIComponent` strings because paths can hold non-ASCII characters.
fn header(request: &Request<'_>, name: &str) -> Result<Option<PathBuf>, String> {
    let Some(value) = request.headers().get(name) else {
        return Ok(None);
    };
    let value = value.to_str().map_err(fail)?;
    if value.is_empty() {
        return Ok(None);
    }
    let decoded = percent_decode_str(value).decode_utf8().map_err(fail)?;
    Ok(Some(PathBuf::from(decoded.as_ref())))
}

/// Raw body plus `x-source` and optional `x-target` headers.
fn parse(request: &Request<'_>) -> Result<(Vec<u8>, PathBuf, Option<PathBuf>), String> {
    let InvokeBody::Raw(bytes) = request.body() else {
        return Err(fail("请求体无效"));
    };
    let source = header(request, "x-source")?.ok_or_else(|| fail("缺少源文件路径"))?;
    Ok((bytes.clone(), source, header(request, "x-target")?))
}

fn ext_of(path: &Path) -> String {
    path.extension()
        .and_then(|e| e.to_str())
        .unwrap_or_default()
        .to_string()
}

/// Export a mosaicked image. Returns the written path.
#[tauri::command]
pub async fn export_image(request: Request<'_>) -> Result<String, String> {
    let (png, source, target) = parse(&request)?;
    tauri::async_runtime::spawn_blocking(move || {
        let encoded = encode(&png, &ext_of(target.as_deref().unwrap_or(&source)))?;
        write_to(&source, target.as_deref(), &encoded).map(|p| p.to_string_lossy().into_owned())
    })
    .await
    .map_err(fail)?
}

/// Write already encoded bytes (PDF export). Returns the written path.
#[tauri::command]
pub async fn write_export(request: Request<'_>) -> Result<String, String> {
    let (bytes, source, target) = parse(&request)?;
    tauri::async_runtime::spawn_blocking(move || {
        write_to(&source, target.as_deref(), &bytes).map(|p| p.to_string_lossy().into_owned())
    })
    .await
    .map_err(fail)?
}

/// Open Explorer with the file selected.
#[tauri::command]
pub fn reveal_in_folder(path: String) -> Result<(), String> {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        std::process::Command::new("explorer")
            .raw_arg(format!("/select,\"{path}\""))
            .spawn()
            .map(|_| ())
            .map_err(|e| format!("无法打开文件夹：{e}"))
    }
    #[cfg(not(windows))]
    {
        let _ = path;
        Err("无法打开文件夹：仅支持 Windows".into())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn names_follow_the_suffix_rule() {
        let src = Path::new(r"C:\pics\a.b.JPG");
        assert_eq!(target_name(src, 1), Path::new(r"C:\pics\a.b_mosaic.JPG"));
        assert_eq!(target_name(src, 3), Path::new(r"C:\pics\a.b_mosaic_3.JPG"));
        assert_eq!(target_name(Path::new("x"), 1), Path::new("x_mosaic"));
    }

    #[test]
    fn automatic_names_number_collisions_and_keep_the_source() {
        let dir = tempfile::tempdir().unwrap();
        let src = dir.path().join("a.jpg");
        std::fs::write(&src, b"source").unwrap();
        let first = write_to(&src, None, b"one").unwrap();
        let second = write_to(&src, None, b"two").unwrap();
        assert_eq!(first, dir.path().join("a_mosaic.jpg"));
        assert_eq!(second, dir.path().join("a_mosaic_2.jpg"));
        assert_eq!(std::fs::read(&second).unwrap(), b"two");
        assert_eq!(std::fs::read(&src).unwrap(), b"source");
    }

    #[test]
    fn save_as_rejects_the_source_path() {
        let dir = tempfile::tempdir().unwrap();
        let src = dir.path().join("a.png");
        std::fs::write(&src, b"source").unwrap();
        let err = write_to(&src, Some(&dir.path().join("A.PNG")), b"x").unwrap_err();
        assert_eq!(err, "不能覆盖原文件");
        assert_eq!(std::fs::read(&src).unwrap(), b"source");
        let other = dir.path().join("b.png");
        assert_eq!(write_to(&src, Some(&other), b"x").unwrap(), other);
    }

    #[test]
    fn encodes_every_target_format_at_the_same_size() {
        let mut img = RgbaImage::new(3, 2);
        img.put_pixel(0, 0, image::Rgba([10, 20, 30, 0]));
        let mut png = Vec::new();
        PngEncoder::new(&mut png)
            .write_image(&img, 3, 2, ExtendedColorType::Rgba8)
            .unwrap();
        for ext in ["jpg", "JPEG", "png", "webp", "bmp"] {
            let out = image::load_from_memory(&encode(&png, ext).unwrap()).unwrap();
            assert_eq!((out.width(), out.height()), (3, 2), "{ext}");
        }
        // Transparent pixels become white in formats without alpha.
        let bmp = image::load_from_memory(&encode(&png, "bmp").unwrap()).unwrap().to_rgb8();
        assert_eq!(bmp.get_pixel(0, 0).0, [255, 255, 255]);
        assert_eq!(encode(&png, "gif").unwrap_err(), "不支持的格式：gif");
    }
}
