import { Request, Response } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { prisma } from "../../server";
import { Product } from "@prisma/client";


export async function addProduct(req: Request, res: Response) {
    try {
        const schema = z.object({
            name: z.string(),
            price:z.string(),
            qte: z.number(),
            discount: z.boolean().optional(),
            discountprice: z.string().optional().default(""),
            goodpay: z.boolean(),
            goodpayprice: z.string(),
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

// export async function active(req: Request, res: Response) {
//   try {
//       const products = await prisma.product.findMany({
//           include: {
//               productVariant: {
//                   select: {
//                       id: true,
//                       color: true,
//                       image: true,
//                       size: true,
//                       featured: true,
//                       createdat: true
//                   }
//               },
//               item: {
//                   include: {
//                       itemVariant: {
//                           select: {
//                               id: true,
//                               title: true,
//                               value: true
//                           }
//                       }
//                   }
//               }
//           }
//       });

//       return res.status(200).send({ error: false, message: "ok", data: products });
//   } catch (err) {
//       console.error(` ${err}`);
//       return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite "+err, data: {} });
//   }
// }


// export async function active(req: Request, res: Response) {
//   try {
//       const products = await prisma.product.findMany({
//           include: {
//               productVariant: true,
//               item: {
//                   include: {
//                       itemVariant: true
//                   }
//               }
//           }
//       });

//       return res.status(200).send({ error: false, message: "ok", data: products });
//   } catch (err) {
//       console.error(` ${err}`);
//       return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite "+err, data: {} });
//   }
// }


export async function active(req: Request, res: Response) {
  try {
    const products = await prisma.product.findMany();
      // const products = await prisma.product.findMany({
      //     include: {
      //         productVariant: true
      //         // item: {
      //         //     include: {
      //         //         itemVariant: true
      //         //     }
      //         // }
      //     }
      // });

      return res.status(200).send({ error: false, message: "ok", data: products });
  } catch (err) {
      console.error(` ${err}`);
      return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite "+err, data: {} });
  }
}




export async function allproductsbyitem(req: Request, res: Response) {
    try {
        let slugitem = req.params.slugitem
        const item = await prisma.item.findUnique({where:{slugitem:slugitem}})        
        const all = await prisma.product.findMany({where:{itemId:item?.id,featured:true}});
        return res.status(200).send({ error: false, message: "ok", data: all });
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

export async function oklm(req: Request, res: Response) {
    try {
        const products = [
            {
                "id": "1",
                "sku": "asdf123",
                "name": "Lorem ipsum jacket",
                "price": 12.45,
                "discount": 10,
                "offerEnd": "October 5, 2024 12:11:00",
                "new": false,
                "rating": 4,
                "saleCount": 54,
                "category": ["fashion", "men"],
                "tag": ["fashion", "men", "jacket", "full sleeve"],
                "variation": [
                  {
                    "color": "white",
                    "image": "/assets/img/product/fashion/1.jpg",
                    "size": [
                      {
                        "name": "x",
                        "stock": 3
                      },
                      {
                        "name": "m",
                        "stock": 2
                      },
                      {
                        "name": "xl",
                        "stock": 5
                      }
                    ]
                  },
                  {
                    "color": "black",
                    "image": "/assets/img/product/fashion/8.jpg",
                    "size": [
                      {
                        "name": "x",
                        "stock": 4
                      },
                      {
                        "name": "m",
                        "stock": 7
                      },
                      {
                        "name": "xl",
                        "stock": 9
                      },
                      {
                        "name": "xxl",
                        "stock": 1
                      }
                    ]
                  },
                  {
                    "color": "brown",
                    "image": "/assets/img/product/fashion/3.jpg",
                    "size": [
                      {
                        "name": "x",
                        "stock": 1
                      },
                      {
                        "name": "m",
                        "stock": 2
                      },
                      {
                        "name": "xl",
                        "stock": 4
                      },
                      {
                        "name": "xxl",
                        "stock": 0
                      }
                    ]
                  }
                ],
                "image": [
                  "/assets/img/product/fashion/1.jpg",
                  "/assets/img/product/fashion/3.jpg",
                  "/assets/img/product/fashion/6.jpg",
                  "/assets/img/product/fashion/8.jpg",
                  "/assets/img/product/fashion/9.jpg"
                ],
                "shortDescription": "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.",
                "fullDescription": "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur? Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is pain, but because occasionally circumstances occur in which toil and pain can procure him some great pleasure. To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it? But who has any right to find fault with a man who chooses to enjoy a pleasure that has no annoying consequences, or one who avoids a pain that produces no resultant pleasure?"
              },
              {
                "id": "2",
                "sku": "asdf124",
                "name": "Lorem ipsum coat",
                "price": 18.5,
                "discount": 15,
                "new": false,
                "rating": 3,
                "saleCount": 12,
                "category": ["fashion", "women"],
                "tag": ["fashion", "women", "coat", "full sleeve"],
                "variation": [
                  {
                    "color": "blue",
                    "image": "/assets/img/product/fashion/2.jpg",
                    "size": [
                      {
                        "name": "x",
                        "stock": 3
                      },
                      {
                        "name": "m",
                        "stock": 6
                      },
                      {
                        "name": "xl",
                        "stock": 7
                      }
                    ]
                  },
                  {
                    "color": "brown",
                    "image": "/assets/img/product/fashion/4.jpg",
                    "size": [
                      {
                        "name": "x",
                        "stock": 4
                      },
                      {
                        "name": "m",
                        "stock": 8
                      },
                      {
                        "name": "xl",
                        "stock": 3
                      },
                      {
                        "name": "xxl",
                        "stock": 7
                      }
                    ]
                  },
                  {
                    "color": "black",
                    "image": "/assets/img/product/fashion/5.jpg",
                    "size": [
                      {
                        "name": "x",
                        "stock": 3
                      },
                      {
                        "name": "m",
                        "stock": 7
                      },
                      {
                        "name": "xl",
                        "stock": 0
                      },
                      {
                        "name": "xxl",
                        "stock": 7
                      }
                    ]
                  }
                ],
                "image": [
                  "/assets/img/product/fashion/2.jpg",
                  "/assets/img/product/fashion/4.jpg",
                  "/assets/img/product/fashion/5.jpg",
                  "/assets/img/product/fashion/7.jpg",
                  "/assets/img/product/fashion/9.jpg"
                ],
                "shortDescription": "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.",
                "fullDescription": "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur? Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is pain, but because occasionally circumstances occur in which toil and pain can procure him some great pleasure. To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it? But who has any right to find fault with a man who chooses to enjoy a pleasure that has no annoying consequences, or one who avoids a pain that produces no resultant pleasure?"
              },
            
        ]
        return res.status(200).send({ error: false, message: "okokok", data:products});
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite "+err, data: {} });
    }
}

export async function updateProduct(req: Request, res: Response) {
    try {
        let id = req.params.id
        const schema = z.object({
            title: z.string(),
            qte: z.number(),
            discount: z.boolean(),
            discountprice: z.string(),
            goodpay: z.boolean(),
            goodpayprice: z.string(),
            brand: z.string(),
            description: z.string(),
            keywords: z.string(),
            image: z.string(),
            itemId: z.string(),
           
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