const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

module.exports = (db) => {
    // GET todos los proyectos
    router.get('/', async (req, res) => {
        try {
            const proyectos = await db.collection('proyectos').find({}).toArray();
            res.json(proyectos);
        } catch (error) {
            res.status(500).json({ error: 'Error al obtener proyectos' });
        }
    });

    // POST nuevo proyecto
    router.post('/', async (req, res) => {
        try {
            const nuevoProyecto = {
                ...req.body,
                transacciones: []
            };
            const result = await db.collection('proyectos').insertOne(nuevoProyecto);
            res.status(201).json({ ...nuevoProyecto, _id: result.insertedId });
        } catch (error) {
            res.status(500).json({ error: 'Error al crear proyecto' });
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