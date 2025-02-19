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

// Asegurarnos que la URI tenga el formato correcto para SRV
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://vic:Daiana01.@cluster0.qlghn.mongodb.net/finanzas?retryWrites=true&w=majority';

let db = null;
let client = null;

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

// Configuración de MongoDB más simple y compatible con SRV
const MONGO_OPTIONS = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    serverSelectionTimeoutMS: 30000,
    // Remover directConnection y otras opciones problemáticas
};

async function connectDB() {
    try {
        if (client && client.isConnected()) {
            return client.db('finanzas');
        }

        client = await MongoClient.connect(MONGO_URI, MONGO_OPTIONS);
        db = client.db('finanzas');
        
        // Verificar la conexión
        await db.command({ ping: 1 });
        console.log('Conectado exitosamente a MongoDB');
        
        return db;
    } catch (error) {
        console.error('Error conectando a MongoDB:', error);
        throw error;
    }
}

// Inicializar el servidor y la base de datos
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    
    // Intentar conectar a MongoDB después de que el servidor esté corriendo
    connectDB()
        .then(database => {
            // Configurar rutas que dependen de la base de datos
            app.use('/proyectos', proyectosRoutes(database));
            app.use('/proyectos', transaccionesRoutes(database));
        })
        .catch(error => {
            console.error('Error inicial al conectar con MongoDB:', error);
            // No cerrar el servidor, permitir que siga funcionando
        });
});

// Manejador de errores global mejorado
app.use((err, req, res, next) => {
    console.error('Error en la aplicación:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
    });
});

module.exports = app; 