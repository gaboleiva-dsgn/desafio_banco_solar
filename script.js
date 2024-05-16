// Importamos el módulo de express y creamos una instancia de express.
import express from 'express';
const app = express();
// Definimos el puerto en el que va a escuchar el servidor.
const PORT = 3000;
// Levantamos el servidor en el puerto definido.
app.listen(PORT, () => {
    console.log(`Servidor Express levantado y escuchando por el puerto ${PORT}`);
});

// Importamos funciones de errores/moduloErrores.js
import { manejoErrores } from './errores/moduloErrores.js';

// Importamos funciones de consulta/consulta.js 
import { agregar, todos, editar, eliminar, transferir, mostrarTransferencias, obtenerSaldo } from './consultas/consultas.js';

// Middleware 
app.use(express.json());

// Middleware para manejar errores.
const controlErrores = (error, req, res, next) => {
    if (error.code) {
      const { errorCode, status, message } = manejoErrores(error.code);
      console.error("Error:", errorCode, "-", message);
      res.status(status).json({ error: message });
    } else {
      console.error("Error:", error.message);
      res.status(500).json({ error: "Error genérico del servidor" });
    }
  };

// Creamos una ruta raíz que devuelve un archivo (index.html)
app.get("/", (req, res) => {
    res.sendFile("index.html", { root: "./" });
})

// Ruta que agrega un usuario a la base de datos.
app.post("/usuario", async (req, res, next) => {
    const { nombre, balance } = req.body;
    if (!nombre || !balance) {
        res.status(400).json({ mensaje: "Debe ingresar todos los datos" });
    } 
    try {
        const result = await agregar(nombre, balance);
        res.send(result);
    } catch (error) {
        next(error);
    }
            
    
});

// Ruta que devuelve todos los registros de la tabla usuarios.
app.get("/usuarios", async (req, res, next) => {
    try {
        const result = await todos();
        res.send(result);
    } catch (error) {
        next(error);
    }
});

// Ruta que recibe los datos modificados de un usuario y los actualiza en la base de datos.
app.put("/usuario", async (req, res, next) => {
    const { id, nombre, balance } = req.body;
    try {
        const result = await editar(id, nombre, balance);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// Eliminar
app.delete("/usuario", async (req, res, next) => {
    const { id } = req.query;
    try {
        const result = await eliminar(id);
        console.log("Respuesta de la función eliminar: ", result);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// transferencia 
app.post("/transferencia", async (req, res, next) => {
    //console.log("Valores recibidos: ", req.body);
    const { emisor, receptor, monto } = req.body;
    if (!emisor ||!receptor ||!monto) {
        res.status(400).json({ mensaje: "Debe ingresar todos los datos" });
    }
    try {
        const saldoEmisor = await obtenerSaldo(emisor);
        if (saldoEmisor < monto) {
            return res.status(400).json({ mensaje: "No hay suficiente saldo del emisor para hacer la transferencia" });
            res.send(error);
        }
        const result = await transferir(emisor, receptor, monto);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// mostras transferencias
app.get("/transferencias", async (req, res, next) => {
    try {
        const result = await mostrarTransferencias();
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// ruta generica
app.get("*", (req, res) => {
    res.send("Esta página no existe!!");
});

app.use(controlErrores);