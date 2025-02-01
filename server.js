const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const proyectosRoutes = require('./routes/proyectos');
const transaccionesRoutes = require('./routes/transacciones');

const app = express();

// Configurar headers de seguridad
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Configuración CORS más específica
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // Reemplaza con tu URL del frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// Conexión MongoDB
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('Error: MONGO_URI no está definida en las variables de entorno');
    process.exit(1);
}

let db;

async function connectDB() {
    try {
        const client = await MongoClient.connect(MONGO_URI);
        db = client.db('finanzas');
        console.log('Conectado a MongoDB');
        
        // Ruta para el favicon
        app.get('/favicon.ico', (req, res) => {
            res.status(204).end();
        });

        // Ruta raíz
        app.get('/', (req, res) => {
            res.send('API is running');
        });

        // Inicializar rutas después de conectar a la DB
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