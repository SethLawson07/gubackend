import { Request, Response } from "express";
import { ObjectId } from "bson";
import { prisma } from "../server";
import { geneObjectId } from "../utils";
import {z} from "zod"
import { fromZodError } from "zod-validation-error";

export async function  addBook(req:Request,res:Response){
    try {
        let  cretedAt_schema = z.string().regex(new RegExp(/^\d{4}-\d{2}-\d{2}$/),'la date doit etre dans le format 1987-12-24 ');
         let validation_result =  cretedAt_schema.safeParse(req.body.createdAt)
         if (!validation_result.success) {
            return res.status(400).send({ status: 400, message: fromZodError(validation_result.error).details[0].message, error: true })
        }
        let date = new Date(validation_result.data)
        let book = {
            sheets:addSheets(12,date),
            status:"notopen",
            createdAt:date
        }
        let data = await prisma.book.create({
            data:book
        })

        return res.status(201).send({status:201,error: false, message:'sucess',data:{
            book:data
        }})


    } catch (err) {
        console.error(`Error while registering ${err}`)
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} })
    }
}





function addCases(nbr:number){
    let cases = []
    for (let i = 1; i <= nbr; i++) {
        cases.push({ id:geneObjectId(),index:i,contributionStatus:"unpaid" })
    }
    return cases
}

function addSheets(nbr:number,date:Date){
    let sheets = []
    for (let i = 1; i <= nbr; i++) {
        sheets.push({id:geneObjectId(),index:i,cases:addCases(31),bet:1,status:"notopen",createdAt:date})
    }
    return sheets
}