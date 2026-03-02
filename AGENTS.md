# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains TypeScript modules grouped by document format (`csv.ts`, `yaml.ts`, `caption.ts`) and re-exported through `src/index.ts`.
- `tests/` hosts Jest suites; re-use the helpers inside `tests/utils/*.setup.ts` and add specs under `tests/unit`, `tests/integration`, or `tests/e2e` as needed.
- Compiled artifacts land in `cjs/`, `esm/`, and `types/`; never edit these outputs directly—regenerate them via the build pipeline.
- `docs/`, `_drafts/`, and `_playground/` hold supporting material and experiments; keep production logic in `src/`.

## Build, Test, and Development Commands
- `npm run build` runs the SWC pipelines plus declaration generation, refreshing `cjs/`, `esm/`, and `types/`.
- `npm run build:watch` keeps the CommonJS and ESM bundles in sync while you iterate.
- `npm run test`, `npm run test:unit|integration|e2e`, and `npm run test:coverage` execute Jest suites; commit with passing coverage reports.
- `npm run clean:mac` or `npm run clean:win` wipes generated bundles when a clean slate is needed.

## Coding Style & Naming Conventions
- Stick to TypeScript with ES modules (`type: module`); prefer named exports that shadow their file names.
- Maintain the existing two-space indentation, arrow functions for small utilities, and early returns for validation branches.
- File names should describe the document capability (`html.ts`, `markdn.ts`); colocate helpers with the format they support.
- Run `npm run build` before pushing so declaration files and SWC output remain aligned.

## Testing Guidelines
- Jest with `ts-jest` is standard; tests resolve `*.test.ts` or `*.spec.ts` under `src/` or `tests/`.
- Use the suite-specific folders (`tests/unit`, `tests/integration`, `tests/e2e`) and leverage the setup files in `tests/utils/` for shared fixtures.
- Keep coverage high on parsers and converters; rely on `npm run test:coverage` to review summaries and update snapshots when behavior changes intentionally.

## Commit & Pull Request Guidelines
- Prefer Conventional Commit prefixes (`feat`, `fix`, `chore`) even though legacy commits include bare summaries like `cheer.ts`.
- Scope messages to the touched module (`feat(csv): add quoting options`) and avoid bundling unrelated changes.
- Pull requests should call out affected document formats, note any new dependencies, and include the latest `npm run test` or `npm run build` output.
- When preparing a release, record whether `publish.sh`/`publish.bat` ran and document version bumps in the PR description.
