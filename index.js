class Dashboard {
    constructor() {
        this.currentSection = 'blogs';
        this.currentData = null;
        this.editingItem = null;
        this.selectedImage = null;
        this.currentImageField = null;
        this.currentImageCategory = 'blogs';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSection('blogs');
    }

    bindEvents() {
        // Sidebar navigation
        document.querySelectorAll('.nav-link[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('.nav-link').dataset.section;
                this.switchSection(section);
            });
        });

        // Save changes button (in modal)
        const saveBtn = document.getElementById('saveChanges');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveItem();
            });
        }
    }

    switchSection(section) {
        // Update active nav
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
        
        this.currentSection = section;
        this.loadSection(section);
    }

    async loadSection(section) {
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin fa-2x text-primary"></i></div>';
        
        try {
            switch(section) {
                case 'blogs':
                    await this.loadBlogs();
                    break;
                case 'books':
                    await this.loadBooks();
                    break;
                case 'profiles':
                    await this.loadProfiles();
                    break;
                case 'images':
                    this.loadImages();
                    break;
            }
        } catch (error) {
            contentArea.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error loading ${section}: ${error.message}
                    <div class="mt-2">
                        <small>Make sure the ${section}.json file exists and is properly formatted.</small>
                    </div>
                </div>
            `;
        }
    }

    async loadBlogs() {
        try {
            // Add cache-busting parameter to force fresh data
            const response = await fetch(`data/blogs.json?t=${Date.now()}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            
            console.log('Loaded blogs data:', data);
            
            // Handle the actual JSON structure - blogs are nested under "blogs" key
            const blogs = data.blogs || data;
            
            // Validate that blogs is an array
            if (!Array.isArray(blogs)) {
                throw new Error('blogs.json should contain an array of blog objects');
            }
            
            this.currentData = blogs;
            console.log('Current data set to:', this.currentData);

            // Pre-generate placeholder images
            const blogPlaceholder = this.createPlaceholderImage('Blog', 50, 35);

            const contentArea = document.getElementById('content-area');
            contentArea.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h3><i class="fas fa-blog me-2 text-primary"></i>Blog Management</h3>
                    <button class="btn btn-primary" onclick="dashboard.createNew('blog')">
                        <i class="fas fa-plus me-2"></i>New Blog
                    </button>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover data-table">
                        <thead>
                            <tr>
                                <th>Preview</th>
                                <th>Title</th>
                                <th>Writer(s)</th>
                                <th>Date</th>
                                <th>Categories</th>
                                <th>Read Time</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${blogs.length === 0 ? 
                                '<tr><td colspan="7" class="text-center py-4"><em>No blogs found. Click "New Blog" to create one.</em></td></tr>' :
                                blogs.map((blog, index) => {
                                    // Handle different blog data structures - support both old and new formats
                                    const title = blog.blogName || blog.title || 'Untitled';
                                    const writers = blog.writers ? 
                                        (Array.isArray(blog.writers) ? blog.writers.join(', ') : blog.writers) :
                                        (blog.writer || 'Unknown');
                                    const thumbnail = blog.image || blog.thumbnail || blogPlaceholder;
                                    const contentFile = blog.mdPath || blog.contentFile || 'untitled.md';
                                    const categories = blog.categories || [];
                                    const readTime = blog.readTime || 'N/A';
                                    const date = blog.date ? new Date(blog.date).toLocaleDateString() : 'No date';
                                    
                                    return `
                                        <tr>
                                            <td>
                                                <img src="${thumbnail}" alt="Blog thumbnail" 
                                                     style="width: 50px; height: 35px; object-fit: cover; border-radius: 4px;"
                                                     onerror="this.src='${blogPlaceholder}'">
                                            </td>
                                            <td><strong>${title}</strong></td>
                                            <td>${writers}</td>
                                            <td>${date}</td>
                                            <td>
                                                ${Array.isArray(categories) ? categories.map(cat => `<span class="badge bg-primary me-1">${cat}</span>`).join('') : ''}
                                            </td>
                                            <td><small class="text-muted">${readTime}</small></td>
                                            <td>
                                                <button class="btn btn-outline-primary btn-action" onclick="dashboard.editItem(${index}, 'blog')" title="Edit Blog">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-outline-info btn-action" onclick="dashboard.editMarkdown('${contentFile}')" title="Edit Content">
                                                    <i class="fas fa-file-alt"></i>
                                                </button>
                                                <button class="btn btn-outline-danger btn-action" onclick="dashboard.deleteItem(${index}, 'blog')" title="Delete Blog">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')
                            }
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            // If file doesn't exist, create empty data and show creation option
            console.error('Error loading blogs:', error);
            this.currentData = [];
            const contentArea = document.getElementById('content-area');
            contentArea.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h3><i class="fas fa-blog me-2 text-primary"></i>Blog Management</h3>
                    <button class="btn btn-primary" onclick="dashboard.createNew('blog')">
                        <i class="fas fa-plus me-2"></i>New Blog
                    </button>
                </div>
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Error loading blogs data:</strong> ${error.message}
                    <br><small>Please check the console for more details. You can still create new blogs.</small>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover data-table">
                        <thead>
                            <tr>
                                <th>Preview</th>
                                <th>Title</th>
                                <th>Writer(s)</th>
                                <th>Date</th>
                                <th>Categories</th>
                                <th>Read Time</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td colspan="7" class="text-center py-4"><em>No blogs found. Click "New Blog" to create one.</em></td></tr>
                        </tbody>
                    </table>
                </div>
            `;
        }
    }

    async loadBooks() {
        try {
            // Add cache-busting parameter to force fresh data
            const response = await fetch(`data/books.json?t=${Date.now()}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            
            // Handle both array and object structures
            const books = data.books || data;
            
            // Validate that books is an array
            if (!Array.isArray(books)) {
                throw new Error('books.json should contain an array of book objects');
            }
            
            this.currentData = books;

            // Pre-generate placeholder images
            const bookPlaceholder = this.createPlaceholderImage('Book', 40, 50);

            const contentArea = document.getElementById('content-area');
            contentArea.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h3><i class="fas fa-book me-2 text-primary"></i>Book Management</h3>
                    <button class="btn btn-primary" onclick="dashboard.createNew('book')">
                        <i class="fas fa-plus me-2"></i>New Book
                    </button>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover data-table">
                        <thead>
                            <tr>
                                <th>Cover</th>
                                <th>Title</th>
                                <th>Author</th>
                                <th>Type/Genre</th>
                                <th>Details</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${books.length === 0 ? 
                                '<tr><td colspan="6" class="text-center py-4"><em>No books found. Click "New Book" to create one.</em></td></tr>' :
                                books.map((book, index) => {
                                    // Handle different book formats - support both PDF and regular books
                                    const thumbnail = book.thumbnail || book.cover || bookPlaceholder;
                                    const typeInfo = book.pdfUrl ? 
                                        `<span class="badge bg-success">PDF</span><br><small>${book.size || 'N/A'}</small>` :
                                        `<span class="badge bg-info">${book.genre || 'Book'}</span><br><small>${book.pages || 'N/A'} pages</small>`;
                                    const date = book.date ? new Date(book.date).toLocaleDateString() : '';
                                    
                                    return `
                                        <tr>
                                            <td>
                                                <img src="${thumbnail}" alt="Book cover" 
                                                     style="width: 40px; height: 50px; object-fit: cover; border-radius: 4px;"
                                                     onerror="this.src='${bookPlaceholder}'">
                                            </td>
                                            <td><strong>${book.title || 'Untitled'}</strong></td>
                                            <td>${book.author || 'Unknown'}</td>
                                            <td>${typeInfo}</td>
                                            <td>
                                                ${date && `<small class="text-muted">${date}</small><br>`}
                                                ${book.pdfUrl ? 
                                                    `<a href="${book.pdfUrl}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="fas fa-download"></i> Download</a>` :
                                                    `<small class="text-muted">Regular Book</small>`
                                                }
                                            </td>
                                            <td>
                                                <button class="btn btn-outline-primary btn-action" onclick="dashboard.editItem(${index}, 'book')" title="Edit Book">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-outline-danger btn-action" onclick="dashboard.deleteItem(${index}, 'book')" title="Delete Book">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')
                            }
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            // If file doesn't exist, create empty data and show creation option
            this.currentData = [];
            const contentArea = document.getElementById('content-area');
            contentArea.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h3><i class="fas fa-book me-2 text-primary"></i>Book Management</h3>
                    <button class="btn btn-primary" onclick="dashboard.createNew('book')">
                        <i class="fas fa-plus me-2"></i>New Book
                    </button>
                </div>
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Error loading books data:</strong> ${error.message}
                    <br><small>Please check the console for more details. You can still create new books.</small>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover data-table">
                        <thead>
                            <tr>
                                <th>Cover</th>
                                <th>Title</th>
                                <th>Author</th>
                                <th>Type/Genre</th>
                                <th>Details</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td colspan="6" class="text-center py-4"><em>No books found. Click "New Book" to create one.</em></td></tr>
                        </tbody>
                    </table>
                </div>
            `;
        }
    }

    async loadProfiles() {
        try {
            // Add cache-busting parameter to force fresh data
            const response = await fetch(`data/profiles.json?t=${Date.now()}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            
            // Handle both array and object structures
            const profiles = data.profiles || data;
            
            // Validate that profiles is an array
            if (!Array.isArray(profiles)) {
                throw new Error('profiles.json should contain an array of profile objects');
            }
            
            this.currentData = profiles;

            const contentArea = document.getElementById('content-area');
            contentArea.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h3><i class="fas fa-users me-2 text-primary"></i>Profile Management</h3>
                    <button class="btn btn-primary" onclick="dashboard.createNew('profile')">
                        <i class="fas fa-plus me-2"></i>New Profile
                    </button>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover data-table">
                        <thead>
                            <tr>
                                <th>Avatar</th>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Term</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${profiles.length === 0 ? 
                                '<tr><td colspan="5" class="text-center py-4"><em>No profiles found. Click "New Profile" to create one.</em></td></tr>' :
                                profiles.map((profile, index) => {
                                    const initials = profile.name ? profile.name.split(' ').map(n => n[0]).join('') : 'U';
                                    const avatarPlaceholder = this.createPlaceholderImage(initials, 40, 40);
                                    return `
                                        <tr>
                                            <td>
                                                <img src="${profile.avatar || profile.image || avatarPlaceholder}" alt="Profile avatar" 
                                                     style="width: 40px; height: 40px; object-fit: cover; border-radius: 50%;"
                                                     onerror="this.src='${avatarPlaceholder}'">
                                            </td>
                                            <td><strong>${profile.name || 'Unknown'}</strong></td>
                                            <td>
                                                <span class="badge bg-info">${profile.role || 'User'}</span>
                                            </td>
                                            <td><small class="text-muted">${profile.term || 'N/A'}</small></td>
                                            <td>
                                                <button class="btn btn-outline-primary btn-action" onclick="dashboard.editItem(${index}, 'profile')" title="Edit Profile">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-outline-danger btn-action" onclick="dashboard.deleteItem(${index}, 'profile')" title="Delete Profile">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')
                            }
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            // If file doesn't exist, create empty data and show creation option
            this.currentData = [];
            const contentArea = document.getElementById('content-area');
            contentArea.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h3><i class="fas fa-users me-2 text-primary"></i>Profile Management</h3>
                    <button class="btn btn-primary" onclick="dashboard.createNew('profile')">
                        <i class="fas fa-plus me-2"></i>New Profile
                    </button>
                </div>
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>No profiles data found.</strong> The profiles.json file may be missing or invalid.
                    <br><small>Create your first profile using the "New Profile" button above.</small>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover data-table">
                        <thead>
                            <tr>
                                <th>Avatar</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td colspan="5" class="text-center py-4"><em>No profiles found. Click "New Profile" to create one.</em></td></tr>
                        </tbody>
                    </table>
                </div>
            `;
        }
    }

    async loadImages(category = 'blogs') {
        const contentArea = document.getElementById('content-area');
        
        // Store the current category for uploads
        this.currentImageCategory = category;
        
        // Show loading state
        contentArea.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin fa-2x text-primary"></i></div>';
        
        try {
            // Fetch images for the selected category
            const response = await fetch(`/images/${category}`);
            const result = await response.json();
            const images = result.images || [];
            
            contentArea.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h3><i class="fas fa-images me-2 text-primary"></i>Image Management</h3>
                    <div>
                        <label for="imageUploadMain" class="btn btn-primary">
                            <i class="fas fa-upload me-2"></i>Upload Image
                            <input type="file" id="imageUploadMain" accept="image/*" style="display: none;">
                        </label>
                    </div>
                </div>
                
                <!-- Category Tabs -->
                <ul class="nav nav-tabs mb-4">
                    <li class="nav-item">
                        <a class="nav-link ${category === 'blogs' ? 'active' : ''}" href="#" onclick="dashboard.loadImages('blogs'); return false;">
                            <i class="fas fa-blog me-1"></i> Blog Images
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link ${category === 'books' ? 'active' : ''}" href="#" onclick="dashboard.loadImages('books'); return false;">
                            <i class="fas fa-book me-1"></i> Book Images
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link ${category === 'profiles' ? 'active' : ''}" href="#" onclick="dashboard.loadImages('profiles'); return false;">
                            <i class="fas fa-user me-1"></i> Profile Images
                        </a>
                    </li>
                </ul>
                
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>Category:</strong> ${category.charAt(0).toUpperCase() + category.slice(1)} 
                    <span class="badge bg-primary ms-2">${images.length} image${images.length !== 1 ? 's' : ''}</span>
                </div>
                
                ${images.length === 0 ? `
                    <div class="text-center py-5">
                        <i class="fas fa-images fa-3x text-muted mb-3"></i>
                        <p class="text-muted">No images in this category yet.</p>
                        <p class="text-muted"><small>Upload images using the "Upload Image" button above.</small></p>
                    </div>
                ` : `
                    <div class="row g-3">
                        ${images.map(img => {
                            const imgPath = `data/thumbnails/${category}/${img}`;
                            return `
                                <div class="col-md-3 col-sm-4 col-6">
                                    <div class="card h-100 shadow-sm">
                                        <img src="${imgPath}" class="card-img-top" alt="${img}" 
                                             style="height: 200px; object-fit: cover; cursor: pointer;"
                                             onclick="dashboard.viewImage('${imgPath}', '${img}')">
                                        <div class="card-body p-2">
                                            <p class="card-text small text-truncate mb-1" title="${img}">
                                                <i class="fas fa-file-image me-1 text-muted"></i>${img}
                                            </p>
                                            <div class="d-flex gap-1">
                                                <button class="btn btn-sm btn-outline-primary flex-grow-1" 
                                                        onclick="dashboard.copyImagePath('${imgPath}')" 
                                                        title="Copy Path">
                                                    <i class="fas fa-copy"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-danger" 
                                                        onclick="dashboard.deleteImage('${category}', '${img}')" 
                                                        title="Delete">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            `;

            // Bind upload event
            const uploadInput = document.getElementById('imageUploadMain');
            if (uploadInput) {
                uploadInput.removeEventListener('change', this.handleImageUpload);
                this.handleImageUpload = (e) => {
                    this.currentImageCategory = category;
                    this.uploadImage(e.target.files[0]);
                };
                uploadInput.addEventListener('change', this.handleImageUpload);
            }
            
        } catch (error) {
            console.error('Error loading images:', error);
            contentArea.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error loading images: ${error.message}
                </div>
            `;
        }
    }

    viewImage(path, name) {
        const modal = new bootstrap.Modal(document.getElementById('editModal'));
        document.querySelector('.modal-title').textContent = name;
        document.getElementById('form-fields').innerHTML = `
            <div class="text-center">
                <img src="${path}" alt="${name}" style="max-width: 100%; max-height: 70vh; border-radius: 8px;">
                <div class="mt-3">
                    <input type="text" class="form-control text-center" value="${path}" readonly onclick="this.select()">
                </div>
            </div>
        `;
        
        // Hide save button for image viewing
        document.getElementById('saveChanges').style.display = 'none';
        modal.show();
        
        // Restore save button when modal closes
        document.getElementById('editModal').addEventListener('hidden.bs.modal', function() {
            document.getElementById('saveChanges').style.display = 'block';
        }, { once: true });
    }

    copyImagePath(path) {
        navigator.clipboard.writeText(path).then(() => {
            // Show temporary success message
            const btn = event.target.closest('button');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i>';
            btn.classList.remove('btn-outline-primary');
            btn.classList.add('btn-success');
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.classList.remove('btn-success');
                btn.classList.add('btn-outline-primary');
            }, 1500);
        }).catch(err => {
            alert('Failed to copy path: ' + err.message);
        });
    }

    async deleteImage(category, filename) {
        if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/delete-image/${category}/${filename}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            
            if (result.success) {
                alert('Image deleted successfully!');
                this.loadImages(category);
            } else {
                throw new Error(result.message || 'Failed to delete image');
            }
        } catch (error) {
            alert(`Error deleting image: ${error.message}`);
        }
    }

    createPlaceholderImage(text, width = 150, height = 100) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Gradient background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#f8f9fa');
        gradient.addColorStop(1, '#e9ecef');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Border
        ctx.strokeStyle = '#dee2e6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(2, 2, width - 4, height - 4);
        
        // Text
        ctx.fillStyle = '#6c757d';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, width / 2, height / 2);
        
        return canvas.toDataURL();
    }

    createNew(type) {
        const templates = {
            blog: (() => {
                const id = Date.now();
                return {
                    id: id,
                    blogName: '',
                    writers: [''],
                    graphicDesigners: [''],
                    date: new Date().toISOString().split('T')[0],
                    description: '',
                    mdPath: `../data/blogs/${id}.md`,
                    categories: [],
                    readTime: '5 min read',
                    image: ''
                };
            })(),
            book: {
                title: '',
                author: '',
                genre: '',
                pages: 0,
                thumbnail: '',
                description: '',
                date: '',
                size: '',
                pdfUrl: ''
            },
            profile: {
                name: '',
                role: 'Writer',
                term: '2025 - Present',
                avatar: '',
                bio: ''
            }
        };

        this.editingItem = -1;
        this.showEditModal(templates[type], type);
    }

    editItem(index, type) {
        this.editingItem = index;
        this.showEditModal(this.currentData[index], type);
    }

    showEditModal(item, type) {
        const modal = new bootstrap.Modal(document.getElementById('editModal'));
        const formFields = document.getElementById('form-fields');
        
        let fieldsHtml = '';
        
        switch(type) {
            case 'blog':
                // Handle both old and new blog structures
                const blogName = item.blogName || item.title || '';
                const writers = item.writers ? 
                    (Array.isArray(item.writers) ? item.writers.join(', ') : item.writers) :
                    (item.writer || '');
                const graphicDesigners = item.graphicDesigners ? 
                    (Array.isArray(item.graphicDesigners) ? item.graphicDesigners.join(', ') : item.graphicDesigners) : '';
                const mdPath = item.mdPath || item.contentFile || '';
                const image = item.image || item.thumbnail || '';
                
                fieldsHtml = `
                    <div class="row">
                        <div class="col-md-8">
                            <div class="form-floating mb-3">
                                <input type="text" class="form-control" id="blogName" value="${blogName}">
                                <label for="blogName">Blog Title</label>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-floating mb-3">
                                <input type="date" class="form-control" id="date" value="${item.date || ''}">
                                <label for="date">Date</label>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-floating mb-3">
                                <input type="text" class="form-control" id="writers" value="${writers}">
                                <label for="writers">Writers (comma separated)</label>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-floating mb-3">
                                <input type="text" class="form-control" id="graphicDesigners" value="${graphicDesigners}">
                                <label for="graphicDesigners">Graphic Designers (comma separated)</label>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-floating mb-3">
                                <input type="text" class="form-control" id="readTime" value="${item.readTime || ''}">
                                <label for="readTime">Read Time</label>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-floating mb-3">
                                <input type="text" class="form-control" id="mdPath" value="${mdPath}" placeholder="../data/blogs/b1.md">
                                <label for="mdPath">Markdown File Path</label>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Categories (comma separated)</label>
                        <input type="text" class="form-control" id="categories" value="${(item.categories || []).join(', ')}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Thumbnail Preview</label>
                        <div class="mb-2">
                            <img id="thumbnailPreview" src="${image || dashboard.createPlaceholderImage('Blog', 200, 150)}" alt="Thumbnail preview" style="max-width: 200px; max-height: 150px; object-fit: cover; border-radius: 8px; border: 2px solid #dee2e6;" onerror="this.src=dashboard.createPlaceholderImage('Blog', 200, 150)">
                        </div>
                        <div class="input-group">
                            <input type="text" class="form-control" id="image" value="${image}" placeholder="Click 'Select' to choose an image">
                            <button class="btn btn-outline-secondary" type="button" onclick="dashboard.openImageModal('image')">
                                <i class="fas fa-image"></i> Select Image
                            </button>
                        </div>
                        <small class="text-muted">Select a thumbnail image from the blogs category</small>
                    </div>
                    <div class="form-floating mb-3">
                        <textarea class="form-control" id="description" style="height: 100px">${item.description || ''}</textarea>
                        <label for="description">Description</label>
                    </div>
                `;
                break;
                
            case 'book':
                fieldsHtml = `
                    <div class="row">
                        <div class="col-md-8">
                            <div class="form-floating mb-3">
                                <input type="text" class="form-control" id="title" value="${item.title || ''}">
                                <label for="title">Title</label>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-floating mb-3">
                                <input type="date" class="form-control" id="date" value="${item.date || ''}">
                                <label for="date">Date</label>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-floating mb-3">
                                <input type="text" class="form-control" id="author" value="${item.author || ''}">
                                <label for="author">Author</label>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-floating mb-3">
                                <input type="text" class="form-control" id="genre" value="${item.genre || ''}">
                                <label for="genre">Genre</label>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="form-floating mb-3">
                                <input type="number" class="form-control" id="pages" value="${item.pages || ''}">
                                <label for="pages">Pages</label>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-floating mb-3">
                                <input type="text" class="form-control" id="size" value="${item.size || ''}">
                                <label for="size">File Size</label>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-floating mb-3">
                                <input type="url" class="form-control" id="pdfUrl" value="${item.pdfUrl || ''}" placeholder="https://...">
                                <label for="pdfUrl">PDF URL (optional)</label>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Cover Preview</label>
                        <div class="mb-2">
                            <img id="thumbnailPreview" src="${item.thumbnail || dashboard.createPlaceholderImage('Book', 150, 200)}" alt="Cover preview" style="max-width: 150px; max-height: 200px; object-fit: cover; border-radius: 8px; border: 2px solid #dee2e6;" onerror="this.src=dashboard.createPlaceholderImage('Book', 150, 200)">
                        </div>
                        <div class="input-group">
                            <input type="text" class="form-control" id="thumbnail" value="${item.thumbnail || ''}" placeholder="Click 'Select' to choose a cover image">
                            <button class="btn btn-outline-secondary" type="button" onclick="dashboard.openImageModal('thumbnail')">
                                <i class="fas fa-image"></i> Select Image
                            </button>
                        </div>
                        <small class="text-muted">Select a cover image from the books category</small>
                    </div>
                    <div class="form-floating mb-3">
                        <textarea class="form-control" id="description" style="height: 100px">${item.description || ''}</textarea>
                        <label for="description">Description</label>
                    </div>
                `;
                break;
                
            case 'profile':
                fieldsHtml = `
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-floating mb-3">
                                <input type="text" class="form-control" id="name" value="${item.name || ''}">
                                <label for="name">Name</label>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-floating mb-3">
                                <input type="text" class="form-control" id="term" value="${item.term || ''}" placeholder="2025 - Present">
                                <label for="term">Term</label>
                            </div>
                        </div>
                    </div>
                    <div class="form-floating mb-3">
                        <select class="form-select" id="role">
                            <option value="Writer" ${item.role === 'Writer' ? 'selected' : ''}>Writer</option>
                            <option value="Content Writer" ${item.role === 'Content Writer' ? 'selected' : ''}>Content Writer</option>
                            <option value="Graphic Designer" ${item.role === 'Graphic Designer' ? 'selected' : ''}>Graphic Designer</option>
                            <option value="Editor" ${item.role === 'Editor' ? 'selected' : ''}>Editor</option>
                            <option value="Admin" ${item.role === 'Admin' ? 'selected' : ''}>Admin</option>
                        </select>
                        <label for="role">Role</label>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Avatar Preview</label>
                        <div class="mb-2">
                            <img id="avatarPreview" src="${item.avatar || dashboard.createPlaceholderImage(item.name ? item.name.split(' ').map(n => n[0]).join('') : 'U', 80, 80)}" alt="Avatar preview" style="width: 80px; height: 80px; object-fit: cover; border-radius: 50%; border: 2px solid #dee2e6;" onerror="this.src=dashboard.createPlaceholderImage('Avatar', 80, 80)">
                        </div>
                        <div class="input-group">
                            <input type="text" class="form-control" id="avatar" value="${item.avatar || ''}" placeholder="Click 'Select' to choose an avatar">
                            <button class="btn btn-outline-secondary" type="button" onclick="dashboard.openImageModal('avatar')">
                                <i class="fas fa-image"></i> Select Image
                            </button>
                        </div>
                        <small class="text-muted">Select an avatar image from the profiles category</small>
                    </div>
                    <div class="form-floating mb-3">
                        <textarea class="form-control" id="bio" style="height: 100px">${item.bio || ''}</textarea>
                        <label for="bio">Bio</label>
                    </div>
                `;
                break;
        }
        
        formFields.innerHTML = fieldsHtml;
        modal.show();
    }

    async editMarkdown(filename) {
        if (!filename) {
            alert('No content file specified for this blog');
            return;
        }

        try {
            const response = await fetch(`data/${filename}`);
            let content;
            
            if (response.ok) {
                content = await response.text();
            } else {
                // If file doesn't exist, create sample content
                content = `# New Blog Post

This is a new blog post. Start writing your content here...

## Introduction

Write your introduction here.

## Main Content

Add your main content here.

### Subsection

More details...

## Conclusion

Wrap up your post here.

---

*Created on ${new Date().toLocaleDateString()}*`;
            }
            
            const modal = new bootstrap.Modal(document.getElementById('editModal'));
            document.getElementById('form-fields').innerHTML = `
                <div class="mb-3">
                    <label class="form-label">Markdown Content (${filename})</label>
                    <textarea class="form-control editor-container" id="markdownContent" style="height: 400px; font-family: 'Courier New', monospace; font-size: 14px;">${content}</textarea>
                </div>
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>Note:</strong> ${response.ok ? 'Loaded from existing file.' : 'File not found - creating new content.'} 
                    In a production environment, changes would be saved to the server.
                </div>
            `;
            
            document.querySelector('.modal-title').textContent = `Edit ${filename}`;
            
            // Override save function for markdown
            const saveBtn = document.getElementById('saveChanges');
            const originalOnClick = saveBtn.onclick;
            saveBtn.onclick = () => this.saveMarkdown(filename, originalOnClick);
            
            modal.show();
        } catch (error) {
            alert(`Error loading ${filename}: ${error.message}`);
        }
    }

    async saveMarkdown(filename, originalOnClick) {
        const content = document.getElementById('markdownContent').value;
        
        try {
            const response = await fetch('/save-markdown', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filename: filename,
                    content: content
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || 'Unknown error occurred');
            }

            alert(`${filename} content saved successfully to server!`);
            
            // Restore original save function
            document.getElementById('saveChanges').onclick = originalOnClick;
            bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
        } catch (error) {
            alert(`Error saving ${filename}: ${error.message}`);
        }
    }

    async createMarkdownFile(filename, title) {
        const content = `# ${title}

This is a new blog post. Start writing your content here...

## Introduction

Write your introduction here.

## Main Content

Add your main content here.

### Subsection

More details...

## Conclusion

Wrap up your post here.

---

*Created on ${new Date().toLocaleDateString()}*`;

        try {
            const response = await fetch('/save-markdown', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filename: filename,
                    content: content
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || 'Unknown error occurred');
            }

            console.log(`Markdown file ${filename} created successfully`);
        } catch (error) {
            console.error(`Error creating markdown file ${filename}:`, error);
            // Don't alert here, just log - we don't want to interrupt the blog creation flow
        }
    }

    async saveItem() {
        const form = document.getElementById('editForm');
        const data = {};
        
        // Collect form data
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                data[input.id] = input.checked;
            } else if (input.id === 'categories') {
                data[input.id] = input.value.split(',').map(cat => cat.trim()).filter(cat => cat);
            } else if (input.id === 'writers' || input.id === 'graphicDesigners') {
                data[input.id] = input.value.split(',').map(item => item.trim()).filter(item => item);
            } else if (input.type === 'number') {
                data[input.id] = parseInt(input.value) || 0;
            } else {
                data[input.id] = input.value;
            }
        });

        try {
            if (this.editingItem === -1) {
                // New item - assign ID if it's a blog
                if (this.currentSection === 'blogs' && !data.id) {
                    // Find the highest ID in the current data
                    const maxId = Math.max(0, ...this.currentData.map(item => (item && item.id) ? item.id : 0));
                    data.id = maxId + 1;
                }
                this.currentData.push(data);
            } else {
                // Edit existing - preserve existing fields and merge new data
                const existingItem = this.currentData[this.editingItem] || {};
                
                // Preserve ID if it exists, or generate one for blogs
                let preservedId = existingItem.id || data.id;
                if (this.currentSection === 'blogs' && !preservedId) {
                    const maxId = Math.max(0, ...this.currentData.map(item => (item && item.id) ? item.id : 0));
                    preservedId = maxId + 1;
                }
                
                this.currentData[this.editingItem] = { 
                    ...existingItem, 
                    ...data
                };
                
                // Add ID only if we have one and it's needed
                if (preservedId && this.currentSection === 'blogs') {
                    this.currentData[this.editingItem].id = preservedId;
                }
            }

            // Save the data in the correct structure based on section
            let dataToSave = this.currentData;
            if (this.currentSection === 'blogs') {
                dataToSave = { blogs: this.currentData };
            } else if (this.currentSection === 'books') {
                dataToSave = { books: this.currentData };
            } else if (this.currentSection === 'profiles') {
                dataToSave = { profiles: this.currentData };
            }

            console.log('About to save data:', dataToSave);
            await this.saveDataToServer(this.currentSection, dataToSave);
            
            // If it's a new blog, create the markdown file
            if (this.editingItem === -1 && this.currentSection === 'blogs' && data.mdPath) {
                await this.createMarkdownFile(data.mdPath, data.blogName || 'Untitled Blog');
            }
            
            alert('Item saved successfully to server!');
            
            bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
            
            // Reload the section to show updated data
            await this.loadSection(this.currentSection);
            
        } catch (error) {
            console.error('Save error:', error);
            alert(`Error saving: ${error.message}`);
        }
    }

    async saveDataToServer(section, data) {
        try {
            console.log(`Saving ${section} data:`, data);
            
            const response = await fetch(`/save-${section}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            console.log('Server response:', result);
            
            if (!result.success) {
                throw new Error(result.message || 'Unknown error occurred');
            }

            console.log(`Successfully saved ${section}.json:`, result);
            
        } catch (error) {
            console.error(`Error saving ${section}:`, error);
            throw error;
        }
    }

    deleteItem(index, type) {
        if (confirm(`Are you sure you want to delete this ${type}?`)) {
            this.currentData.splice(index, 1);
            
            // Save changes to server with correct structure
            let dataToSave = this.currentData;
            if (this.currentSection === 'blogs') {
                dataToSave = { blogs: this.currentData };
            } else if (this.currentSection === 'books') {
                dataToSave = { books: this.currentData };
            } else if (this.currentSection === 'profiles') {
                dataToSave = { profiles: this.currentData };
            }

            this.saveDataToServer(this.currentSection, dataToSave)
                .then(() => {
                    console.log('Updated data after deletion:', this.currentData);
                    alert('Item deleted successfully from server!');
                    this.loadSection(this.currentSection);
                })
                .catch(error => {
                    alert(`Error deleting: ${error.message}`);
                });
        }
    }

    async openImageModal(field) {
        this.currentImageField = field;
        
        const modal = new bootstrap.Modal(document.getElementById('imageModal'));
        const imageGrid = document.getElementById('imageGrid');
        
        // Show loading state
        imageGrid.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin fa-2x text-primary"></i></div>';
        
        modal.show();
        
        // Bind upload event for the modal's upload input
        const modalUploadInput = document.getElementById('imageUpload');
        if (modalUploadInput) {
            // Remove existing listener if any
            const newInput = modalUploadInput.cloneNode(true);
            modalUploadInput.parentNode.replaceChild(newInput, modalUploadInput);
            
            // Add new listener with correct category
            newInput.addEventListener('change', (e) => {
                if (e.target.files[0]) {
                    this.uploadImage(e.target.files[0]);
                }
            });
        }
        
        // Load images for modal
        await this.loadImagesForModal();
    }

    async loadImagesForModal() {
        const imageGrid = document.getElementById('imageGrid');
        
        try {
            // Determine which category to load based on current section
            let category = 'blogs'; // default
            if (this.currentSection === 'books') {
                category = 'books';
            } else if (this.currentSection === 'profiles') {
                category = 'profiles';
            }
            
            const response = await fetch(`/images/${category}`);
            const result = await response.json();
            const images = result.images || [];
            
            if (images.length === 0) {
                imageGrid.innerHTML = `
                    <div class="text-center py-4">
                        <i class="fas fa-image fa-3x text-muted mb-3"></i>
                        <p class="text-muted">No images available in ${category} category.</p>
                        <p class="text-muted"><small>Go to Images section to upload images.</small></p>
                    </div>
                `;
                return;
            }

            imageGrid.innerHTML = `
                <div class="row g-3">
                    ${images.map(img => {
                        const imgPath = `data/thumbnails/${category}/${img}`;
                        return `
                            <div class="col-lg-4 col-md-6 col-sm-12">
                                <div class="card h-100 shadow-sm" style="cursor: pointer;" 
                                     onclick="dashboard.selectImageItem('${imgPath}')">
                                    <img src="${imgPath}" class="card-img-top" alt="${img}" 
                                         style="width: 100%; height: 400px; object-fit: contain; padding: 20px; background: #f8f9fa;">
                                    <div class="card-body p-2">
                                        <p class="card-text small text-truncate mb-0" title="${img}">
                                            ${img}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } catch (error) {
            console.error('Error loading images for modal:', error);
            imageGrid.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error loading images: ${error.message}
                </div>
            `;
        }
    }

    selectImageItem(image) {
        this.selectedImage = image;
        
        if (this.currentImageField) {
            // Update the specific field that was clicked
            const fieldInput = document.getElementById(this.currentImageField);
            if (fieldInput) {
                fieldInput.value = image;
                
                // Update preview image - handle all possible preview IDs
                let previewImg = null;
                
                // For blogs and books (thumbnailPreview)
                if (this.currentImageField === 'image' || this.currentImageField === 'thumbnail') {
                    previewImg = document.getElementById('thumbnailPreview');
                }
                // For profiles (avatarPreview)
                else if (this.currentImageField === 'avatar') {
                    previewImg = document.getElementById('avatarPreview');
                }
                
                if (previewImg) {
                    previewImg.src = image;
                    // Handle image load errors
                    previewImg.onerror = function() {
                        this.src = dashboard.createPlaceholderImage('Preview', this.width, this.height);
                    };
                }
            }
            
            // Close the modal
            const modalElement = document.getElementById('imageModal');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                }
            }
        }
    }

    selectImageForField() {
        if (!this.selectedImage) {
            alert('Please select an image first');
            return;
        }
        
        // Trigger the click event of the file input
        document.getElementById('imageUpload').click();
    }

    async uploadImage(file) {
        if (!file) return;
        
        try {
            const formData = new FormData();
            formData.append('image', file);
            
            // Determine the correct upload section:
            // - If in 'images' section, use currentImageCategory (the selected tab)
            // - Otherwise, use currentSection (blogs/books/profiles)
            const uploadSection = this.currentSection === 'images' 
                ? this.currentImageCategory 
                : this.currentSection;
            
            console.log('Uploading image - Section:', uploadSection, '| Current section:', this.currentSection, '| Current image category:', this.currentImageCategory);

            const response = await fetch(`/upload-image/${uploadSection}`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    alert(`Image "${file.name}" uploaded successfully!\nPath: ${result.path}`);
                    
                    if (this.currentSection === 'images') {
                        // Reload the images with the current category
                        this.loadImages(uploadSection);
                    } else {
                        this.loadImagesForModal();
                    }
                    return;
                } else {
                    throw new Error(result.message || 'Upload failed');
                }
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
        } catch (error) {
            alert(`Error uploading image: ${error.message}`);
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.dashboard = new Dashboard();
});

// Function to create placeholder images (utility function available globally)
function createPlaceholderImage(text, width = 150, height = 100) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f8f9fa');
    gradient.addColorStop(1, '#e9ecef');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Border
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(2, 2, width - 4, height - 4);
    
    // Text
    ctx.fillStyle = '#6c757d';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);
    
    return canvas.toDataURL();
}
