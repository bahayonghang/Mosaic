# Initialize Mosaic Docs Without Inventing Architecture

## Goal

Give the empty Mosaic repository a product description that humans and coding agents can trust, and record that project coding conventions do not exist yet.

Mosaic is for quickly redacting (打码) images, including JPG and other common image formats, and PDFs. This task only initializes that statement. It does not design or build the product.

## Confirmed Facts

- The repository root contains `AGENTS.md`, `.gitignore`, `.gitattributes`, `.git/`, and Trellis scaffolding. There is no `README`, application source tree, or build manifest.
- `AGENTS.md` has a Trellis-managed block between `<!-- TRELLIS:START -->` and `<!-- TRELLIS:END -->`. Text outside that block is preserved by Trellis updates.
- `.trellis/spec/backend/` and `.trellis/spec/frontend/` are init templates. Their indexes say "To fill", and the other files say "(To be filled by the team)". Both indexes require spec documentation to be written in English.
- `.trellis/spec/guides/` already contains generic thinking guides. Nothing in this task conflicts with them.
- `ref/ImagEdit/` is present on disk and listed in `.gitignore`. It is a separate image-redaction application. It is not Mosaic source and is not a source of truth for Mosaic conventions.
- The parent folder name `Tauri` is not a stack decision recorded anywhere in this repository.
- Task status in `task.json` is already `in_progress` because `trellis init` created it that way. This session has not started the task, and no planning summary has been approved.

## Requirements

1. Add a root `README.md` that states the product purpose: quick redaction of images (including JPG and other common image formats) and PDFs. It must also state that the repository has just been initialized and has no application code yet.
2. Update `AGENTS.md` only outside the Trellis-managed block. Add the same product purpose, the same "no application code yet" fact, and the rule that agents must not assume a stack, layout, or coding convention that is not already in the repository or in `.trellis/spec/`.
3. Replace backend and frontend spec placeholders with the current fact: no application code exists, so no convention is established for that topic. Each file must tell a future agent not to infer libraries, directory layout, error handling, logging, state, types, or quality tooling.
4. Update both spec indexes so their status column no longer says the files are waiting to be filled with ideal conventions.
5. Do not add invented code examples. There is no application code to quote.

## Acceptance Criteria

- `README.md` exists at the repository root, states the image-and-PDF redaction purpose, and does not name a framework, language, directory layout, feature list, or implementation plan.
- `AGENTS.md` still contains the original Trellis-managed block unchanged, and the new project section outside that block matches the README's purpose and constraint.
- Every backend and frontend guideline file under `.trellis/spec/` states that the convention is not established. None of them names a chosen ORM, web framework, UI library, state library, validator, logger, or test runner.
- Both spec indexes mark those guidelines as not established, in English.
- No application source file, package manifest, build config, `design.md`, or architecture document is added.
- `ref/` is not copied, imported, or cited as Mosaic's architecture.

## Out of Scope

- Choosing or documenting a technical stack, including treating the `Tauri` directory name as a decision.
- Porting or following `ref/ImagEdit` features such as layers, blur, fill, face detection, or watermarks.
- Expanding the product beyond quick redaction of images and PDFs.
- Creating application code, tests, or project scaffolding.
- Customizing `.trellis/spec/guides/`.
- Committing or archiving the task during planning.

## Technical Notes

- Human-facing docs (`README.md` and the project section of `AGENTS.md`) are written in Chinese, because the product purpose was specified in Chinese.
- `.trellis/spec/` stays in English, because both spec indexes already require that.
- This is a lightweight docs task. It does not need `design.md` or `implement.md`; those files would be architecture, which the user excluded.
- `implement.jsonl` and `check.jsonl` point at `AGENTS.md` and the backend and frontend spec trees so a later implementation pass reads the files it is allowed to edit.

## Key Decisions

- Bootstrap means recording the empty repository honestly. It does not mean drafting target conventions.
- `ref/ImagEdit` stays ignored local reference material.
- Language split: Chinese for the README and `AGENTS.md` project section; English for `.trellis/spec/`.
