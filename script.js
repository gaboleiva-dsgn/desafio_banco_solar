// Importamos el módulo de express y creamos una instancia de express.
import express from 'express';
const app = express();
// Definimos el puerto en el que va a escuchar el servidor.
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor Express levantado y escuchando por el puerto ${PORT}`);
});

// Importamos funciones de consulta/consulta.js 
import { agregar, todos, editar, eliminar, transferir, mostrarTransferencias } from './consultas/consultas.js';

// Middleware 
app.use(express.json());

// Creamos una ruta raíz que devuelve un archivo (index.html)
app.get("/", (req, res) => {
    res.sendFile("index.html", { root: "./" });
})

// Ruta que agrega un usuario a la base de datos.
app.post("/usuario", async (req, res) => {
    const { nombre, balance } = req.body;
    try {
        const result = await agregar(nombre, balance);
        res.send(result);
    } catch (error) {
    res.send(error);    
    }
});

// Ruta que devuelve todos los registros de la tabla usuarios.
app.get("/usuarios", async (req, res) => {
    try {
        const result = await todos();
        res.send(result);
    } catch (error) {
        res.send(error);
    }
});

// Ruta que recibe los datos modificados de un usuario y los actualiza en la base de datos.
app.put("/usuario", async (req, res) => {
    const { id, nombre, balance } = req.body;
    try {
        const result = await editar(id, nombre, balance);
        res.json(result);
    } catch (error) {
        res.json(error);
    }
});

// Eliminar
app.delete("/usuario", async (req, res) => {
    const { id } = req.query;
    try {
        const result = await eliminar(id);
        console.log("Respuesta de la función eliminar: ", result);
        res.json(result);
    } catch (error) {
        res.send(error);
    }
});

// transferencia 
app.post("/transferencia", async (req, res) => {
    console.log("Valores recibidos: ", req.body);
    const { emisor, receptor, monto } = req.body;
    try {
        const result = await transferir(emisor, receptor, monto);
        res.json(result);
    } catch (error) {
        res.json(error);
    }
});

// mostras transferencias
app.get("/transferencias", async (req, res) => {
    try {
        const result = await mostrarTransferencias();
        res.json(result);
    } catch (error) {
        res.json(error);
    }
});