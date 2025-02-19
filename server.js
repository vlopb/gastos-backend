const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const proyectosRoutes = require('./routes/proyectos');
const transaccionesRoutes = require('./routes/transacciones');

const app = express();

// Configuración CORS específica
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'https://gastos-cyan.vercel.app',
        'https://gastos-production.up.railway.app'  // Agregar el dominio de Railway
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 204  // Cambiado a 204 para preflight
};

// Aplicar CORS antes de cualquier ruta
app.use(cors(corsOptions));

// Pre-flight requests
app.options('*', cors(corsOptions));

app.use(express.json());

// Middleware para logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://vic:Daiana01.@cluster0.qlghn.mongodb.net/?retryWrites=true&w=majority';

let db;

// Mover las rutas fuera de la función connectDB
// Ruta para el favicon con tipo de contenido correcto
app.get('/favicon.ico', (req, res) => {
    res.set('Content-Type', 'image/x-icon');
    res.status(204).end();
});

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'API is running',
        version: '1.0.0',
        endpoints: {
            proyectos: '/proyectos',
            transacciones: '/proyectos'
        }
    });
});

// Configuración de MongoDB actualizada
const MONGO_OPTIONS = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    w: 'majority',
    wtimeoutMS: 2500,  // Cambiado de wtimeout a wtimeoutMS
    retryWrites: true,
    maxPoolSize: 10,
    minPoolSize: 5,
    maxIdleTimeMS: 15000,
    socketTimeoutMS: 30000,
    serverSelectionTimeoutMS: 5000
    // Eliminado directConnection ya que no es compatible con SRV
};

async function setupIndexes(db) {
    try {
        await db.collection('proyectos').createIndex(
            { "transacciones.fecha": 1 },
            { background: true }
        );
        await db.collection('proyectos').createIndex(
            { updatedAt: 1 },
            { background: true }
        );
        console.log('Índices creados correctamente');
    } catch (error) {
        console.error('Error al crear índices:', error);
    }
}

async function connectDB() {
    try {
        const client = await MongoClient.connect(MONGO_URI, MONGO_OPTIONS);
        db = client.db('finanzas');
        await setupIndexes(db);
        
        // Verificar la conexión
        await db.command({ ping: 1 });
        console.log('Conectado exitosamente a MongoDB');
        
        // Inicializar rutas después de confirmar la conexión
        app.use('/proyectos', proyectosRoutes(db));
        app.use('/proyectos', transaccionesRoutes(db));
        
    } catch (error) {
        console.error('Error conectando a MongoDB:', error);
        // No terminar el proceso, solo registrar el error
        console.error('Detalles del error:', error.message);
    }
}

const PORT = process.env.PORT || 5000;

// Iniciar el servidor primero
const server = app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});

// Luego intentar conectar a MongoDB
connectDB().catch(error => {
    console.error('Error inicial conectando a MongoDB:', error);
    // No cerrar el servidor, permitir reintentos
});

// Manejador de errores global
app.use((err, req, res, next) => {
    console.error('Error en la aplicación:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
    });
});

// Manejar señales de terminación
process.on('SIGTERM', () => {
    console.log('Recibida señal SIGTERM, cerrando servidor...');
    server.close(() => {
        console.log('Servidor cerrado');
        process.exit(0);
    });
});

module.exports = app; 