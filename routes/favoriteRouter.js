const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('./cors');
const Favorites = require('../models/favorite');

const favoriteRouter = express.Router();
const authenticate = require('../authenticate');

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.corsWithOptions,authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({user: req.user._id})
    .populate('user')
    .populate('dishes')
    .then((user) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(user);
    }, (err) => next(err))
    .catch((err) => next(err));
})

.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user: req.user._id})
    .then((user) => {
        if (user) {
            for (const dish of req.body) {
                if (user.dishes.indexOf(dish._id) === -1 ){
                    user.dishes.push(dish._id);
                    user.save()
                        .then((user) => {
                            console.log('Favorite added for: ', user);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(user);
                        }, (err) => next(err)); 
                }

                else{
                    console.log("dish " + dish + " is already listed as a favorite!")
                    .then((user) => {
                        console.log('Favorite not added for: ', user);
                        res.statusCode = 403;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(user);
                    }, (err) => next(err)); 
                }
            };
        }
        else {
            Favorites.create({"user": req.user._id, "dishes": req.body})
            .then((user) => {
                console.log('Favorite Created for user: ', user);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(user);
            }, (err) => next(err));
        }
    }, (err) => next(err))
    .catch((err) => next(err));  
})

.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})

.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOneAndDelete({"user": req.user._id})
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
        console.log("User favorite deleted!")
    }, (err) => next(err))
    .catch((err) => next(err));   
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /favorites/'+ req.params.dishId);
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user: req.user._id})
    .then((user) => {
        if (user) {            
            if (user.dishes.indexOf(req.params.dishId) === -1) {
                user.dishes.push(req.params.dishId)
                user.save()
                .then((user) => {
                    console.log('Favorite Created for: ', user);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(user);
                }, (err) => next(err))
            }
            else {
                console.log("Target dish is already a favorite!")
                res.statusCode = 403;
            }
        }
        else {
            Favorites.create({"user": req.user._id, "dishes": [req.params.dishId]})
            .then((user) => {
                console.log('Favorite Created for: ', user);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(user);
            }, (err) => next(err))
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})

.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites/'+ req.params.dishId);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user: req.user._id})
    .then((user) => {
        if (user) {            
            let index = user.dishes.indexOf(req.params.dishId);
            if (index !== -1) {
            user.dishes.splice(index, 1);
            user.save()
                .then((user) => {
                    console.log('A Favorite Was Deleted From:', user);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(user);
                }, (err) => next(err));
            }
            else {
                err = new Error('Dish ' + req.params.dishId + ' not found');
                err.status = 404;
                return next(err);
            }
        }
        
        else {
            err = new Error('Favorites not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});


module.exports = favoriteRouter;