const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const proyectosRoutes = require('./routes/proyectos');
const transaccionesRoutes = require('./routes/transacciones');

const app = express();

// Configuración CORS
app.use(cors({
    origin: ['http://localhost:3000', 'https://gastos-cyan.vercel.app', 'https://gastos-production.up.railway.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

// Middleware para logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Modificar la URI para usar el formato correcto sin opciones en la URL
const MONGO_URI = 'mongodb+srv://vic:Daiana01.@cluster0.qlghn.mongodb.net';
const DB_NAME = 'finanzas';

let db = null;

async function connectDB() {
    try {
        // Crear el cliente sin ninguna opción
        const client = new MongoClient(MONGO_URI);
        
        // Conectar
        await client.connect();
        
        // Obtener la base de datos
        db = client.db(DB_NAME);
        
        // Verificar la conexión
        await db.command({ ping: 1 });
        console.log('Conectado exitosamente a MongoDB');
        
        return db;
    } catch (error) {
        console.error('Error de conexión a MongoDB:', error);
        return null;
    }
}

// Ruta para el favicon con tipo de contenido correcto
app.get('/favicon.ico', (req, res) => {
    res.set('Content-Type', 'image/x-icon');
    res.status(204).end();
});

// Ruta raíz
app.get('/', (req, res) => {
    res.json({ status: 'API is running' });
});

// Inicializar servidor
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Servidor iniciado en puerto ${PORT}`);
    
    // Intentar conectar a MongoDB
    connectDB().then(database => {
        if (database) {
            app.use('/proyectos', proyectosRoutes(database));
            app.use('/proyectos', transaccionesRoutes(database));
            console.log('Rutas configuradas');
        }
    }).catch(err => {
        console.error('Error al configurar la base de datos:', err);
    });
});

// Manejador de errores
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Servidor cerrado');
        process.exit(0);
    });
});

module.exports = app; 