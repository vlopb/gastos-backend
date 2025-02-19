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

let client; // Para mantener referencia al cliente de MongoDB

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

// Configuración de MongoDB simplificada
const MONGO_OPTIONS = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    // Remover todas las otras opciones que podrían causar conflictos
};

async function connectDB() {
    try {
        // Si ya hay una conexión activa, la reutilizamos
        if (client && client.isConnected()) {
            return client.db('finanzas');
        }

        client = await MongoClient.connect(MONGO_URI, MONGO_OPTIONS);
        const db = client.db('finanzas');
        
        // Verificar la conexión
        await db.command({ ping: 1 });
        console.log('Conectado exitosamente a MongoDB');
        
        // Configurar rutas solo después de una conexión exitosa
        app.use('/proyectos', proyectosRoutes(db));
        app.use('/proyectos', transaccionesRoutes(db));
        
        return db;
    } catch (error) {
        console.error('Error conectando a MongoDB:', error);
        // Intentar reconectar después de un delay
        setTimeout(connectDB, 5000);
        throw error; // Propagar el error para manejo superior
    }
}

const PORT = process.env.PORT || 5000;

// Inicializar el servidor y la conexión a la base de datos
async function initializeServer() {
    const server = app.listen(PORT, () => {
        console.log(`Servidor corriendo en puerto ${PORT}`);
    });

    // Manejar errores del servidor
    server.on('error', (error) => {
        console.error('Error en el servidor:', error);
    });

    // Intentar conectar a MongoDB
    try {
        await connectDB();
    } catch (error) {
        console.error('Error inicial conectando a MongoDB:', error);
        // El servidor seguirá funcionando y se reintentará la conexión
    }

    // Cleanup al cerrar
    process.on('SIGTERM', async () => {
        console.log('Recibida señal SIGTERM, cerrando...');
        try {
            if (client) {
                await client.close();
                console.log('Conexión a MongoDB cerrada');
            }
            server.close(() => {
                console.log('Servidor HTTP cerrado');
                process.exit(0);
            });
        } catch (error) {
            console.error('Error durante el cierre:', error);
            process.exit(1);
        }
    });

    return server;
}

// Iniciar todo
initializeServer().catch(error => {
    console.error('Error fatal durante la inicialización:', error);
});

// Manejador de errores global
app.use((err, req, res, next) => {
    console.error('Error en la aplicación:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
    });
});

module.exports = app; 