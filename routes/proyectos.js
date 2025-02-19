const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

module.exports = (db) => {
    // GET todos los proyectos
    router.get('/', async (req, res) => {
        try {
            console.log('Obteniendo proyectos...');
            const proyectos = await db.collection('proyectos').find({}).toArray();
            console.log('Proyectos encontrados:', proyectos.length);
            res.json(proyectos);
        } catch (error) {
            console.error('Error al obtener proyectos:', error);
            res.status(500).json({ 
                error: 'Error al obtener proyectos',
                details: error.message 
            });
        }
    });

    // POST nuevo proyecto
    router.post('/', async (req, res) => {
        try {
            const nuevoProyecto = {
                nombre: req.body.nombre,
                descripcion: req.body.descripcion || '',
                fecha_creacion: new Date(),
                transacciones: []
            };
            
            const result = await db.collection('proyectos').insertOne(nuevoProyecto);
            res.status(201).json({
                mensaje: 'Proyecto creado con éxito',
                proyecto: { ...nuevoProyecto, _id: result.insertedId }
            });
        } catch (error) {
            console.error('Error al crear proyecto:', error);
            res.status(500).json({ 
                error: 'Error al crear proyecto',
                details: error.message 
            });
        }
    });

    // GET proyecto por ID
    router.get('/:id', async (req, res) => {
        try {
            if (!ObjectId.isValid(req.params.id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const proyecto = await db.collection('proyectos').findOne({ 
                _id: new ObjectId(req.params.id) 
            });
            if (!proyecto) {
                return res.status(404).json({ error: 'Proyecto no encontrado' });
            }
            res.json(proyecto);
        } catch (error) {
            res.status(500).json({ error: 'Error al obtener proyecto' });
        }
    });

    // DELETE proyecto
    router.delete('/:id', async (req, res) => {
        try {
            if (!ObjectId.isValid(req.params.id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const result = await db.collection('proyectos').deleteOne({ 
                _id: new ObjectId(req.params.id) 
            });
            if (result.deletedCount === 0) {
                return res.status(404).json({ error: 'Proyecto no encontrado' });
            }
            res.json({ mensaje: 'Proyecto eliminado con éxito' });
        } catch (error) {
            res.status(500).json({ error: 'Error al eliminar proyecto' });
        }
    });

    return router;
}; 