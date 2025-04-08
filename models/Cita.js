const mongoose = require('mongoose');

const citaSchema = new mongoose.Schema({
    cliente: {
        type: String,
        required: true
    },
    servicio: {
        type: String,
        required: true
    },
    fecha: {
        type: Date,
        required: true
    },
    hora: {
        type: String,
        required: true
    },
    duracion: {
        type: Number,
        required: true
    },
    monto: {
        type: Number,
        required: true
    },
    estado: {
        type: String,
        enum: ['pendiente', 'completada', 'cancelada'],
        default: 'pendiente'
    },
    recordatorio: {
        type: String,
        required: true
    },
    ubicacion: {
        type: String,
        required: true
    },
    tipoPiano: {
        type: String,
        required: true,
        enum: ['vertical', 'cola', 'digital']
    }
}, {
    timestamps: true,
    collection: 'citas'
});

module.exports = mongoose.models.Cita || mongoose.model('Cita', citaSchema); 