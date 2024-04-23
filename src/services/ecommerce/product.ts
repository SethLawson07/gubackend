import { Request, Response } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { prisma } from "../../server";
import { Product } from "@prisma/client";

 
 
  
export async function addProduct(req: Request, res: Response) {
    try {
        const schema = z.object({
            name: z.string(),
            qte: z.number(),
            price:z.string(),
            oldPrice:z.string().optional(),
            discount: z.string().optional(),
            goodpay: z.string().optional(),
            color: z.array(z.string()).optional(),
            size: z.array(z.string()).optional(),
            prices: z.array(z.string()).optional(),
            brand: z.string().optional(),
            description: z.string(),
            spec: z.string(),
            tag: z.array(z.string()),
            images: z.array(z.string()),
            itemId: z.string(),
            featured:z.boolean().optional(),
            slugproduct:z.string()

        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });
     
        const savedProduct = await prisma.product.create({ data: validation.data  });
        return res.status(200).send({ status: 200, error: false, message: "ok", data: savedProduct });
    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite "+err, data: {} });
    }
}



export async function all(req: Request, res: Response) {
    try {
        const products = await prisma.product.findMany();
        return res.status(200).send({ error: false, message: "ok", data: products });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite "+err, data: {} });
    }
}


export async function productsByItem(req: Request, res: Response) {
    try {
        let slugitem = req.params.slugitem
        
        const item = await prisma.item.findUnique({where:{slugitem:slugitem}}) 
        const all = await prisma.product.findMany({where:{itemId:item?.id,featured:true}});
        return res.status(200).send({ error: false, message: "ok", data: item!==null ? all : [] });

    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite "+err, data: {} });
    }
}

export async function product(req: Request, res: Response) {
    try {
        let slugproduct = req.params.slugproduct
        const product = await prisma.product.findUnique({where:{slugproduct:slugproduct}})
        return res.status(200).send({ error: false, message: "ok", data: product });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite "+err, data: {} });
    }
}

export async function latest(req: Request, res: Response) {
    try {
      const products = await prisma.product.findMany({
        orderBy: { createdat: 'desc' }, // Trier par date de création décroissante
        take: 15, // Limiter les résultats à 15 produits
      });
  
      return res.status(200).send({ error: false, message: "ok", data: products });
    } catch (err) {
      console.error(`${err}`);
      return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " + err, data: {} });
    }
  }
  

export async function topProducts(req: Request, res: Response) {
  try {
    const products = await prisma.product.findMany();

    // Mélanger les produits de manière aléatoire
    products.sort(() => Math.random() - 0.5);

    // Sélectionner les trois premiers produits mélangés
    const top = products.slice(0, 12);

    return res.status(200).send({ error: false, message: "ok", data: top });
  } catch (err) {
    console.error(`${err}`);
    return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " + err, data: {} });
  }
}


export async function products(req: Request, res: Response) {
  try {
      const categories = await prisma.category.findMany({include:{SubCategory:{include:{Item:{include:{Product:true}}}}}})
      // const categories = await prisma.subCategory.findMany({include:{Item:{include:{Product:true}}}})

      return res.status(200).send({ error: false, message: "ok", data: categories });
  } catch (err) {
      console.error(` ${err}`);
      return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite "+err, data: {} });
  }
}


export async function updateProduct(req: Request, res: Response) {
    try {
        let id = req.params.id
        const schema = z.object({
            title: z.string().optional(),
            qte: z.number().optional(),
            discount: z.string().optional(),
            sectionArea:z.number().min(1).max(2).optional()
            // discountprice: z.string(),
            // goodpay: z.boolean(),
            // goodpayprice: z.string(),
            // brand: z.string(),
            // description: z.string(),
            // keywords: z.string(),
            // image: z.string(),
            // itemId: z.string(),
           
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });
        const savedProduct = await prisma.product.update({ where: { id: id, }, data: validation.data, })
        return res.status(200).send({ status: 200, error: false, message: "ok", data: savedProduct });
    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite "+err, data: {} });
    }
}



export async function deleteProduct(req: Request, res: Response) {
    try {
        let id = req.params.id
        const product = await prisma.product.delete({ where: { id: id } });
        return res.status(200).send({ error: false, message: "ok", data: product });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite "+err, data: {} });
    }
}