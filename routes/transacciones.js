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

    return router;
}; 