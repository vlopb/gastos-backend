const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const chalk = require('chalk');
require('dotenv').config();

const proyectosRoutes = require('./routes/proyectos');
const transaccionesRoutes = require('./routes/transacciones');

const app = express();
let db;

// Configuración de seguridad y CORS
const configureSecurity = () => {
    app.use((req, res, next) => {
        res.setHeader('Content-Security-Policy', "default-src 'self' * data: 'unsafe-inline' 'unsafe-eval'; img-src 'self' * data: blob: 'unsafe-inline'; connect-src 'self' *;");
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        next();
    });

    app.use(cors({
        origin: process.env.FRONTEND_URL || '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
        exposedHeaders: ['set-cookie']
    }));
};

// Configuración de middleware
const configureMiddleware = () => {
    app.use(express.json());
};

// Rutas básicas
const configureRoutes = () => {
    app.get('/favicon.ico', (req, res) => {
        res.set('Content-Type', 'image/x-icon');
        res.status(204).end();
    });

    app.get('/', (req, res) => {
        res.json({
            status: 'success',
            message: 'API is running',
            version: '1.0.0',
            endpoints: {
                proyectos: '/api/proyectos',
                transacciones: '/api/transacciones'
            }
        });
    });

    // Configurar rutas con la base de datos
    app.use('/api/proyectos', proyectosRoutes(db));
    app.use('/api/transacciones', transaccionesRoutes(db));
};

// Conexión a MongoDB
const connectDB = async () => {
    const MONGO_URI = process.env.MONGO_URI;
    
    if (!MONGO_URI) {
        console.error(chalk.red('❌ Error: MONGO_URI no está definida en las variables de entorno'));
        process.exit(1);
    }

    try {
        const client = await MongoClient.connect(MONGO_URI);
        db = client.db('finanzas');
        console.log(chalk.green('✅ Conectado a MongoDB'));
        return db;
    } catch (error) {
        console.error(chalk.red('❌ Error conectando a MongoDB:', error.message));
        process.exit(1);
    }
};

// Inicialización del servidor
const startServer = async () => {
    try {
        await connectDB();
        configureSecurity();
        configureMiddleware();
        configureRoutes();

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(chalk.blue('========================================='));
            console.log(chalk.green(`🚀 Servidor corriendo en puerto ${PORT}`));
            console.log(chalk.blue('========================================='));
            console.log(chalk.yellow('📡 Endpoints disponibles:'));
            console.log(chalk.cyan('   - /api/proyectos'));
            console.log(chalk.cyan('   - /api/transacciones'));
            console.log(chalk.blue('========================================='));
        });
    } catch (error) {
        console.error(chalk.red('❌ Error al iniciar el servidor:', error.message));
        process.exit(1);
    }
};

// Iniciar la aplicación
startServer(); 