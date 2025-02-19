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

// Configuración de MongoDB extremadamente simple
const MONGO_OPTIONS = {
    useNewUrlParser: true,
    useUnifiedTopology: true
};

let db = null;
let client = null;

async function connectDB() {
    try {
        // Intentar conectar sin opciones adicionales
        client = new MongoClient(MONGO_URI);
        await client.connect();
        db = client.db('finanzas');
        
        // Verificar la conexión
        await db.command({ ping: 1 });
        console.log('Conectado exitosamente a MongoDB');
        
        return db;
    } catch (error) {
        console.error('Error conectando a MongoDB:', error);
        // No lanzar el error, solo registrarlo
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

// Inicializar el servidor primero
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, async () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    
    try {
        const database = await connectDB();
        if (database) {
            // Solo configurar rutas si la conexión fue exitosa
            app.use('/proyectos', proyectosRoutes(database));
            app.use('/proyectos', transaccionesRoutes(database));
            console.log('Rutas configuradas correctamente');
        }
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
    }
});

// Manejador de errores global
app.use((err, req, res, next) => {
    console.error('Error en la aplicación:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error interno'
    });
});

// Manejo de cierre limpio
process.on('SIGTERM', async () => {
    try {
        if (client) {
            await client.close();
        }
        server.close();
    } catch (error) {
        console.error('Error al cerrar:', error);
    }
});

module.exports = app; 