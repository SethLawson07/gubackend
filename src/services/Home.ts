import { User } from "@prisma/client";
import { Request, Response } from "express";
import { opened_sheet } from "../utils";
import { prisma } from "../server";

export async function siteHome(req: Request, res: Response) {
    try {
      const latestProducts = await prisma.product.findMany({
        orderBy: { createdat: 'desc' }, // Trier par date de création décroissante
        take: 15, // Limiter les résultats à 15 produits
      });
  
      const areaOne = await prisma.area.findMany({ where: { title: "one" },include:{Section:{include:{Product:true}}} });
      const areaTwo = await prisma.area.findMany({ where: { title: "two" },include:{Section:{include:{Product:true}}} });
      const services = await prisma.service.findMany({ where: { featured: true }, include: { TypeService: true } });
      const areaThree = await prisma.area.findMany({ where: { title: "three" },include:{Section:{include:{TypeService:true}}} });
      // const categories = await prisma.category.findMany({ where: { featured: true }, include: { SubCategory: { include: { Item: true } } } });
      const categories = await prisma.category.findMany({include:{SubCategory:{include:{Item:{include:{Product:true}}}}}})

      const responseData = {
        "latest": latestProducts,
        "areaOne": areaOne,
        "areaTwo": areaTwo,
        "services": services,
        "areaThree": areaThree,
        "categories": categories,
      };
  
      return res.status(200).send({ error: false, message: "ok", data: [responseData] });
    } catch (err) {
      console.error(`${err}`);
      return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " + err, data: {} });
    }
  }
  

export const customerHome = async (req: Request, res: Response) => {
    try {
        const { user } = req.body.user as { user: User };
        const sheet = await opened_sheet(user);
        const account = await prisma.account.findFirst({ where: { userId: user.id, type: "tontine" } });
        const banner = (await prisma.banner.findMany()).reverse();
        return res.status(200).send({ error: false, data: { ...sheet.data, book: sheet.book, account, banner, }, message: "ok" });
    } catch (err) {
        console.log(err); return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
}

export const agentHome = async (req: Request, res: Response) => {
    try {
        return res.status(200).send({ error: false, data: {}, message: "ok" });
    } catch (err) {
        console.log(err); return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
}

export const adminHome = async (req: Request, res: Response) => {
    try {
        return res.status(200).send({ error: false, data: {}, message: "ok" });
    } catch (err) {
        console.log(err); return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
}
