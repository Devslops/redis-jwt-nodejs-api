let express = require('express')
var cors = require('cors')
let app = express()
let userRoutes = require('./routes/user')

let mongoose = require('mongoose')
app.use(cors());

//Autorisation des méthodes de communication
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    next();
})

//Connexion BDD
mongoose.Promise = Promise
mongoose.connect('mongodb://dbadmin:root@localhost:27017/db1', { useNewUrlParser: true, useUnifiedTopology: true })

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {
    console.log("Connexion OK");
});

//Traitement header
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

//Ajout des routes /
app.use('/', userRoutes)
app.use('/user', userRoutes)


//Ecoute des requêtes provenant du port
app.listen(3000, 'localhost', () => {
    console.log("Serveur on sur le port 3000")
})

