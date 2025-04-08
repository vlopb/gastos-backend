const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Esquema para proyectos
const proyectoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    descripcion: {
        type: String,
        default: ''
    },
    fecha_creacion: {
        type: Date,
        default: Date.now
    },
    transacciones: [{
        descripcion: String,
        tipo: {
            type: String,
            enum: ['ingreso', 'gasto'],
            required: true
        },
        monto: {
            type: Number,
            required: true
        },
        fecha: {
            type: Date,
            default: Date.now
        }
    }]
});

const Proyecto = mongoose.model('Proyecto', proyectoSchema);

// GET todos los proyectos
router.get('/', async (req, res) => {
    try {
        console.log('Obteniendo proyectos...');
        const proyectos = await Proyecto.find().sort({ fecha_creacion: -1 });
        console.log('Proyectos encontrados:', proyectos.length);
        res.json(proyectos);
    } catch (error) {
        console.error('Error al obtener proyectos:', error);
        res.status(500).json({ 
            error: 'Error al obtener proyectos',
            mensaje: error.message 
        });
    }
});

// POST nuevo proyecto
router.post('/', async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        
        if (!nombre) {
            return res.status(400).json({
                error: 'El nombre del proyecto es requerido'
            });
        }

        const nuevoProyecto = new Proyecto({
            nombre,
            descripcion: descripcion || '',
            transacciones: []
        });
        
        const proyectoGuardado = await nuevoProyecto.save();
        res.status(201).json({
            mensaje: 'Proyecto creado con éxito',
            proyecto: proyectoGuardado
        });
    } catch (error) {
        console.error('Error al crear proyecto:', error);
        res.status(500).json({ 
            error: 'Error al crear proyecto',
            mensaje: error.message 
        });
    }
});

// GET proyecto por ID
router.get('/:id', async (req, res) => {
    try {
        const proyecto = await Proyecto.findById(req.params.id);
        if (!proyecto) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }
        res.json(proyecto);
    } catch (error) {
        console.error('Error al obtener proyecto:', error);
        res.status(500).json({ 
            error: 'Error al obtener proyecto',
            mensaje: error.message 
        });
    }
});

// PUT actualizar proyecto
router.put('/:id', async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        const proyecto = await Proyecto.findByIdAndUpdate(
            req.params.id,
            { nombre, descripcion },
            { new: true, runValidators: true }
        );
        
        if (!proyecto) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }
        
        res.json({
            mensaje: 'Proyecto actualizado con éxito',
            proyecto
        });
    } catch (error) {
        console.error('Error al actualizar proyecto:', error);
        res.status(500).json({ 
            error: 'Error al actualizar proyecto',
            mensaje: error.message 
        });
    }
});

// DELETE proyecto
router.delete('/:id', async (req, res) => {
    try {
        const proyecto = await Proyecto.findByIdAndDelete(req.params.id);
        if (!proyecto) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }
        res.json({ 
            mensaje: 'Proyecto eliminado con éxito',
            proyecto
        });
    } catch (error) {
        console.error('Error al eliminar proyecto:', error);
        res.status(500).json({ 
            error: 'Error al eliminar proyecto',
            mensaje: error.message 
        });
    }
});

// POST nueva transacción a un proyecto
router.post('/:id/transacciones', async (req, res) => {
    try {
        const { descripcion, tipo, monto, fecha } = req.body;
        
        if (!descripcion || !tipo || !monto) {
            return res.status(400).json({
                error: 'Descripción, tipo y monto son requeridos'
            });
        }

        const proyecto = await Proyecto.findById(req.params.id);
        if (!proyecto) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }

        proyecto.transacciones.push({
            descripcion,
            tipo: tipo.toLowerCase(),
            monto: Number(monto),
            fecha: fecha || new Date()
        });

        await proyecto.save();
        res.status(201).json({
            mensaje: 'Transacción agregada con éxito',
            proyecto
        });
    } catch (error) {
        console.error('Error al agregar transacción:', error);
        res.status(500).json({ 
            error: 'Error al agregar transacción',
            mensaje: error.message 
        });
    }
});

module.exports = router; 