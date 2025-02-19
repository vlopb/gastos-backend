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

// Configuración de MongoDB con opciones más estrictas y session
const MONGO_OPTIONS = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    w: 'majority',
    wtimeout: 2500,
    retryWrites: true,
    readPreference: 'primary',
    directConnection: true,
    maxPoolSize: 10,
    minPoolSize: 5,
    maxIdleTimeMS: 15000,
    socketTimeoutMS: 30000,
    serverSelectionTimeoutMS: 5000,
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
        
        // Inicializar rutas
        app.use('/proyectos', proyectosRoutes(db));
        app.use('/proyectos', transaccionesRoutes(db));
        
    } catch (error) {
        console.error('Error conectando a MongoDB:', error);
        process.exit(1);
    }
}

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en puerto ${PORT}`);
    });
});

// Agregar después de las rutas
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: err.message
    });
});

module.exports = app; 