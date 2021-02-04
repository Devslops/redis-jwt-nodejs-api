let express = require('express')
var router = express.Router()
const jwtUtils = require('../utils/jwt.utils')
let validator = require("email-validator");
const sha256 = require('sha256')
let redis = require('redis')

let userModel = require('../models/users')

//Connexion to Redis
let client    = redis.createClient({
    port: 6379,               // replace with your port
    host: 'localhost',        // replace with your hostanme or IP address
});
client.on("error", function(error) {
    console.error(error);
});

//Enregistrement de l'utilisateur
router.post('/user/register', (req,res) => {
    let email = req.body.email;
    let name = req.body.name;
    let password = req.body.password;
    let isAdmin = req.body.isAdmin;
    let address1 = req.body.address1;
    let address2 = req.body.address2;
    let pays = req.body.pays; 
    let ville = req.body.ville;
    let zip = req.body.zip;

    if(email == null || name == null || password == null) {
        return res.status(400).json({'erreur': 'paramètres manquants'})
    }
    //Si l'email est valide
    if(validator.validate(email)) {
        console.log(email)
        userModel.findOne({ 
            email: true,
            "email":email
        })
        .then((userFound) => {
            //Utlisateur n'existe pas
            if (!userFound) {
                //Hash du mdp
                let hashedPassword = sha256(password)
                    let newUser = userModel.create({
                        email: email,
                        name: name,
                        isAdmin: isAdmin,
                        password: hashedPassword,
                        address1: address1,
                        address2: address2,
                        pays: pays,
                        ville: ville,
                        zip: zip
                    })
                    .then(function(newUser) {
                        //Utilisateur créer
                        return res.status(201).json({
                            'userId': newUser.id
                        })
                    })
                    .catch((err) => {
                        return res.status(500).json({ 'erreur': "impossible d'ajouter l'utilisateur"})
                });
            } else {
                return res.status(409).json({'erreur': "l'utilisateur existe déjà"})
            }
        })
        .catch((err) => {
            return res.status(500).json({ 'erreur': 'Erreur de communication avec la bdd' + err})
        });
        
    } else {
        return res.status(400).json({'erreur': 'email invalide'})
    }

});

//Connexion de l'utilisateur
router.post('/user/login', (req,res) => {
    let email = req.body.email

    //Check existance user
    userModel.findOne({ 
        "email":email
    })
    .then((userFound) => {
        //Utilisateur existe
        if(userFound) {
            client.get(userFound.id, (err, reply) => {
                if (err) {
                    console.log(err)
                }
                let token = reply
                if (!token) {
                    token = jwtUtils.generateToken(userFound)
                    client.set(userFound.id, token, 'EX', 60*60, redis.print)
                }
                //Retourne l'id et le token du user
                return res.status(200).json({
                    'userId': userFound.id,
                    'token': token
                });
            })
        } else {
            return res.status(404).json({ 'erreur': "utilisateur n'existe pas"})
        }
    })
    .catch ((error) => {
        return res.status(500).json({ 'erreur': "impossible de connecter l'utilisateur :" + error})
    });
});

//Récupérer les infos de l'utilisateur via le token
router.get('/user/myinfo', jwtUtils.verifyToken, (req,res) => {

    //En-tête d'autorisation
    var userId = req.userInfo.userId
    
    //Si le token est invalide
    if(userId == null)
        return res.status(400).json({ 'erreur': 'Token invalide'})

    //Récupérer l'utilisateur via l'id user du token
    userModel.findOne({
        _id: userId
    })
    .then((user) => {
        //Si l'utilisateur existe
        if(user) 
            res.status(201).json(user);
         else 
            res.status(404).json({'erreur': 'utilisateur introuvable'})
    })
})

module.exports = router;