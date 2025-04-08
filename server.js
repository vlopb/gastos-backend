const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const chalk = require('chalk');
require('dotenv').config();

const proyectosRoutes = require('./routes/proyectos');
const transaccionesRoutes = require('./routes/transacciones');
const citasRoutes = require('./routes/citas');

const app = express();

// Configuración de seguridad y CORS
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Configuración de middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Headers adicionales para CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle OPTIONS method
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Rutas básicas
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
            transacciones: '/api/transacciones',
            citas: '/api/citas'
        }
    });
});

// Configurar rutas
app.use('/api/proyectos', proyectosRoutes);
app.use('/api/transacciones', transaccionesRoutes);
app.use('/api/citas', citasRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(chalk.red('Error:', err));
    res.status(500).json({
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
    });
});

// Conexión a MongoDB
const connectDB = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://vic:Daiana01.@cluster0.qlghn.mongodb.net/finanzas';
        
        if (!MONGO_URI) {
            console.error(chalk.red('❌ Error: MONGO_URI no está definida en las variables de entorno'));
            process.exit(1);
        }

        await mongoose.connect(MONGO_URI);
        console.log(chalk.green('✅ Conectado a MongoDB'));
    } catch (error) {
        console.error(chalk.red('❌ Error conectando a MongoDB:', error.message));
        process.exit(1);
    }
};

// Inicialización del servidor
const startServer = async () => {
    try {
        await connectDB();

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(chalk.blue('========================================='));
            console.log(chalk.green(`🚀 Servidor corriendo en puerto ${PORT}`));
            console.log(chalk.blue('========================================='));
            console.log(chalk.yellow('📡 Endpoints disponibles:'));
            console.log(chalk.cyan('   - /api/proyectos'));
            console.log(chalk.cyan('   - /api/transacciones'));
            console.log(chalk.cyan('   - /api/citas'));
            console.log(chalk.blue('========================================='));
        });
    } catch (error) {
        console.error(chalk.red('❌ Error al iniciar el servidor:', error.message));
        process.exit(1);
    }
};

startServer(); 