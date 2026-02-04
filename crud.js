// Sistema CRUD
class CRUDSystem {
    constructor(currentUser) {
        this.currentUser = currentUser;
        this.init();
    }
    
    init() {
        this.setupUI();
        this.loadDashboard();
        this.setupEventListeners();
        this.updateUserInfo();
    }
    
    setupUI() {
        // Actualizar información del usuario en la interfaz
        if (this.currentUser) {
            document.getElementById('currentUserName').textContent = this.currentUser.name;
            document.getElementById('currentUserRole').textContent = this.currentUser.role === 'admin' ? 'Administrador' : 'Usuario';
            document.getElementById('userGreeting').textContent = `Hola, ${this.currentUser.name.split(' ')[0]}`;
            document.getElementById('profileName').textContent = this.currentUser.name;
            document.getElementById('profileUsername').textContent = `@${this.currentUser.username}`;
            document.getElementById('profileEmail').textContent = this.currentUser.email;
            document.getElementById('profileRole').textContent = this.currentUser.role === 'admin' ? 'Administrador' : 'Usuario';
            document.getElementById('profileJoinDate').textContent = new Date(this.currentUser.createdAt).toLocaleDateString('es-ES');
            
            // Ocultar/mostrar elementos según permisos
            if (this.currentUser.role !== 'admin') {
                document.querySelector('a[data-page="users"]').parentElement.style.display = 'none';
                document.getElementById('addUserBtn').style.display = 'none';
            }
        }
    }
    
