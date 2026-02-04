// Sistema de Autenticación
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.currentSession = null;
        this.init();
    }
    
    init() {
        // Verificar si hay una sesión activa en localStorage
        const token = localStorage.getItem('auth_token');
        if (token) {
            this.validateToken(token);
        }
    }
    
    // Generar token aleatorio
    generateToken() {
        return 'token_' + Math.random().toString(36).substr(2) + Date.now().toString(36);
    }
    
    // Login
    async login(username, password) {
        try {
            // Validar campos
            if (!username || !password) {
                throw new Error('Por favor completa todos los campos');
            }
            
            // Buscar usuario
            const user = database.getUserByUsername(username);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            
            // Verificar contraseña
            const isValid = database.verifyPassword(password, user.password);
            if (!isValid) {
                throw new Error('Contraseña incorrecta');
            }
            
            // Generar token de sesión
            const token = this.generateToken();
            
            // Crear sesión en la base de datos
            const session = database.createSession(user.id, token);
            
            // Guardar en localStorage
            localStorage.setItem('auth_token', token);
            localStorage.setItem('user_id', user.id.toString());
            
            // Establecer usuario actual
            this.currentUser = user;
            this.currentSession = session;
            
            // Eliminar contraseña del objeto usuario
            const { password: _, ...userWithoutPassword } = user;
            
            return {
                success: true,
                user: userWithoutPassword,
                token
            };
            
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    // Registro
    async register(userData) {
        try {
            // Validar campos
            const { username, email, password, confirmPassword, name } = userData;
            
            if (!username || !email || !password || !confirmPassword || !name) {
                throw new Error('Por favor completa todos los campos');
            }
            
            if (password !== confirmPassword) {
                throw new Error('Las contraseñas no coinciden');
            }
            
            if (password.length < 6) {
                throw new Error('La contraseña debe tener al menos 6 caracteres');
            }
            
            // Verificar si el usuario ya existe
            const existingUser = database.getUserByUsername(username);
            if (existingUser) {
                throw new Error('El nombre de usuario ya está en uso');
            }
            
            // Verificar si el email ya existe
            const existingEmail = database.getUserByEmail(email);
            if (existingEmail) {
                throw new Error('El email ya está registrado');
            }
            
            // Crear nuevo usuario
            const newUser = database.createUser({
                username,
                email,
                password,
                name
            });
            
            // Generar token y crear sesión automáticamente
            const token = this.generateToken();
            database.createSession(newUser.id, token);
            
            // Guardar en localStorage
            localStorage.setItem('auth_token', token);
            localStorage.setItem('user_id', newUser.id.toString());
            
            // Establecer usuario actual
            this.currentUser = newUser;
            
            // Eliminar contraseña del objeto
            const { password: _, ...userWithoutPassword } = newUser;
            
            return {
                success: true,
                user: userWithoutPassword,
                token
            };
            
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    // Validar token
    validateToken(token) {
        const session = database.validateSession(token);
        if (!session) {
            this.logout();
            return false;
        }
        
        const user = database.getUserById(session.userId);
        if (!user) {
            this.logout();
            return false;
        }
        
        this.currentUser = user;
        this.currentSession = session;
        return true;
    }
    
    // Verificar si el usuario está autenticado
    isAuthenticated() {
        const token = localStorage.getItem('auth_token');
        if (!token) return false;
        
        return this.validateToken(token);
    }
    
    // Obtener usuario actual
    getCurrentUser() {
        if (!this.currentUser) return null;
        
        const { password, ...userWithoutPassword } = this.currentUser;
        return userWithoutPassword;
    }
    
    // Logout
    logout() {
        const token = localStorage.getItem('auth_token');
        if (token) {
            database.deleteSession(token);
        }
        
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_id');
        
        this.currentUser = null;
        this.currentSession = null;
        
        return true;
    }
    
    // Verificar permisos
    hasPermission(requiredRole) {
        if (!this.currentUser) return false;
        
        const rolesHierarchy = {
            'user': 1,
            'admin': 2
        };
        
        const userRoleLevel = rolesHierarchy[this.currentUser.role] || 0;
        const requiredRoleLevel = rolesHierarchy[requiredRole] || 0;
        
        return userRoleLevel >= requiredRoleLevel;
    }
    
    // Cambiar contraseña
    async changePassword(oldPassword, newPassword) {
        try {
            if (!this.currentUser) {
                throw new Error('No hay usuario autenticado');
            }
            
            // Verificar contraseña actual
            const isValid = database.verifyPassword(oldPassword, this.currentUser.password);
            if (!isValid) {
                throw new Error('La contraseña actual es incorrecta');
            }
            
            if (newPassword.length < 6) {
                throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
            }
            
            // Actualizar contraseña en la base de datos
            const success = database.updateUserPassword(this.currentUser.id, newPassword);
            
            if (success) {
                // Actualizar usuario actual
                this.currentUser = database.getUserById(this.currentUser.id);
                return { success: true };
            }
            
            throw new Error('Error al actualizar la contraseña');
            
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
}

// Instancia global del sistema de autenticación
const auth = new AuthSystem();
