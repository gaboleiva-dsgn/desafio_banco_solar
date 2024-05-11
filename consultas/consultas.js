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
    console.log("Valores recibidos: ", nombre, balance);
    try {
        const result = await pool.query({
            text: 'INSERT INTO usuarios (nombre, balance) VALUES ($1, $2) RETURNING *',
            values: [nombre, balance]
        });
        console.log("Registro agregado: ", result.rows[0]);
        return result.rows[0];
    } catch (error) {
        return manejoErrores(error, pool, tabla);
    }
};

async function todos() {
    const result = await pool.query('SELECT * FROM usuarios');
    return result.rows;
}

async function editar (id, nombre, balance) {
    try {
        const result = await pool.query('UPDATE usuarios SET nombre = $1, balance = $2 WHERE id = $3 RETURNING *', [nombre, balance, id]);
        return result.rows[0];
    } catch (error) {
        return manejoErrores(error, pool, tabla);
    }
};

async function eliminar(id) {
    try {
        const result = await pool.query("DELETE FROM usuarios WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length > 0) {
            return { mensaje: `El usuario con ID ${id} se ha eliminado` };
        } else {
            return { mensaje: 'El usuario no se eliminó correctamente o no existe.' };
        }
    } catch (error) {
        return manejoErrores(error, pool, tabla);
    }
}

async function transferir (emisor, receptor, monto) {
    console.log("Valores recibidos: ", emisor, receptor, monto);
    try {
        await pool.query('BEGIN');

        await pool.query('UPDATE usuarios SET balance = balance - $1 WHERE id = $2', [monto, emisor]);

        await pool.query('UPDATE usuarios SET balance = balance + $1 WHERE id = $2', [monto, receptor]);

        const fecha = new Date();

        await pool.query('INSERT INTO transferencias (emisor, receptor, monto, fecha) VALUES ($1, $2, $3, $4)', [emisor, receptor, monto, fecha]);

        await pool.query('COMMIT');
        return { mensaje: 'Transferencia exitosa' };
    } catch (error) {
        await pool.query('ROLLBACK');
        return manejoErrores(error, pool, tabla);
    }
};

async function mostrarTransferencias () {
    const idPorNombre = `SELECT t.fecha, t.monto, e.nombre AS emisor, r.nombre AS receptor FROM transferencias t INNER JOIN usuarios e ON t.emisor = e.id INNER JOIN usuarios r ON t.receptor = r.id`;
    const result = await pool.query(idPorNombre);
    return result.rows;
}

export { agregar, todos, editar, eliminar, transferir, mostrarTransferencias };