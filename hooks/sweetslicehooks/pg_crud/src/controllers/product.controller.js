/* global require, module */
const productservice=require('../services/product.service');
module.exports={
    getAll
}

async function getAll(req,res){
    const rows=await productservice.productFetchAll();
    res.status(201).json(rows);
}