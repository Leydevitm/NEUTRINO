const express = require('express');
const { createServer } = require('http');
const { dbConnection } = require('./database/config');
const  authMiddleware  =require( './middlewares/basicAuth');
const dotenv = require('dotenv');
dotenv.config();
const smsRoutes = require('./routes/sms');

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
       
    this.app.use(express.json());
    this.app.use( authMiddleware );

    }

    routes(){
        this.app.use(this.paths.sms,smsRoutes)

    }
    

    listen() {
        this.server.listen(this.port, () => {
            console.log('Servidor corriendo en puerto', this.port);
            
        });
    }

    
}

module.exports=Server;