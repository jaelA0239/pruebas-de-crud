// Base de datos en memoria simulada
class Database {
    constructor() {
        // Usuarios predefinidos (en una app real esto estaría en un backend seguro)
        this.users = [
            {
                id: 1,
                username: 'admin',
                email: 'admin@system.com',
                password: this.hashPassword('admin123'), // Contraseña hasheada
                role: 'admin',
                name: 'Administrador Principal',
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                username: 'usuario',
                email: 'usuario@system.com',
                password: this.hashPassword('user123'),
                role: 'user',
                name: 'Usuario Demo',
                createdAt: new Date().toISOString()
            }
        ];
        
        // Datos del CRUD (productos, clientes, etc.)
        this.products = [
            { id: 1, name: 'Laptop Dell', category: 'Tecnología', price: 1200, stock: 15, createdBy: 1 },
            { id: 2, name: 'Mouse Inalámbrico', category: 'Accesorios', price: 25, stock: 100, createdBy: 1 },
            { id: 3, name: 'Teclado Mecánico', category: 'Accesorios', price: 80, stock: 45, createdBy: 2 }
        ];
        
        // Sesiones activas
        this.sessions = [];
        
        // Cargar datos guardados del localStorage si existen
        this.loadFromLocalStorage();
    }
    
    // Hash simple de contraseña (en producción usaría bcrypt)
    hashPassword(password) {
        return btoa(password); // Solo para demo - NO USAR EN PRODUCCIÓN
    }
    
    // Verificar contraseña
    verifyPassword(inputPassword, storedHash) {
        return this.hashPassword(inputPassword) === storedHash;
    }
    
    // Usuario CRUD
    createUser(userData) {
        const newUser = {
            id: this.users.length + 1,
            ...userData,
            password: this.hashPassword(userData.password),
            role: 'user',
            createdAt: new Date().toISOString()
        };
        this.users.push(newUser);
        this.saveToLocalStorage();
        return newUser;
    }
    
    getUserByUsername(username) {
        return this.users.find(user => user.username === username);
    }
    
    getUserById(id) {
        return this.users.find(user => user.id === id);
    }
    
    getUsers() {
        return this.users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
    }
    
    // Product CRUD
    createProduct(productData, userId) {
        const newProduct = {
            id: this.products.length + 1,
            ...productData,
            createdBy: userId,
            createdAt: new Date().toISOString()
        };
        this.products.push(newProduct);
        this.saveToLocalStorage();
        return newProduct;
    }
    
    getProducts() {
        return this.products;
    }
    
    getProductById(id) {
        return this.products.find(product => product.id === id);
    }
    
    updateProduct(id, updates) {
        const index = this.products.findIndex(p => p.id === id);
        if (index !== -1) {
            this.products[index] = { ...this.products[index], ...updates };
            this.saveToLocalStorage();
            return this.products[index];
        }
        return null;
    }
    
    deleteProduct(id) {
        const initialLength = this.products.length;
        this.products = this.products.filter(p => p.id !== id);
        if (this.products.length < initialLength) {
            this.saveToLocalStorage();
            return true;
        }
        return false;
    }
    
    // Sesiones
    createSession(userId, token) {
        const session = {
            userId,
            token,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
        };
        this.sessions.push(session);
        return session;
    }
    
    validateSession(token) {
        const session = this.sessions.find(s => s.token === token);
        if (!session) return null;
        
        // Verificar si la sesión expiró
        if (new Date(session.expiresAt) < new Date()) {
            this.sessions = this.sessions.filter(s => s.token !== token);
            return null;
        }
        
        return session;
    }
    
    deleteSession(token) {
        this.sessions = this.sessions.filter(s => s.token !== token);
    }
    
    // Persistencia
    saveToLocalStorage() {
        const data = {
            users: this.users,
            products: this.products,
            sessions: this.sessions
        };
        localStorage.setItem('crud_app_database', JSON.stringify(data));
    }
    
    loadFromLocalStorage() {
        const savedData = localStorage.getItem('crud_app_database');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.users = data.users || this.users;
            this.products = data.products || this.products;
            this.sessions = data.sessions || this.sessions;
        }
    }
    
    // Reset para desarrollo
    resetDatabase() {
        this.users = [
            {
                id: 1,
                username: 'admin',
                email: 'admin@system.com',
                password: this.hashPassword('admin123'),
                role: 'admin',
                name: 'Administrador Principal',
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                username: 'usuario',
                email: 'usuario@system.com',
                password: this.hashPassword('user123'),
                role: 'user',
                name: 'Usuario Demo',
                createdAt: new Date().toISOString()
            }
        ];
        this.products = [
            { id: 1, name: 'Laptop Dell', category: 'Tecnología', price: 1200, stock: 15, createdBy: 1 },
            { id: 2, name: 'Mouse Inalámbrico', category: 'Accesorios', price: 25, stock: 100, createdBy: 1 },
            { id: 3, name: 'Teclado Mecánico', category: 'Accesorios', price: 80, stock: 45, createdBy: 2 }
        ];
        this.sessions = [];
        this.saveToLocalStorage();
    }
}

// Instancia única de la base de datos
const database = new Database();