# InkPact Dashboard

A content management dashboard for the InkPact platform built with Node.js and Express.

## Quick Start

1. **Install Node.js** (version 14 or higher) from https://nodejs.org
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the server:**
   ```bash
   npm start
   ```
4. **Open dashboard:** http://localhost:3000/dashboard.html

## Features

- ✅ **Blog Management** - Create, edit, and delete blog posts
- ✅ **Markdown Editor** - Built-in editor for blog content
- ✅ **Image Upload** - Upload and manage thumbnails
- ✅ **Book Management** - Manage book catalog
- ✅ **Profile Management** - User profile administration
- ✅ **Real-time Saving** - Changes saved directly to JSON files
- ✅ **Backup System** - Automatic backups before saving
- ✅ **Responsive Design** - Works on desktop and mobile

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/save-blogs` | Save blog data |
| POST | `/save-books` | Save book data |
| POST | `/save-profiles` | Save profile data |
| POST | `/save-markdown` | Save markdown content |
| POST | `/upload-image` | Upload image files |
| GET | `/images/:section` | List images by section |
| DELETE | `/delete-image/:section/:filename` | Delete an image |
| GET | `/health` | Server health check |

## File Structure

```
dashboard3/
├── server.js              # Node.js Express server
├── dashboard.html          # Main dashboard interface
├── dashboard.js           # Frontend JavaScript
├── index.css              # Styling
├── package.json           # Node.js dependencies
├── data/
│   ├── blogs.json         # Blog data (your actual data)
│   ├── books.json         # Book data
│   ├── profiles.json      # Profile data
│   ├── *.md              # Markdown content files
│   └── thumbnails/        # Uploaded images
│       ├── blogs/         # Blog thumbnails
│       ├── books/         # Book covers
│       └── profiles/      # Profile avatars
└── README.md              # This file
```

## Development

For development with auto-restart:
```bash
npm run dev
```

## Data Management

The dashboard works with your existing blog data structure:
- **Blog ID**: Unique identifier for each blog post
- **Multilingual Support**: Handles Myanmar Unicode text
- **Categories**: Tag-based organization
- **Writers & Designers**: Multiple contributors per post
- **Image Paths**: Automatic path management for thumbnails

## Backup System

- Automatic backups created before each save
- Backup files saved with timestamps
- Located in the same directory as original files

## Security Features

- File type validation for uploads
- Filename sanitization
- Path traversal protection
- File size limits (10MB for images)

## Troubleshooting

**Port already in use:**
```bash
# Change port in server.js or set environment variable
PORT=3001 npm start
```

**Permission errors:**
```bash
# Make sure you have write permissions to the dashboard3 directory
chmod -R 755 dashboard3/
```

**Module not found:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Support

For issues or questions, check the console output for detailed error messages. The server provides comprehensive logging for debugging.
# dashboard
