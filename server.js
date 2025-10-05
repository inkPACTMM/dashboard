const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('.'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        // Get section from URL params (set before multer processes the file)
        const section = req.params.section || 'general';
        const uploadDir = path.join(__dirname, 'data', 'thumbnails', section);
        console.log('Multer destination - Section from params:', section, '| Upload dir:', uploadDir);
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, uniqueSuffix + extension);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
        }
    }
});

// Ensure data directory exists
async function ensureDataDirectory() {
    const dataDir = path.join(__dirname, 'data');
    try {
        await fs.mkdir(dataDir, { recursive: true });
        await fs.mkdir(path.join(dataDir, 'thumbnails'), { recursive: true });
        await fs.mkdir(path.join(dataDir, 'thumbnails', 'blogs'), { recursive: true });
        await fs.mkdir(path.join(dataDir, 'thumbnails', 'books'), { recursive: true });
        await fs.mkdir(path.join(dataDir, 'thumbnails', 'profiles'), { recursive: true });
    } catch (error) {
        console.error('Error creating data directories:', error);
    }
}

// API Routes
app.post('/save-blogs', async (req, res) => {
    try {
        const data = req.body;
        console.log('Received blogs data:', JSON.stringify(data, null, 2));
        
        const filePath = path.join(__dirname, 'data', 'blogs.json');
        
        // Ensure the data directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        
        // Write the new data
        const jsonData = JSON.stringify(data, null, 4);
        await fs.writeFile(filePath, jsonData, 'utf8');
        
        console.log('Blogs data written to file successfully');
        console.log('File path:', filePath);
        console.log('Data size:', jsonData.length, 'bytes');
        
        // Verify the file was written
        const verification = await fs.readFile(filePath, 'utf8');
        const parsedVerification = JSON.parse(verification);
        console.log('Verification - blogs count:', parsedVerification.blogs ? parsedVerification.blogs.length : 'No blogs array');
        
        res.json({
            success: true,
            message: 'Blogs data saved successfully',
            timestamp: new Date().toISOString(),
            blogsCount: data.blogs ? data.blogs.length : 0,
            filePath: filePath
        });
    } catch (error) {
        console.error('Error saving blogs:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: error.stack
        });
    }
});

