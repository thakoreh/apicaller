# apicaller

Build curl and JavaScript fetch requests from an API URL in your browser.

**[Try the live builder](https://thakoreh.github.io/apicaller/)**

Paste an endpoint, choose an HTTP method, edit headers and the request body, then copy the generated code. You can also save requests locally and compare two endpoint configurations.

## Run locally

Use Node.js 20 or newer, matching the repository's CI baseline.

```bash
git clone https://github.com/thakoreh/apicaller.git
cd apicaller
npm ci
npm run dev
```

Open [http://localhost:3000/apicaller](http://localhost:3000/apicaller) (the configured base path).

## Try it

1. Enter `https://api.github.com/repos/thakoreh/apicaller`.
2. Choose `GET`.
3. Remove the placeholder `Authorization` header and any headers you do not need.
4. Select curl or fetch output, then copy the generated code.
5. Review the code and run it in your own terminal or application.

The builder generates request code; it does not discover an API's schema, infer required authentication, or execute the generated request for you.

## Features

- HTTP methods, editable headers, and request bodies.
- curl and JavaScript fetch output.
- JSON body formatting.
- Request presets and recent URL history.
- Named request collections stored in your browser.
- Share links that restore request configuration.
- A [comparison page](src/app/compare/page.tsx) for two URLs, methods, and header configurations.
- Light and dark themes; Ctrl/Cmd+K to focus the URL field.

## Request data and share links

URL history and saved collections use browser localStorage. Collections include request URLs, headers, and bodies.

Share links encode the request configuration in the URL fragment using Base64. **Encoding is not encryption:** anyone with the link can read the included values. Use placeholders instead of real tokens, passwords, private endpoints, or personal data when sharing or saving examples.

Generated curl commands use POSIX shell quoting. Windows users should review shell syntax before running them, for example in Git Bash or WSL. Review all generated code before using it.

## Development

```bash
npm run lint
npm run build
```

Built with Next.js, React, TypeScript, and Tailwind CSS. The project is configured for static export; GitHub Actions builds and deploys the `out/` directory to GitHub Pages.

| File | Purpose |
| --- | --- |
| [src/app/page.tsx](src/app/page.tsx) | Request builder, presets, local storage, and sharing |
| [src/lib/url.ts](src/lib/url.ts) | URL parsing and curl/fetch generation |
| [src/app/compare/page.tsx](src/app/compare/page.tsx) | Side-by-side request configuration comparison |

## Feedback and contributions

Found a request that generates incorrect code? [Open an issue](https://github.com/thakoreh/apicaller/issues) with a minimal example URL, method, placeholder headers/body, expected output, actual output, and browser/shell details. Remove all credentials and private information.

For a contribution, keep the change focused and include a before/after example plus the checks you ran. Quoting edge cases, documentation examples, and accessibility improvements are useful starting points.

Built by [Hiren Thakore](https://github.com/thakoreh). Follow for more developer tools and practical AI engineering.
