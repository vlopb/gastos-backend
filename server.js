const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const proyectosRoutes = require('./routes/proyectos');
const transaccionesRoutes = require('./routes/transacciones');


const app = express();
app.use(cors());
app.use(express.json());

// Conexión MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://vic:Daiana01.@cluster0.qlghn.mongodb.net/?retryWrites=true&w=majority';
let db;

async function connectDB() {
    try {
        const client = await MongoClient.connect(MONGO_URI);
        db = client.db('finanzas');
        console.log('Conectado a MongoDB');
        
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