const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

module.exports = (db) => {
    // POST nueva transacción
    router.post('/:proyectoId/transacciones', async (req, res) => {
        try {
            if (!ObjectId.isValid(req.params.proyectoId)) {
                return res.status(400).json({ error: 'ID inválido' });
            }

            const { descripcion, tipo, fecha, monto } = req.body;
            const nuevaTransaccion = {
                descripcion,
                tipo: tipo.toLowerCase(),
                fecha,
                monto: parseFloat(monto)
            };

            const result = await db.collection('proyectos').updateOne(
                { _id: new ObjectId(req.params.proyectoId) },
                { $push: { transacciones: nuevaTransaccion } }
            );

            if (result.modifiedCount === 0) {
                return res.status(500).json({ error: 'No se pudo agregar la transacción' });
            }

            res.json({ mensaje: 'Transacción agregada con éxito', transaccion: nuevaTransaccion });
        } catch (error) {
            res.status(500).json({ error: 'Error al agregar transacción' });
        }
    });

    // PUT/PATCH para actualizar una transacción
    router.put('/:proyectoId/transacciones/:transaccionId', async (req, res) => {
        try {
            if (!ObjectId.isValid(req.params.proyectoId)) {
                return res.status(400).json({ error: 'ID de proyecto inválido' });
            }

            const { descripcion, tipo, fecha, monto } = req.body;
            const transaccionId = parseInt(req.params.transaccionId);

            const result = await db.collection('proyectos').updateOne(
                { 
                    _id: new ObjectId(req.params.proyectoId),
                    'transacciones.id': transaccionId
                },
                { 
                    $set: {
                        'transacciones.$.descripcion': descripcion,
                        'transacciones.$.tipo': tipo,
                        'transacciones.$.fecha': fecha,
                        'transacciones.$.monto': parseFloat(monto)
                    }
                }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({ error: 'Transacción no encontrada' });
            }

            if (result.modifiedCount === 0) {
                return res.status(500).json({ error: 'No se pudo actualizar la transacción' });
            }

            res.json({ 
                mensaje: 'Transacción actualizada con éxito',
                transaccion: { descripcion, tipo, fecha, monto, id: transaccionId }
            });
        } catch (error) {
            console.error('Error al actualizar transacción:', error);
            res.status(500).json({ 
                error: 'Error al actualizar transacción',
                details: error.message 
            });
        }
    });

    return router;
}; 