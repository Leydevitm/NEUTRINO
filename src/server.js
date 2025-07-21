const express = require('express');
const { createServer } = require('http');
const { dbConnection } = require('./database/config');
const dotenv = require('dotenv');
dotenv.config();

class Server{

    constructor(){
        this.app = require('express')();
        this.port = process.env.PORT || 8080;
        this.server = createServer(this.app);

        this.paths={
            sms:'/api/sms/'
        };

        //Conexion a la base de datos 
        this.conectarDB();

        //Middlewares
        this.middlewares();

        //Rutas
        this.routes();
    }

     async conectarDB() {
        await dbConnection();
    }


    middlewares(){

    }

    routes(){

    }

    listen() {
        this.server.listen(this.port, () => {
            console.log('Servidor corriendo en puerto', this.port);
            
        });
    }

    
}

module.exports=Server;