# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**jnu-doc** is a TypeScript library for document management (YAML, CSV, INI, HTML, Markdown, captions/subtitles). It's published as an npm package with dual module support (CommonJS and ESM).

## Build System

This project uses **SWC** for transpilation with dual output:

- **CJS Build**: `./cjs/` (CommonJS, minified) - configured via `cjs/.swcrc`
- **ESM Build**: `./esm/` (ES modules, minified) - configured via `esm/.swcrc`
- **Types**: `./types/` (TypeScript declarations) - generated via `tsc`

Build commands:
```bash
# Full build (types + cjs + esm)
npm run build

# Individual builds
npm run build:types
npm run build:cjs
npm run build:esm

# Watch mode (cjs + esm)
npm run build:watch
```

Clean build artifacts:
```bash
# macOS/Linux
npm run clean:mac

# Windows
npm run clean:win
```

## Testing

Uses Jest with ts-jest preset. Three test configurations:

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:e2e          # End-to-end tests

# Development
npm run test:watch        # Watch mode
npm run test:coverage     # Generate coverage report
```

## Publishing

Use the `publish.sh` script (comprehensive with pre-flight checks):

```bash
# Basic usage (patch version, auto-commit enabled by default)
./publish.sh

# Specify version type
./publish.sh minor
./publish.sh major

# With custom commit message
./publish.sh -m "feat: add new feature"

# Additional options
./publish.sh --dry-run        # Preview without executing
./publish.sh --skip-tests     # Skip test execution
./publish.sh --force          # Force publish with warnings
./publish.sh --auto-commit    # Auto-commit uncommitted changes
```

The publish script performs:
1. Git repository and configuration checks
2. NPM authentication verification
3. Pull latest changes
4. Run tests (unless skipped)
5. Build project
6. Commit build artifacts
7. Bump version
8. Push to git with tags
9. Publish to npm

## Code Architecture

### Module Structure

All source code is in `src/`. The `src/index.ts` file serves as the main export point, re-exporting functions from specialized modules:

- **csv.ts**: CSV file operations (`loadCsv`, `saveCsv`)
- **yaml.ts**: YAML file operations (`loadYaml`, `saveYaml`)
- **ini.ts**: INI file operations (`loadIni`, `saveIni`)
- **caption.ts**: Subtitle/caption format conversions (SRT, VTT, TSV, TXT)
- **html.ts**: HTML encoding/decoding, escape utilities
- **markdn.ts**: Markdown parsing utilities (`mdTitle`, `mdContent`, `mdFrontmatter`)
- **cheer.ts**: Cheerio wrapper class for HTML parsing and manipulation
- **types.ts**: Centralized type definitions

### Key Classes

**Cheer Class** (`cheer.ts`):
A wrapper around cheerio for simplified HTML/XML parsing and manipulation. Main methods:
- `value(selector, attribute?)`: Extract single value
- `values(selector, attribute?)`: Extract multiple values
- `json(settings)`: Extract structured data as object
- `jsons($elements, settings)`: Extract array of objects from elements
- `find(selector)`: Find elements
- `del(selector)`: Remove elements
- `retag(selector, newTag)`: Change element tag names

### Dependencies

Core document processing libraries:
- **cheerio**: HTML/XML parsing (used by Cheer class)
- **js-yaml**: YAML parsing
- **ini**: INI file parsing
- **csv-parse**, **csv-stringify**: CSV operations
- **node-xlsx**: Excel file operations
- **turndown**: HTML to Markdown conversion
- **jnu-abc**: Base utility library (internal dependency)

## Code Style Guidelines

### TypeScript Conventions

- **Code organization**: Use AREA comments to organize code sections:
  ```typescript
  // & IMPORT AREA
  import statements...

  // & FUNCTIONS AREA
  function declarations...

  // & EXPORT AREA
  export { func1, func2 };
  ```

- **Exports**: Export functions collectively at file bottom, not individually:
  ```typescript
  // Good
  export { loadCsv, saveCsv };

  // Avoid
  export const loadCsv = ...
  ```

- **Functions**: Use arrow functions
- **Types**: Centralize all type definitions in `src/types.ts`
- **Type strictness**: `any` type is allowed (noImplicitAny: false)

### Naming Conventions

- **Functions/variables**: camelCase
- **Constants**: UPPER_CASE
- **Files**: kebab-case

### Documentation

- Add JSDoc comments for all functions
- Include usage examples in comments where helpful

## Project Structure

Key directories:
- `src/`: TypeScript source code
- `cjs/`, `esm/`, `types/`: Build output directories (git-tracked for npm distribution)
- `tests/`: Test files
- `docs/`: Project documentation
  - `docs/dev/`: Development documentation (Korean)
  - `docs/client/`: User documentation
  - `docs/reference/`: Reference materials
- `_backups/`: Backup files
- `_drafts/`: Draft code
- `_playground/`: Experimental code