app.post('/save-books', async (req, res) => {
    try {
        const data = req.body;
        const filePath = path.join(__dirname, 'data', 'books.json');
        
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        
        res.json({
            success: true,
            message: 'Books data saved successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error saving books:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.post('/save-profiles', async (req, res) => {
    try {
        const data = req.body;
        const filePath = path.join(__dirname, 'data', 'profiles.json');
        
        console.log('Received profiles data for saving:', JSON.stringify(data, null, 2));
        
        // Validate JSON structure before saving
        if (!data || !data.profiles || !Array.isArray(data.profiles)) {
            console.error('Invalid data structure received:', data);
            throw new Error('Invalid profiles data structure. Expected {profiles: [...]}');
        }
        
        // Ensure clean data structure (only profiles array)
        const cleanData = {
            profiles: data.profiles.map(profile => ({
                id: profile.id,
                name: profile.name,
                role: profile.role,
                term: profile.term,
                bio: profile.bio,
                avatar: profile.avatar
            }))
        };
        
        // Convert to JSON string and validate it can be parsed back
        const jsonString = JSON.stringify(cleanData, null, 2);
        const validated = JSON.parse(jsonString); // This will throw if JSON is invalid
        
        console.log('Writing clean profiles data:', jsonString);
        
        await fs.writeFile(filePath, jsonString, 'utf8');
        
        // Verify what was written
        const verification = await fs.readFile(filePath, 'utf8');
        console.log('Verification - file content length:', verification.length);
        
        res.json({
            success: true,
            message: 'Profiles data saved successfully',
            timestamp: new Date().toISOString(),
            profilesCount: cleanData.profiles.length
        });
    } catch (error) {
        console.error('Error saving profiles:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.post('/save-markdown', async (req, res) => {
    try {
        const { filename, content } = req.body;
        
        if (!filename || content === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Filename and content are required'
            });
        }

        // Security: validate filename and path
        const normalizedPath = path.normalize(filename).replace(/^(\.\.\/)+/, '');
        const basename = path.basename(normalizedPath);
        
        if (!/^[a-zA-Z0-9_-]+\.md$/.test(basename)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid filename format. Only alphanumeric characters, hyphens, and underscores are allowed.'
            });
        }

        // Support both data/blogs/file.md and data/file.md paths
        let filePath;
        if (normalizedPath.includes('blogs/')) {
            const blogsDir = path.join(__dirname, 'data', 'blogs');
            await fs.mkdir(blogsDir, { recursive: true });
            filePath = path.join(blogsDir, basename);
        } else {
            filePath = path.join(__dirname, 'data', basename);
        }
        
        await fs.writeFile(filePath, content, 'utf8');
        
        res.json({
            success: true,
            message: 'Markdown file saved successfully',
            filename: basename,
            filePath: filePath,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error saving markdown:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.get('/get-markdown/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const basename = path.basename(filename);
        
        if (!/^[a-zA-Z0-9_-]+\.md$/.test(basename)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid filename format.'
            });
        }

        // Try to find the file in multiple locations
        const possiblePaths = [
            path.join(__dirname, 'data', 'blogs', basename),
            path.join(__dirname, 'data', basename)
        ];

        for (const filePath of possiblePaths) {
            try {
                const content = await fs.readFile(filePath, 'utf8');
                return res.json({
                    success: true,
                    content: content,
                    filename: basename,
                    path: filePath
                });
            } catch (error) {
                continue; // Try next path
            }
        }

        // File not found in any location
        res.status(404).json({
            success: false,
            message: 'Markdown file not found'
        });
    } catch (error) {
        console.error('Error loading markdown:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.post('/upload-image/:section', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image uploaded'
            });
        }

        const section = req.params.section || 'general';
        console.log('Upload request - Section:', section, '| Params:', req.params, '| File:', req.file.filename, '| Actual path:', req.file.path);
        
        const relativePath = path.join('data', 'thumbnails', section, req.file.filename);
        
        res.json({
            success: true,
            message: 'Image uploaded successfully',
            filename: req.file.filename,
            path: relativePath,
            section: section, // Return the section so client can verify
            size: req.file.size,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get list of images for a section
app.get('/images/:section', async (req, res) => {
    try {
        const section = req.params.section;
        const imagesDir = path.join(__dirname, 'data', 'thumbnails', section);
        
        try {
            const files = await fs.readdir(imagesDir);
            const imageFiles = files.filter(file => 
                /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
            );
            
            res.json({
                success: true,
                images: imageFiles,
                count: imageFiles.length
            });
        } catch (error) {
            // Directory doesn't exist or is empty
            res.json({
                success: true,
                images: [],
                count: 0
            });
        }
    } catch (error) {
        console.error('Error listing images:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Delete an image
app.delete('/delete-image/:section/:filename', async (req, res) => {
    try {
        const { section, filename } = req.params;
        
        // Security: validate filename
        if (!/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif|webp)$/i.test(filename)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid filename'
            });
        }
        
        const filePath = path.join(__dirname, 'data', 'thumbnails', section, filename);
        await fs.unlink(filePath);
        
        res.json({
            success: true,
            message: 'Image deleted successfully',
            filename: filename
        });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'InkPact Dashboard Server is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 10MB'
            });
        }
    }
    
    res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
    });
});

// Add a debug endpoint to check current data
app.get('/debug/blogs', async (req, res) => {
    try {
        const filePath = path.join(__dirname, 'data', 'blogs.json');
        const data = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(data);
        
        res.json({
            success: true,
            filePath: filePath,
            blogsCount: parsed.blogs ? parsed.blogs.length : 0,
            data: parsed
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Start server
async function startServer() {
    await ensureDataDirectory();
    
    app.listen(PORT, () => {
        console.log(`
╔══════════════════════════════════════════════╗
║           InkPact Dashboard Server           ║
║                                              ║
║  Server running at: http://localhost:${PORT}   ║
║  Dashboard URL: http://localhost:${PORT}/index.html ║
║                                              ║
║  Press Ctrl+C to stop the server            ║
╚══════════════════════════════════════════════╝
        `);
    });
}

startServer().catch(console.error);
