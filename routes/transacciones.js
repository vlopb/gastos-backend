const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

module.exports = (db) => {
    // POST nueva transacción
    router.post('/:proyectoId/transacciones', async (req, res) => {
        let session;
        try {
            if (!ObjectId.isValid(req.params.proyectoId)) {
                return res.status(400).json({ error: 'ID inválido' });
            }

            const { descripcion, tipo, fecha, monto } = req.body;
            session = await db.client.startSession();
            
            let transaccionResponse;
            
            await session.withTransaction(async () => {
                // Obtener el proyecto
                const proyecto = await db.collection('proyectos').findOne(
                    { _id: new ObjectId(req.params.proyectoId) },
                    { session }
                );

                if (!proyecto) {
                    throw new Error('Proyecto no encontrado');
                }

                const index = proyecto.transacciones ? proyecto.transacciones.length : 0;
                
                const nuevaTransaccion = {
                    descripcion,
                    tipo: tipo.toLowerCase(),
                    fecha,
                    monto: parseFloat(monto),
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                const result = await db.collection('proyectos').updateOne(
                    { _id: new ObjectId(req.params.proyectoId) },
                    { 
                        $push: { transacciones: nuevaTransaccion },
                        $set: { updatedAt: new Date() }
                    },
                    { session }
                );

                if (result.modifiedCount === 0) {
                    throw new Error('No se pudo agregar la transacción');
                }

                transaccionResponse = {
                    mensaje: 'Transacción agregada con éxito',
                    transaccion: { ...nuevaTransaccion, index },
                    timestamp: new Date()
                };
            });

            // Enviar respuesta después de que la transacción se complete
            return res.json(transaccionResponse);

        } catch (error) {
            console.error('Error al agregar transacción:', error);
            return res.status(error.message.includes('ID inválido') ? 400 : 500).json({
                error: 'Error al agregar transacción',
                details: error.message
            });
        } finally {
            if (session) {
                await session.endSession();
            }
        }
    });

    // PUT/PATCH para actualizar una transacción
    router.put('/:proyectoId/transacciones/:index', async (req, res) => {
        try {
            if (!ObjectId.isValid(req.params.proyectoId)) {
                return res.status(400).json({ error: 'ID de proyecto inválido' });
            }

            const { descripcion, tipo, fecha, monto } = req.body;
            const index = parseInt(req.params.index);

            const result = await db.collection('proyectos').updateOne(
                { _id: new ObjectId(req.params.proyectoId) },
                { 
                    $set: {
                        [`transacciones.${index}`]: {
                            descripcion,
                            tipo,
                            fecha,
                            monto: parseFloat(monto)
                        }
                    }
                }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({ error: 'Proyecto no encontrado' });
            }

            if (result.modifiedCount === 0) {
                return res.status(500).json({ error: 'No se pudo actualizar la transacción' });
            }

            res.json({ 
                mensaje: 'Transacción actualizada con éxito',
                transaccion: { descripcion, tipo, fecha, monto, index }
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