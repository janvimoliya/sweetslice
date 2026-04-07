/* global require, module */
const express=require('express');
const router=express.Router();
const productcontroller=require('../controllers/product.controller');
router.get('/getall',productcontroller.getAll);
module.exports=router;