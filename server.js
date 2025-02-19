const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Configuración básica
app.use(express.json());
app.use(cors({
    origin: '*', // Permitir todos los orígenes temporalmente para debugging
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Ruta de prueba
app.get('/test', (req, res) => {
    res.json({ status: 'API is running' });
});

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://vic:Daiana01.@cluster0.qlghn.mongodb.net/finanzas';
let db = null;

async function initializeRoutes(database) {
    const proyectosRoutes = require('./routes/proyectos');
    const transaccionesRoutes = require('./routes/transacciones');
    
    app.use('/proyectos', proyectosRoutes(database));
    app.use('/proyectos', transaccionesRoutes(database));
    
    console.log('Rutas configuradas');
}

async function connectDB() {
    try {
        const client = new MongoClient(MONGO_URI);
        await client.connect();
        db = client.db();
        
        await db.command({ ping: 1 });
        console.log('Conectado exitosamente a MongoDB');
        
        await initializeRoutes(db);
        return db;
    } catch (error) {
        console.error('Error de conexión a MongoDB:', error);
        throw error;
    }
}

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`Servidor iniciado en puerto ${PORT}`);
    try {
        await connectDB();
    } catch (err) {
        console.error('Error al inicializar:', err);
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        message: err.message 
    });
});

module.exports = app; 