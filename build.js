const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

const config = {
    srcDir: 'src',
    outputDir: 'dist',  // Changed to dist for temporary build
    templatesDir: 'templates',
    pagesDir: 'src/pages',
    docsDir: 'docs'
};

// Ensure directory exists
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Copy a file or directory
function copyFileOrDir(src, dest) {
    if (fs.lstatSync(src).isDirectory()) {
        ensureDir(dest);
        fs.readdirSync(src).forEach(file => {
            const srcPath = path.join(src, file);
            const destPath = path.join(dest, file);
            copyFileOrDir(srcPath, destPath);
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

// Copy documentation files
function copyDocs() {
    if (fs.existsSync(config.docsDir)) {
        const docs = fs.readdirSync(config.docsDir);
        docs.forEach(doc => {
            const srcPath = path.join(config.docsDir, doc);
            const destPath = path.join(config.outputDir, doc);
            fs.copyFileSync(srcPath, destPath);
            console.log(`Copied: ${srcPath} → ${destPath}`);
        });
    }
}

// Build EJS pages
async function buildPages() {
    const pagesDir = path.join(config.srcDir, 'pages/html');
    ensureDir(config.outputDir);

    // Recursively get all .ejs files
    function getAllEjsFiles(dir) {
        const files = [];
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                files.push(...getAllEjsFiles(fullPath));
            } else if (item.endsWith('.ejs')) {
                files.push(fullPath);
            }
        }
        
        return files;
    }

    const ejsFiles = getAllEjsFiles(pagesDir);

    for (const pagePath of ejsFiles) {
        try {
            const pageContent = fs.readFileSync(pagePath, 'utf8');
            
            // Get relative path from pagesDir to maintain structure
            const relativePath = path.relative(pagesDir, pagePath);
            const pageName = path.basename(pagePath, '.ejs');
            
            // Check if the page already includes the base layout
            const includesBaseLayout = pageContent.includes('include(\'../../../templates/layouts/base');
            
            // Prepare data for the template
            const data = {
                filename: pagePath,
                title: pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-/g, ' '),
                currentPage: pageName
            };

            // Configure EJS options
            const options = {
                filename: pagePath,
                views: [
                    config.templatesDir,
                    pagesDir
                ]
            };

            let finalContent;
            if (includesBaseLayout) {
                // If the page includes the base layout, just render it directly
                finalContent = await ejs.render(pageContent, data, options);
            } else {
                // If the page doesn't include the base layout, wrap it
                const renderedContent = await ejs.render(pageContent, data, options);

                // Prepare layout data
                const layoutData = {
                    title: data.title,
                    subtitle: 'Collection of useful tools for PostHog users',
                    currentPage: data.currentPage,
                    content: renderedContent
                };

                // Render the layout
                const layoutPath = path.join(config.templatesDir, 'layouts/base.ejs');
                const layoutContent = fs.readFileSync(layoutPath, 'utf8');
                finalContent = await ejs.render(layoutContent, layoutData, {
                    filename: layoutPath,
                    views: [config.templatesDir]
                });
            }

            // Create output directory structure
            const outputDir = path.join(
                config.outputDir,
                path.dirname(relativePath)
            );
            ensureDir(outputDir);

            // Write the output
            const outputPath = path.join(
                outputDir,
                pageName + '.html'
            );
            fs.writeFileSync(outputPath, finalContent);

            console.log(`Built: ${relativePath} → ${outputPath}`);
        } catch (error) {
            console.error(`Error building ${pagePath}:`, error);
        }
    }
}

// Copy static assets
function copyStaticAssets() {
    // Copy CSS files
    copyFileOrDir('src/styles', path.join(config.outputDir, 'styles'));
    // Copy JavaScript files
    copyFileOrDir('src/scripts', path.join(config.outputDir, 'scripts'));
}

// Main build function
async function build() {
    try {
        // Clean dist directory before building
        if (fs.existsSync(config.outputDir)) {
            fs.rmSync(config.outputDir, { recursive: true });
        }

        // Ensure output directory exists
        ensureDir(config.outputDir);

        // Copy static assets first
        copyStaticAssets();

        // Copy documentation files
        copyDocs();

        // Build all pages
        await buildPages();

        // Create .nojekyll file in dist
        fs.writeFileSync(path.join(config.outputDir, '.nojekyll'), '');
        console.log('Build completed successfully!');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build(); 