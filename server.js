const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
const fs = require('fs');

// Serve static files from the dist directory
app.use(express.static('dist'));

// Serve files from node_modules for browser imports
app.use('/node_modules', express.static('node_modules'));

// Handle all routes
app.get('*', (req, res) => {
    // Remove query parameters and hash
    const cleanPath = req.path.split('?')[0].split('#')[0];
    
    // If the path ends with /, try index.html in that directory
    const filePath = cleanPath.endsWith('/') 
        ? path.join('dist', cleanPath, 'index.html')
        : path.join('dist', cleanPath + '.html');

    // Check if the file exists
    if (fs.existsSync(filePath)) {
        res.sendFile(path.resolve(filePath));
    } else {
        // If not found, try serving the file directly from dist
        const directPath = path.join('dist', cleanPath);
        if (fs.existsSync(directPath)) {
            res.sendFile(path.resolve(directPath));
        } else {
            res.status(404).send('Not Found');
        }
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 