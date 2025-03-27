const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

const config = {
    srcDir: './src/pages/html',
    outputDir: './public',
    templatesDir: './templates'
};

async function buildPages() {
    if (!fs.existsSync(config.outputDir)) {
        fs.mkdirSync(config.outputDir, { recursive: true });
    }

    const pages = fs.readdirSync(config.srcDir)
        .filter(file => file.endsWith('.ejs'));

    for (const page of pages) {
        try {
            const data = {
                title: 'Default Title',
                currentPage: page.replace('.ejs', ''),
            };

            const content = await ejs.renderFile(
                path.join(config.srcDir, page),
                data,
                { views: [config.templatesDir] }
            );

            const outputPath = path.join(
                config.outputDir,
                page.replace('.ejs', '.html')
            );
            fs.writeFileSync(outputPath, content);

            console.log(`Built: ${page} → ${outputPath}`);
        } catch (error) {
            console.error(`Error building ${page}:`, error);
        }
    }
}

buildPages().catch(console.error);