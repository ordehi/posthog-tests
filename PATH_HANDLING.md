# Path Handling in PostHog Tests

This document outlines how to properly handle paths in the PostHog Tests project to ensure compatibility with both local development and GitHub Pages deployment.

## The Problem

When deploying to GitHub Pages, the repository is hosted at a subpath (e.g., `https://username.github.io/posthog-tests/`) rather than at the root domain. This means that absolute paths (starting with `/`) won't work correctly in the GitHub Pages environment.

## Solution: Using `basePath`

The project uses a `basePath` variable in EJS templates to handle this situation. This variable is calculated in the base layout template (`templates/layouts/base.ejs`) and passed to all components.

### How `basePath` Works

1. The base template determines if a page is in a nested path (e.g., `/surveys/custom-surveys`)
2. If it's nested, `basePath` is set to `../` to navigate up one level
3. If it's not nested, `basePath` is set to `./` for the current directory

### Using `basePath` for Resources

When referencing scripts, stylesheets, or other resources, always use the `basePath` variable:

```ejs
<!-- CORRECT: Using basePath -->
<script src="<%= basePath %>scripts/your-script.js"></script>
<link rel="stylesheet" href="<%= basePath %>styles/your-style.css">

<!-- INCORRECT: Absolute paths won't work on GitHub Pages -->
<script src="/scripts/your-script.js"></script>
<link rel="stylesheet" href="/styles/your-style.css">
```

### Automatic Script Path Transformation (New Feature)

As of the latest update, the base layout template now automatically transforms absolute script paths in your content to use relative paths with `basePath`. This means that:

```html
<script src="/scripts/your-script.js"></script>
```

Will be automatically transformed to:

```html
<script src="../scripts/your-script.js"></script>  <!-- For nested pages -->
<!-- or -->
<script src="./scripts/your-script.js"></script>   <!-- For top-level pages -->
```

This transformation happens at build time and helps prevent 404 errors on GitHub Pages.

> **Note**: While this automatic transformation exists, it's still best practice to use `<%= basePath %>` explicitly for clarity and consistency.

## Adding New Pages

When adding a new page, follow these steps to ensure paths work correctly:

1. **For top-level pages** (e.g., `/page.html`):
   - Use `<%= basePath %>` with resource paths
   - The `isNested` flag is not needed

2. **For nested pages** (e.g., `/category/page.html`):
   - Use `<%= basePath %>` with resource paths
   - Set `isNested: true` in the template include parameters

Example for a nested page:

```ejs
<% const content = `
<!-- Your page content here -->
<script src="<%= basePath %>scripts/your-script.js"></script>
` %>

<%- include('../../../templates/layouts/base', {
    title: 'Your Page Title',
    subtitle: 'Your page subtitle',
    currentPage: 'your-page-id',
    isNested: true,  // Important for nested pages!
    content: content
}) %>
```

## Testing Paths

When developing locally, test that both of these work:
1. Accessing via root path: `http://localhost:3000/your-page`
2. Accessing via nested path: `http://localhost:3000/posthog-tests/your-page` (simulates GitHub Pages)

## Common Issues

1. **404 errors for resources**: Usually indicates paths aren't using `basePath` correctly
2. **Links not working**: Make sure navigation links also use `basePath`
3. **Images not showing**: Use `basePath` for image sources

Always check the browser console for 404 errors after adding new resources or pages. 