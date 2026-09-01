# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-09-01

### Added

- 48 generated Starship theme files (4 flavors × 6 variants × 2 kinds: colors-only palette and custom prompt layout)
- Build tooling (`build.mjs`) to generate themes from `@vivid-life-theme/design-system` tokens
- README with installation instructions

### Changed

- Moved `$time` into the upper status line in the custom prompt layout
- Raised `command_timeout` to 1000ms in generated themes
- Differentiated `git_status` colors by state to match VS Code semantics
- Bumped `@vivid-life-theme/design-system` dependency to 0.7.0

### Fixed

- Fixed TOML scope of the palette selector
- Fixed `[palettes.*]` table ordering so `$fill` works on Starship 1.26.0
- Fixed invalid TOML escaping for the git_status stashed indicator
