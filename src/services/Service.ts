import { z } from "zod"
import { prisma } from "../server"
import { Request, Response } from "express"
import { Prisma } from "@prisma/client"
import { fromZodError } from "zod-validation-error"

// Créer un service
export async function create(req: Request, res: Response) {
  try {
    const schema = z.object({
      name: z.string().min(5, "Donnez un nom de service"),
      description: z.string().min(10, "Donnez une description de service"),
      category: z.string().nonempty("Sélectionner une catégorie"),
      pictures: z.array(z.string()).nonempty("Sélectionner des images"),
      seller_number: z.string().min(8, "Numéro de téléphone invalide").max(8, "Numéro de téléphone invalide").startsWith('9' || '7', "Numéro de téléphone invalide").nonempty("Veuillez renseigner un numéro de téléphone"),
    })
    const validation_result = schema.safeParse(req.body);
    if (!validation_result.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation_result.error).details[0].message, data: {} })
    const { data } = validation_result
    await prisma.service.create({
      data
    })
    return res.status(201).send({ status: 201, error: false, message: 'sucess', data: {} })
  } catch (err) {
    console.error(`Error while creating a brand ${err}`)
    return res.status(500).send({ status: 400, error: true, message: "Une erreur s'est produite", data: {} })
  }
}

// Modifier un service
export async function update_service(req: Request, res: Response) {
  try {
    const schema = z.object({
      id: z.string().nonempty(),
      name: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      pictures: z.array(z.string()).optional(),
      seller_number: z.string().optional(),
    })
    const validation_result = schema.safeParse(req.body);
    if (!validation_result.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation_result.error).details[0].message, data: {} })
    const { data } = validation_result;
    const targetted_service = await prisma.service.findUnique({
      where: {
        id: data.id
      }
    });
    if (!targetted_service) return res.status(404).send({ error: true, message: "Aucun service de ce type trouvé", data: {} });
    await prisma.service.update({
      where: {
        id: data.id
      },
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        pictures: data.pictures,
        seller_number: data.seller_number,
      }
    });
    return res.status(200).send({ status: 200, error: false, data: {}, message: {} });
  } catch (err) {
    console.error(`Error while creating a brand ${err}`)
    return res.status(500).send({ status: 400, error: true, message: "Une erreur s'est produite", data: {} })
  }
}

//TODO: Supprimer un service
export async function delete_service(req: Request, res: Response) {
  try {
    const schema = z.object({
      id: z.string()
    });
    const validation_result = schema.safeParse(req.body);
    if (!validation_result.success) return res.status(400).send({ message: "id manquant ou de type incorrect" });
    const { id } = validation_result.data;
    const targetted_service = await prisma.service.findUnique({
      where: { id },
    });
    if (!targetted_service) return res.status(404).send({ error: true, message: "", data: {} });
    //Delete category
    await prisma.service.delete({
      where: {
        id: targetted_service.id
      }
    });
    return res.status(200).send({ status: 200, error: false, message: "Service supprimé", data: {} });
  } catch (err) {
    console.error(`Error while deleting categories`);
    return res.status(500).send({ error: true, message: "Une erreur est survenue" });
  }
}

// Liste des services
export async function get(_req: Request, res: Response) {
  try {
    const data = await prisma.service.findMany()
    return res.status(200).send({ error: false, message: "", data: data })
  } catch (err) {
    console.error(`Error while getting services ${err}`)
    return res.status(500).send()
  }
}

// Créer une catégorie de service
export async function create_service_category(req: Request, res: Response) {
  try {
    const schema = z.object({
      name: z.string().nonempty("Veuillez indiquez un nom pour la catégories"),
      image: z.string(),
      featured: z.boolean(),
    });
    const validation_result = schema.safeParse(req.body);
    if (!validation_result.success) return res.status(400).send({ error: true, message: fromZodError(validation_result.error).details[0].message, data: {} });
    const { data } = validation_result;
    let result = await prisma.serviceCategory.create({ data });
    if (result) return res.status(201).send({ status: 201, error: false, message: "Requête aboutie", data });
    return res.status(401).send({ error: true, message: "Erreur inconnue", data: {} });
  } catch (err) {
    console.error(`Error while getting services ${err}`);
    return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} })
  }
}

// Liste des catégories de services
export async function service_categories(req: Request, res: Response) {
  try {
    const data = await prisma.serviceCategory.findMany();
    return res.status(200).send({ status: 200, error: false, message: "R.A", data })
  } catch (error) {
    console.error(`${error}`);
  }
}


// Mise à jour de la catégorie de service
export async function update_category_service(req: Request, res: Response) {
  try {
    const category_schema = z.object({
      id: z.string(),
      name: z.string().optional(),
      featured: z.boolean().optional(),
      image: z.string().optional()
    });
    const validation_result = category_schema.safeParse(req.body);
    if (!validation_result.success) return res.status(400).send({ error: true, message: JSON.parse(validation_result.error.message), data: {} });
    const { data } = validation_result;
    const targetted_category = await prisma.serviceCategory.findUnique({
      where: {
        id: data.id
      }
    });
    if (!targetted_category) return res.status(404).send({ error: true, message: "Aucune catégorie de ce type trouvée", data: {} })
    await prisma.serviceCategory.update({
      where: {
        id: data.id
      },
      data: {
        name: data.name,
        featured: data.featured,
        image: data.image
      }
    });
    return res.status(200).send({ status: 200, error: false, data: {}, message: {} });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") return res.status(409).send({ error: true, data: {} });
    }
    console.error(err);
    return res.status(500).send({ error: true, status: 500, message: "", data: {} });
  }
}


//TODO: Delete categories
export async function delete_category_service(req: Request, res: Response) {
  try {
    const schema = z.object({
      id: z.string()
    });
    const validation_result = schema.safeParse(req.body);
    if (!validation_result.success) return res.status(400).send({ message: "id manquant ou de type incorrect" });
    const { id } = validation_result.data;
    const targetted_category = await prisma.serviceCategory.findUnique({
      where: { id },
    });
    if (!targetted_category) return res.status(404).send({ error: true, message: "", data: {} });

    //Delete category
    await prisma.serviceCategory.delete({
      where: {
        id: targetted_category.id
      }
    });
    return res.status(200).send({ status: 200, error: false, message: "Catégorie supprimée", data: {} });
  } catch (err) {
    console.error(`Error while deleting categories`);
    return res.status(500).send({ error: true, message: "Une erreur est survenue" });
  }
}