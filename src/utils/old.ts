


// export async function contribution_event(req: Request, res: Response) {
//     try {
//         let buffer = Buffer.from(req.params.data, 'base64');
//         let text = buffer.toString('ascii');
//         let data = JSON.parse(text);
//         const schema = z.object({
//             cpm_amount: z.string(),
//             cpm_trans_id: z.string(),
//             payment_method: z.string(),
//             cel_phone_num: z.string(),
//             cpm_error_message: z.string(),
//             cpm_trans_date: z.string()
//         });
//         const validation_result = schema.safeParse(req.body);
//         if (!validation_result.success) {
//             console.log(`Error while parsing response from cinet pay ${req.body}`)
//             return res.status(400).send()
//         }
//         if (store.includes(validation_result.data.cpm_trans_id)) {
//             console.log(`Found duplicate id in store ${validation_result.data.cpm_trans_id} : Aborting processing`)
//             return res.status(409).send({ error: true, message: "", data: {} });
//         }
//         store.push(validation_result.data.cpm_trans_id);
//         if (validation_result.data.cpm_error_message === "SUCCES") {
//             const targetedUser = await prisma.user.findUnique({ where: { id: data.customer } });
//             if (!targetedUser) return res.status(404).send({ error: true, message: "User not found", data: {} });
//             const book = await opened_book(targetedUser);
//             if (book.error || !book.book || !book.data) return res.status(403).send({ error: true, message: "Pas de carnet ouvert", book: false, update_sheets: null });
//             let result = await sheet_contribute(data.customer, data.amount, data.p_method);
//             const userAccount = await prisma.account.findFirst({ where: { userId: data.customer } });
//             if (!userAccount) return res.status(404).send({ error: true, message: "User account not found", data: {} });
//             let contribution: Contribution; // CreatedContribution
//             if (!result.error && result.cases) {
//                 const report = await prisma.report.create({
//                     data: { type: "contribution", amount: data.amount, createdat: todateTime(data.createdAt), payment: operatorChecker(validation_result.data.cel_phone_num), sheet: result.sheet!, cases: result.cases, status: "unpaid", customerId: targetedUser.id, }
//                 });
//                 if (!report) return res.status(400).send({ error: true, message: "Oupps il s'est passé quelque chose!", data: {} });
//                 contribution = await prisma.contribution.create({
//                     data: { account: userAccount?.id!, createdAt: todateTime(data.createdAt), userId: targetedUser?.id!, pmethod: data.p_method, awaiting: "none", status: "paid", amount: data.amount, cases: result.cases.map(chiffre => chiffre + 1), sheet: result.sheet!.id, reportId: report.id, },
//                 });
//                 if (contribution) {
//                     await mMoneyContributionJobQueue.add("mMoneyContribution", { customer: data.customer, amount: data.amount, result, book, report });
//                     return res.status(200).send({ error: false, message: "Cotisation éffectée", data: contribution! });
//                 } else { return res.status(401).send({ error: true, message: "Une erreur s'est produite réessayer", data: {} }); }
//             } else {
//                 console.log(result.message);
//                 console.log("Error");
//                 return res.status(200).send({ error: result.error, message: result.message, data: {} });
//             }
//         }
//         console.log(`A payment failed`)
//     } catch (err) {
//         console.error(`Error while handling payment event ${err}`)
//         return res.status(500).send()
//     }
// }


