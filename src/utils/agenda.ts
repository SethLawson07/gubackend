import { Book, Sheet, User } from "@prisma/client";
import { agenda, prisma } from "../server";
import axios from "axios";


// Définition de la tâche
agenda.define('closebook', async (job: any) => {
    const { created_book } = job.attrs.data as { created_book: Book };
    await prisma.book.update({ where: { id: created_book.id }, data: { status: "closed" } });
});

// Définition de la tâche
agenda.define('closesheet', async (job: any) => {
    const { book, sheet } = job.attrs.data as { user: User, book: Book, sheet: Sheet };
    const sheets = book.sheets;
    let updated_sheets: Sheet[] = sheets;
    let sheetIndex = sheets.findIndex(e => e.id === sheet.id);
    sheet.status = "closed";
    updated_sheets[sheetIndex] = sheet;
    await prisma.book.update({ where: { id: book.id }, data: { sheets: updated_sheets } });
});

// Appel récurent pour éviter la pause du serveur (gratuit)
// A enlever après
agenda.define('checkserver', async (job: any) => {
    let config = { method: 'GET', url: 'https://goodapp.onrender.com/health', };
    await axios(config);
}); 