const express = require('express');
const router = express.Router();
const Cita = require('../models/Cita');

// Obtener todas las citas
router.get('/', async (req, res) => {
    try {
        const citas = await Cita.find().sort({ fecha: -1 });
        res.json(citas);
    } catch (error) {
        console.error('Error al obtener citas:', error);
        res.status(500).json({ 
            mensaje: 'Error al obtener las citas', 
            error: error.message
        });
    }
});

// Crear una nueva cita
router.post('/', async (req, res) => {
    try {
        const { 
            cliente, 
            servicio, 
            fecha, 
            hora, 
            duracion, 
            monto, 
            estado, 
            recordatorio,
            ubicacion,
            tipoPiano 
        } = req.body;

        // Convertir el monto a número
        const montoNumerico = parseFloat(monto);
        if (isNaN(montoNumerico)) {
            return res.status(400).json({ 
                mensaje: 'El monto debe ser un número válido'
            });
        }

        const nuevaCita = new Cita({
            cliente,
            servicio,
            fecha: new Date(fecha),
            hora,
            duracion: parseInt(duracion),
            monto: montoNumerico,
            estado: estado || 'pendiente',
            recordatorio,
            ubicacion,
            tipoPiano
        });

        const citaGuardada = await nuevaCita.save();
        res.status(201).json(citaGuardada);
    } catch (error) {
        console.error('Error al crear cita:', error);
        res.status(400).json({ 
            mensaje: 'Error al guardar la cita', 
            error: error.message
        });
    }
});

// Obtener una cita específica
router.get('/:id', async (req, res) => {
    try {
        const cita = await Cita.findById(req.params.id);
        if (!cita) {
            return res.status(404).json({ mensaje: 'Cita no encontrada' });
        }
        res.json(cita);
    } catch (error) {
        console.error('Error al obtener cita:', error);
        res.status(500).json({ 
            mensaje: 'Error al obtener la cita', 
            error: error.message 
        });
    }
});

// Actualizar una cita
router.put('/:id', async (req, res) => {
    try {
        const { 
            cliente, 
            servicio, 
            fecha, 
            hora, 
            duracion, 
            monto, 
            estado, 
            recordatorio,
            ubicacion,
            tipoPiano 
        } = req.body;

        // Convertir el monto a número
        const montoNumerico = parseFloat(monto);
        if (isNaN(montoNumerico)) {
            return res.status(400).json({ 
                mensaje: 'El monto debe ser un número válido'
            });
        }

        const citaActualizada = await Cita.findByIdAndUpdate(
            req.params.id,
            {
                cliente,
                servicio,
                fecha: new Date(fecha),
                hora,
                duracion: parseInt(duracion),
                monto: montoNumerico,
                estado,
                recordatorio,
                ubicacion,
                tipoPiano
            },
            { new: true, runValidators: true }
        );

        if (!citaActualizada) {
            return res.status(404).json({ mensaje: 'Cita no encontrada' });
        }
        res.json(citaActualizada);
    } catch (error) {
        console.error('Error al actualizar cita:', error);
        res.status(400).json({ 
            mensaje: 'Error al actualizar la cita', 
            error: error.message 
        });
    }
});

// Eliminar una cita
router.delete('/:id', async (req, res) => {
    try {
        const cita = await Cita.findByIdAndDelete(req.params.id);
        if (!cita) {
            return res.status(404).json({ mensaje: 'Cita no encontrada' });
        }
        res.json({ mensaje: 'Cita eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar cita:', error);
        res.status(500).json({ 
            mensaje: 'Error al eliminar la cita', 
            error: error.message 
        });
    }
});

module.exports = router; 