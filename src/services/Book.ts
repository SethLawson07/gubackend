import { Request, Response } from "express";
import { ObjectId } from "bson";
import { prisma } from "../server";

export async function  addBook(req:Request,res:Response){
    try {
        let stringdate =  req.body.createdAt as string
        let date = new Date(stringdate)
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


function geneObjectId(){
    const id = new ObjectId()
    return id.toString()
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