    setupEventListeners() {
        // Navegación
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            if (link.dataset.page) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showPage(link.dataset.page);
                    
                    // Actualizar menú activo
                    document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
                    link.classList.add('active');
                    
                    // Actualizar título
                    document.getElementById('pageTitle').textContent = link.querySelector('span').textContent;
                });
            }
        });
        
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
        
        document.getElementById('dropdownLogout').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
        
        // Menú de usuario
        document.getElementById('userMenuBtn').addEventListener('click', () => {
            document.getElementById('userDropdown').classList.toggle('show');
        });
        
        // Cerrar menú al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                document.getElementById('userDropdown').classList.remove('show');
            }
        });
        
        // Toggle sidebar
        document.getElementById('menuToggle').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('collapsed');
        });
        
        // Productos
        document.getElementById('addProductBtn')?.addEventListener('click', () => {
            this.showProductModal();
        });
        
        document.getElementById('cancelProductBtn')?.addEventListener('click', () => {
            this.hideProductModal();
        });
        
        document.getElementById('productForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });
        
        // Cambiar contraseña
        document.getElementById('changePasswordForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.changePassword();
        });
        
        // Filtros de productos
        document.getElementById('productSearch')?.addEventListener('input', (e) => {
            this.filterProducts(e.target.value);
        });
        
        document.getElementById('categoryFilter')?.addEventListener('change', (e) => {
            this.filterProducts();
        });
        
        document.getElementById('resetFilters')?.addEventListener('click', () => {
            document.getElementById('productSearch').value = '';
            document.getElementById('categoryFilter').value = '';
            this.loadProducts();
        });
        
        // Configuración
        document.getElementById('exportDataBtn')?.addEventListener('click', () => {
            this.exportData();
        });
        
        document.getElementById('resetDatabaseBtn')?.addEventListener('click', () => {
            this.showConfirmModal(
                '¿Estás seguro de que deseas reiniciar toda la base de datos? Esta acción eliminará todos los datos excepto las cuentas de administrador.',
                () => this.resetDatabase()
            );
        });
        
        // Notificaciones
        document.getElementById('notificationsBtn')?.addEventListener('click', () => {
            this.showToast('No hay notificaciones nuevas', 'info');
        });
        
        // Mostrar/ocultar contraseña
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', function() {
                const input = this.parentElement.querySelector('input');
                const icon = this.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    input.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            });
        });
    }
    
    showPage(pageName) {
        // Ocultar todas las páginas
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Mostrar página seleccionada
        document.getElementById(pageName + 'Page').classList.add('active');
        
        // Cargar datos específicos de la página
        switch(pageName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'products':
                this.loadProducts();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'profile':
                this.loadProfile();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }
    
    loadDashboard() {
        // Estadísticas
        const users = database.getUsers();
        const products = database.getProducts();
        const sessions = database.sessions;
        
        document.getElementById('statTotalUsers').textContent = users.length;
        document.getElementById('statTotalProducts').textContent = products.length;
        document.getElementById('statActiveSessions').textContent = sessions.length;
        
        // Calcular valor total
        const totalValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);
        document.getElementById('statTotalValue').textContent = '$' + totalValue.toLocaleString();
        
        // Productos recientes
        const recentProducts = products.slice(-5).reverse();
        const recentProductsHtml = recentProducts.map(product => `
            <tr>
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td><span class="badge">${product.category}</span></td>
                <td>$${product.price.toLocaleString()}</td>
                <td>${product.stock}</td>
            </tr>
        `).join('');
        
        document.getElementById('recentProducts').innerHTML = recentProductsHtml;
        
        // Actividad reciente
        const activities = [
            { action: 'Nuevo producto agregado', user: 'admin', time: 'Hace 2 horas' },
            { action: 'Usuario registrado', user: 'sistema', time: 'Hace 5 horas' },
            { action: 'Sesión iniciada', user: currentUser.name, time: 'Reciente' },
            { action: 'Producto actualizado', user: 'admin', time: 'Ayer' }
        ];
        
        const activityHtml = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-circle"></i>
                </div>
                <div class="activity-content">
                    <p>${activity.action}</p>
                    <small>Por ${activity.user} • ${activity.time}</small>
                </div>
            </div>
        `).join('');
        
        document.getElementById('activityList').innerHTML = activityHtml;
    }
    
    loadProducts() {
        const products = database.getProducts();
        const searchTerm = document.getElementById('productSearch')?.value || '';
        const categoryFilter = document.getElementById('categoryFilter')?.value || '';
        
        let filteredProducts = products;
        
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(p => 
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.category.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        if (categoryFilter) {
            filteredProducts = filteredProducts.filter(p => p.category === categoryFilter);
        }
        
        const productsHtml = filteredProducts.map(product => {
            const creator = database.getUserById(product.createdBy);
            return `
                <tr>
                    <td>${product.id}</td>
                    <td>${product.name}</td>
                    <td><span class="badge">${product.category}</span></td>
                    <td>$${product.price.toLocaleString()}</td>
                    <td>
                        <span class="stock-badge ${product.stock > 10 ? 'high' : product.stock > 0 ? 'medium' : 'low'}">
                            ${product.stock}
                        </span>
                    </td>
                    <td>${creator ? creator.name : 'Desconocido'}</td>
                    <td>
                        <button class="btn-icon edit" onclick="crud.editProduct(${product.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" onclick="crud.deleteProduct(${product.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        document.getElementById('productsTable').innerHTML = productsHtml || 
            '<tr><td colspan="7" class="empty">No hay productos para mostrar</td></tr>';
    }
    
    filterProducts(searchTerm = '') {
        this.loadProducts();
    }
    
    showProductModal(productId = null) {
        const modal = document.getElementById('productModal');
        const form = document.getElementById('productForm');
        
        if (productId) {
            // Modo edición
            const product = database.getProductById(productId);
            if (product) {
                document.getElementById('productModalTitle').textContent = 'Editar Producto';
                document.getElementById('productId').value = product.id;
                document.getElementById('productName').value = product.name;
                document.getElementById('productCategory').value = product.category;
                document.getElementById('productPrice').value = product.price;
                document.getElementById('productStock').value = product.stock;
                document.getElementById('productDescription').value = product.description || '';
            }
        } else {
            // Modo creación
            document.getElementById('productModalTitle').textContent = 'Nuevo Producto';
            form.reset();
            document.getElementById('productId').value = '';
        }
        
        modal.style.display = 'flex';
    }
    
    hideProductModal() {
        document.getElementById('productModal').style.display = 'none';
        document.getElementById('productForm').reset();
    }
    
    saveProduct() {
        const productId = document.getElementById('productId').value;
        const productData = {
            name: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            price: parseFloat(document.getElementById('productPrice').value),
            stock: parseInt(document.getElementById('productStock').value),
            description: document.getElementById('productDescription').value
        };
        
        if (productId) {
            // Actualizar producto existente
            const updated = database.updateProduct(parseInt(productId), productData);
            if (updated) {
                this.showToast('Producto actualizado correctamente', 'success');
            }
        } else {
            // Crear nuevo producto
            const newProduct = database.createProduct(productData, this.currentUser.id);
            this.showToast('Producto creado correctamente', 'success');
        }
        
        this.hideProductModal();
        this.loadProducts();
        this.loadDashboard(); // Actualizar estadísticas
    }
    
    editProduct(productId) {
        this.showProductModal(productId);
    }
    
    deleteProduct(productId) {
        this.showConfirmModal(
            '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.',
            () => {
                const success = database.deleteProduct(productId);
                if (success) {
                    this.showToast('Producto eliminado correctamente', 'success');
                    this.loadProducts();
                    this.loadDashboard();
                }
            }
        );
    }
    
    loadUsers() {
        if (this.currentUser.role !== 'admin') {
            this.showToast('No tienes permisos para ver esta sección', 'error');
            this.showPage('dashboard');
            return;
        }
        
        const users = database.getUsers();
        const usersHtml = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>
                    <span class="badge ${user.role === 'admin' ? 'admin' : 'user'}">
                        ${user.role === 'admin' ? 'Administrador' : 'Usuario'}
                    </span>
                </td>
                <td>${new Date(user.createdAt).toLocaleDateString('es-ES')}</td>
                <td>
                    ${user.id !== this.currentUser.id ? `
                        <button class="btn-icon edit" onclick="crud.editUser(${user.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" onclick="crud.deleteUser(${user.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : '<span class="muted">Tú</span>'}
                </td>
            </tr>
        `).join('');
        
        document.getElementById('usersTable').innerHTML = usersHtml;
    }
    
    loadProfile() {
        // Actualizar última conexión
        const now = new Date();
        document.getElementById('profileLastAccess').textContent = 
            now.toLocaleDateString('es-ES') + ' ' + now.toLocaleTimeString('es-ES');
    }
    
    async changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        
        if (newPassword !== confirmPassword) {
            this.showToast('Las contraseñas no coinciden', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            this.showToast('La nueva contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        
        const result = await auth.changePassword(currentPassword, newPassword);
        
        if (result.success) {
            this.showToast('Contraseña cambiada correctamente', 'success');
            document.getElementById('changePasswordForm').reset();
        } else {
            this.showToast(result.message, 'error');
        }
    }
    
    loadSettings() {
        document.getElementById('dbUsersCount').textContent = database.getUsers().length;
        document.getElementById('dbProductsCount').textContent = database.getProducts().length;
        document.getElementById('dbSessionsCount').textContent = database.sessions.length;
    }
    
    exportData() {
        const data = {
            users: database.getUsers(),
            products: database.getProducts(),
            exportedAt: new Date().toISOString(),
            exportedBy: this.currentUser.name
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', `crud_backup_${new Date().toISOString().slice(0,10)}.json`);
        link.click();
        
        this.showToast('Datos exportados correctamente', 'success');
    }
    
    resetDatabase() {
        database.resetDatabase();
        this.showToast('Base de datos reiniciada', 'warning');
        this.loadDashboard();
        this.loadSettings();
        this.hideConfirmModal();
    }
    
    showConfirmModal(message, confirmCallback) {
        document.getElementById('confirmMessage').textContent = message;
        const modal = document.getElementById('confirmModal');
        modal.style.display = 'flex';
        
        const confirmBtn = document.getElementById('confirmActionBtn');
        const cancelBtn = document.getElementById('cancelActionBtn');
        
        const handleConfirm = () => {
            confirmCallback();
            modal.style.display = 'none';
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
        };
        
        const handleCancel = () => {
            modal.style.display = 'none';
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
        };
        
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
    }
    
    hideConfirmModal() {
        document.getElementById('confirmModal').style.display = 'none';
    }
    
    updateUserInfo() {
        // Actualizar periodicamente la información del usuario
        setInterval(() => {
            const user = auth.getCurrentUser();
            if (user) {
                this.currentUser = user;
            }
        }, 30000); // Cada 30 segundos
    }
    
    logout() {
        auth.logout();
        window.location.href = 'index.html';
    }
    
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast ' + type;
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}