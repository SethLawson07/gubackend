import { Request, Response } from "express";
import { ObjectId } from "bson";
import { prisma } from "../server";
import { geneObjectId, randomNumber, randomString } from "../utils";
import { z } from "zod"
import { fromZodError } from "zod-validation-error";

export async function addBook(req: Request, res: Response) {
    try {
        let book_data_schema = z.object({
            createdAt: z.string().regex(new RegExp(/^\d{4}-\d{2}-\d{2}$/), 'la date doit etre dans le format 1987-12-24 '),
            user_id: z.string()
        })
        let validation_result = book_data_schema.safeParse(req.body)
        if (!validation_result.success) {
            return res.status(400).send({ status: 400, message: fromZodError(validation_result.error).details[0].message, error: true })
        }
        let { createdAt, user_id } = validation_result.data
        let date = new Date(createdAt)
        let book = {
            sheets: addSheets(12, date),
            status: "notopen",
            createdAt: date,
            customerId: user_id,
            bookNumber: `CARNET-${randomString(5)}${randomNumber(5)}`
        }
        let data = await prisma.book.create({
            data: book
        })

        return res.status(201).send({
            status: 201, error: false, message: 'sucess', data: {
                book: data
            }
        })


    } catch (err) {
        console.error(`Error while registering ${err}`)
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} })
    }
}

export async function activeBook(req: Request, res: Response) {
    try {
        let active_data_schema = z.object({
            book_id: z.string()
        })

        let validation_result = active_data_schema.safeParse(req.body)
        if (!validation_result.success) {
            return res.status(400).send({ status: 400, message: fromZodError(validation_result.error).details[0].message, error: true })
        }
        let {book_id} = validation_result.data

        let data = await prisma.book.update({
            where:{
                id:book_id
            },
            data:{
                status:"opened"
            }
        })

        return res.status(201).send({
            status: 200, error: false, message: 'sucess', data: {
                book: data
            }
        })

    } catch (err) {
        console.error(`Error while registering ${err}`)
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} })
    }
}

export async function activeSheet(req: Request, res: Response){
    try {
        let active_data_schema = z.object({
            openedAt:z.string().regex(new RegExp(/^\d{4}-\d{2}-\d{2}$/), 'la date doit etre dans le format 1987-12-24 '),
            book_id:z.string(),
            sheet_id:z.string(),
            bet:z.number().min(300)
        })
        let validation_result = active_data_schema.safeParse(req.body)
        if (!validation_result.success) {
            return res.status(400).send({ status: 400, message: fromZodError(validation_result.error).details[0].message, error: true })
        }

        return   res.status(200).send({ status: 200, error: false, message: "pas encore activer", data: {} })
        
    } catch (err) {
        console.error(`Error while registering ${err}`)
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} })
    }
}


function addCases(nbr: number) {
    let cases = []
    for (let i = 1; i <= nbr; i++) {
        cases.push({ id: geneObjectId(), index: i, contributionStatus: "unpaid" })
    }
    return cases
}

function addSheets(nbr: number, date: Date) {
    let sheets = []
    for (let i = 1; i <= nbr; i++) {
        sheets.push({ id: geneObjectId(), index: i, cases: addCases(31), status: "notopen", createdAt: date })
    }
    return sheets
}