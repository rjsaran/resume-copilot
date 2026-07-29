# Contributing

Thanks for considering a contribution to Resume Copilot.

## Getting set up

Follow the [Getting started](./README.md#getting-started) section of the README to get a local instance running against your own database and Supabase project.

## Making changes

1. Fork the repo and create a branch off `main` for your change.
2. Keep changes focused — a bug fix or feature per PR is easier to review than several bundled together.
3. Run the linter before opening a PR:

   ```bash
   npm run lint
   ```

4. Make sure `npm run build` succeeds.
5. Never commit `.env*` files, real API keys, or personal resume/career data. `.env.example` documents every variable the app needs — update it if you add a new one.

## Submitting a pull request

- Describe what the change does and why in the PR description.
- Link any related issue.
- Keep commit messages descriptive of the *why*, not just the *what*.

## Reporting bugs / requesting features

Please open a [GitHub issue](https://github.com/rjsaran/resume-copilot/issues) with as much detail as you can — steps to reproduce, expected vs. actual behavior, and screenshots where helpful.
