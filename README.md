# PostHog Tools Hub

A collection of useful tools for PostHog users, including a flag debugger, SQL client, and survey selector tester.

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/posthog-tests.git
   cd posthog-tests
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Project Structure

```
posthog-tests/
├── src/
│   ├── pages/          # EJS page templates
│   │   └── html/       # HTML pages
│   ├── styles/         # CSS styles
│   └── scripts/        # JavaScript files
├── templates/
│   ├── layouts/        # Base layout templates
│   └── partials/       # Reusable partial templates
├── docs/               # Built static site (generated)
│   └── PATH_HANDLING.md # Documentation for path handling
├── build.js            # Build script
├── server.js           # Development server
└── package.json        # Project configuration
```

## Development

### Running the Development Server

1. Start the development server:
   ```bash
   npm run serve
   ```

2. Visit `http://localhost:3000` in your browser

The server will automatically serve files from the `docs` directory and handle all routes correctly.

### Building the Site

1. Build the site:
   ```bash
   npm run build
   ```

This will:
- Clean the `docs` directory
- Build all EJS templates to HTML
- Copy static assets (CSS, JavaScript)
- Output everything to the `docs` directory

### Adding New Pages

1. Create a new `.ejs` file in `src/pages/html/` or a subdirectory
2. Use the base layout by including it at the bottom of your template:
   ```ejs
   <%
   const content = `
     <!-- Your page content here -->
   `;
   %>

   <%- include('../../../templates/layouts/base', {
       title: 'Your Page Title',
       subtitle: 'Your Page Subtitle',
       currentPage: 'your-page-name',
       content: content
   }) %>
   ```

3. Rebuild the site:
   ```bash
   npm run build
   ```

### Important: Path Handling

This project uses a special path handling mechanism for GitHub Pages compatibility. For details, see:
- [Path Handling Documentation](docs/PATH_HANDLING.md)

**TL;DR:**
- Always use `<%= basePath %>` for resource paths in templates
- For nested pages, set `isNested: true` in the template parameters
- Never use absolute paths starting with `/` for resources

### Directory Structure for URLs

The build system preserves the directory structure from `src/pages/html/` in the output URLs:

- `src/pages/html/index.ejs` → `http://localhost:3000/`
- `src/pages/html/surveys/example.ejs` → `http://localhost:3000/surveys/example`
- `src/pages/html/tools/flag-debugger.ejs` → `http://localhost:3000/tools/flag-debugger`

## Deployment

This site is configured to be deployed to GitHub Pages. The `docs` directory contains the built static site that will be served.

### GitHub Pages Setup

1. Go to your repository's Settings > Pages
2. Under "Source", select "Deploy from a branch"
3. Select the `gh-pages` branch and `/ (root)` folder
4. Click "Save"

The site will be available at `https://[your-username].github.io/[repository-name]`

### Automated Deployment

A GitHub Action is configured to automatically build and deploy the site when you push to the main branch. No additional setup is required.

## Available Tools

- **Flag Debugger**: Test and debug PostHog feature flags
- **SQL Client**: Run SQL queries against your PostHog instance
- **Survey Selector**: Test survey targeting with CSS selectors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this code for your own projects.