// export async function addbook_event(req: Request, res: Response) {
//     try {
//         let buffer = Buffer.from(req.params.data, 'base64');
//         let text = buffer.toString('ascii');
//         let data = JSON.parse(text);
//         const schema = z.object({
//             cpm_amount: z.string(),
//             cpm_trans_id: z.string(),
//             payment_method: z.string(),
//             cel_phone_num: z.string(),
//             cpm_error_message: z.string(),
//             cpm_trans_date: z.string()
//         });
//         const validation_result = schema.safeParse(req.body);
//         if (!validation_result.success) {
//             console.log(`Error while parsing response from cinet pay ${req.body}`)
//             return res.status(400).send()
//         }
//         if (store.includes(validation_result.data.cpm_trans_id)) {
//             console.log(`Found duplicate id in store ${validation_result.data.cpm_trans_id} : Aborting processing`)
//             return res.status(409).send({ error: true, message: "", data: {} });
//         }
//         store.push(validation_result.data.cpm_trans_id);
//         if (validation_result.data.cpm_error_message === "SUCCES") {
//             const user = await prisma.user.findUnique({ where: { id: data.customer } });
//             if (!user) return res.status(404).send({ error: true, message: "User not found", data: {} });
//             const bookIsOpened = await prisma.book.findFirst({ where: { status: "opened", userId: user.id } });
//             if (bookIsOpened) return res.status(400).send({ error: true, message: "Impossible de créer le carnet", data: {} });
//             const [created_book, report_bet] = await prisma.$transaction([
//                 prisma.book.create({ data: { bookNumber: "", createdAt: todateTime(data.createdAt), userId: user.id, status: "opened", sheets: [] } }),
//                 prisma.betReport.create({ data: { goodnessbalance: 300, agentbalance: 0, createdat: todateTime(data.createdAt), agentId: user.agentId, customerId: user.id, type: "book" } }),
//             ]);
//             if (!created_book || !report_bet) return res.status(400).send({ error: true, message: "Cound not create", data: {} });
//             const sheets = create_sheets(created_book, 300, data.createdAt);
//             if (sheets) await prisma.book.update({ where: { id: created_book.id }, data: { sheets: sheets }, });
//             await agenda.schedule('in 1 years, 7 days', 'closebook', { created_book });
//             await agenda.start();
//         }
//         console.log(`A payment failed`);
//     } catch (err) {
//         console.error(`Error while handling payment event ${err}`)
//         return res.status(500).send()
//     }
// }



// export async function makeMobileMoneyDeposit(req: Request, res: Response) {
//     try {
//         let buffer = Buffer.from(req.params.data, 'base64');
//         let text = buffer.toString('ascii');
//         let data = JSON.parse(text);
//         const schema = z.object({
//             cpm_amount: z.string(),
//             cpm_trans_id: z.string(),
//             payment_method: z.string(),
//             cel_phone_num: z.string(),
//             cpm_error_message: z.string(),
//             cpm_trans_date: z.string()
//         });
//         const validation_result = schema.safeParse(req.body);
//         if (!validation_result.success) {
//             console.log(`Error while parsing response from cinet pay ${req.body}`)
//             return res.status(500).send();
//         }
//         if (store.includes(validation_result.data.cpm_trans_id)) {
//             console.log(`Found duplicate id in store ${validation_result.data.cpm_trans_id} : Aborting processing`)
//             return res.status(409).send({ error: true, message: "", data: {} });
//         }
//         store.push(validation_result.data.cpm_trans_id);
//         if (validation_result.data.cpm_error_message === "SUCCES") {
//             let targetted_user: User;
//             let targetted_account: Account;
//             const findUser = await prisma.user.findUnique({ where: { id: data.customer } });
//             if (!findUser) return res.status(404).send({ status: 404, error: true, message: "Utilisateur non trouvé", data: {} });
//             targetted_user = findUser;
//             const findAccount = await prisma.account.findFirst({ where: { userId: findUser.id } });
//             if (!findAccount) return res.status(404).send({ error: true, status: 404, message: "Compte non trouvé", data: {} });
//             targetted_account = findAccount;
//             const report = await prisma.report.create({
//                 data: { type: "deposit", amount: data.amount, createdat: data.createdAt, payment: data.p_method, status: "unpaid", customerId: targetted_user.id, }
//             });
//             if (!report) return res.status(400).send({ error: true, message: "Oupps il s'est passé quelque chose!", data: {} });
//             const [deposit, aUpdate] = await prisma.$transaction([
//                 prisma.deposit.create({
//                     data: { account: targetted_account.id, amount: data.amount, createdAt: todateTime(new Date(data.createdAt)), customer: targetted_user.id, madeby: "agent", payment: operatorChecker(validation_result.data.cel_phone_num), reportId: report.id }
//                 }),
//                 prisma.account.update({ where: { id: targetted_account.id }, data: { balance: targetted_account.balance + data.amount } }),
//             ]);
//             if (!aUpdate && !deposit) return res.status(400).send({ status: 400, message: "Erreur, Dépôt non éffectué", data: {} });
//             await prisma.report.update({ where: { id: report.id }, data: { status: "paid" } });
//             return res.status(200).send({ status: 200, error: false, message: "Dépôt éffectué avec succès", data: deposit });
//         }
//         console.log(`A payment failed`)
//     } catch (err) {
//         console.error(`Error while handling payment event ${err}`)
//         return res.status(500).send()
//     }
// }