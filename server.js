const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
const fs = require('fs');

// Serve static files from the docs directory
app.use(express.static('docs'));

// Handle all routes
app.get('*', (req, res) => {
    // Remove query parameters and hash
    const cleanPath = req.path.split('?')[0].split('#')[0];
    
    // If the path ends with /, try index.html in that directory
    const filePath = cleanPath.endsWith('/') 
        ? path.join('docs', cleanPath, 'index.html')
        : path.join('docs', cleanPath + '.html');

    // Check if the file exists
    if (fs.existsSync(filePath)) {
        res.sendFile(path.resolve(filePath));
    } else {
        // If not found, try serving the file directly from docs
        const directPath = path.join('docs', cleanPath);
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