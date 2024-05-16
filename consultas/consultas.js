import pkg from 'pg';
import 'dotenv/config';
const { Pool } = pkg;
import { manejoErrores } from '../errores/moduloErrores.js';

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});
async function agregar(nombre, balance) {
    const tabla = "usuarios";
    console.log("Valores recibidos: ", nombre, balance);
    try {
        const result = await pool.query({
            text: `INSERT INTO ${tabla} (nombre, balance) VALUES ($1, $2) RETURNING *`,
            values: [nombre, balance]
        });
        console.log("Registro agregado: ", result.rows[0]);
        return result.rows[0];
    } catch (error) {
        // console.log(error);  // pinta el error completo
        throw error;
    }
};

async function todos() {
    const result = await pool.query('SELECT * FROM usuarios');
    return result.rows;
}

async function editar(id, nombre, balance) {
    try {
        const result = await pool.query({
            text: 'UPDATE usuarios SET nombre = $1, balance = $2 WHERE id = $3 RETURNING *',
            values: [nombre, balance, id]
        });
        if (result.rows.length > 0) {
            return { mensaje: `El usuario con id ${id} se ha eliminado con exito!!`, status: 200 };
        } else {
            return { mensaje: 'El usuario no existe o no se puede eliminar.', status: 404 };
        }
    } catch (error) {
        console.error("Error al eliminar el usuario:", error);
        return { mensaje: 'Error genérico del servidor', status: 500 };
    }
};

async function eliminar(id) {
    try {
        await pool.query('BEGIN');

        // Verificamos si el usuario tiene transferencias asociadas
        const existTrans = await pool.query("SELECT COUNT(*) FROM transferencias WHERE emisor = $1 OR receptor = $1", [id]);
        const countTrans = parseInt(existTrans.rows[0].count);
        if (countTrans > 0) {
            return { mensaje: `El usuario tiene ${countTrans} transferencia(s) asociada(s), por lo que no puede ser eliminado de la base de datos.` };
        }
        const result = await pool.query("DELETE FROM usuarios WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) {
            await pool.query('ROLLBACK');
            return { mensaje: `El usuario no se eliminó correctamente o no existe.` };
        }
        await pool.query('COMMIT');
        return { mensaje: `El usuario con ID ${id} se ha eliminado con exito!!` };
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error("Error al eliminar el usuario:", error);
        throw error;
    }
}

async function transferir(emisor, receptor, monto) {
    try {
        // obtenemos el saldo del emisor
        const saldoEmisor = await obtenerSaldo(emisor);
        // verificamos que el saldo del emisor sea mayor que el monto a transferir
        if (saldoEmisor < monto) {
            // si el saldo del emisor no es suficiente para hacer la transferencia retornamos un error
            return res.status(500).send({ message: `El emisor no posee sufuiciente saldo para hacer la transferencia` });
        }
        // comenzamos la transacción
        await pool.query('BEGIN');
        // actualizamos el saldo del emisor
        await pool.query('UPDATE usuarios SET balance = balance - $1 WHERE id = $2', [monto, emisor]);
        // actualizamos el saldo del receptor
        await pool.query('UPDATE usuarios SET balance = balance + $1 WHERE id = $2', [monto, receptor]);
        // obtenemos la fecha de la transferencia
        const fecha = new Date();
        // insertamos la transferencia
        await pool.query('INSERT INTO transferencias (emisor, receptor, monto, fecha) VALUES ($1, $2, $3, $4)', [emisor, receptor, monto, fecha]);
        // terminamos la transacción
        await pool.query('COMMIT');
        // retornamos el mensaje de transferencia exitosa
        return { mensaje: 'Transferencia exitosa' };
    } catch (error) {
        // hacemos un rollback en el transacción
        await pool.query('ROLLBACK');
        // retornamos el mensaje de error
        throw error
    }
};

async function mostrarTransferencias() {
    const idPorNombre = `SELECT t.fecha, t.monto, e.nombre AS emisor, r.nombre AS receptor FROM transferencias t INNER JOIN usuarios e ON t.emisor = e.id INNER JOIN usuarios r ON t.receptor = r.id`;
    const result = await pool.query(idPorNombre);
    return result.rows;
}

async function obtenerSaldo(id) {
    const { rows } = await pool.query("SELECT balance FROM usuarios WHERE id = $1", [id]);
    return rows[0].balance;
}

export { agregar, todos, editar, eliminar, transferir, mostrarTransferencias, obtenerSaldo };