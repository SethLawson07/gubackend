import { prisma } from "../server"

type Condition = {
    id: string,
    description: string
    condition: ( amount:number, param:string|undefined, user:string )=>Promise<boolean>
}


const conditions: Condition[] = [
    {
        id:"0",
        description:"Applicable seulement pour les nouveaux utilisateurs",
        condition:async (_amount:number, _param: string|undefined, user:string)=>{
            const current_user = await prisma.user.findUnique({
                where:{
                    email: user
                }
            })
            if(!current_user) return false
            const user_orders = await prisma.order.findMany({
                where:{
                    user: current_user.id
                }
            })
            if(user_orders.length!==0) return false
            return true
        }
    },
    {
        id:"1",
        description:"Applicable seulement pour les commandes au delà d'un montant donné",
        condition: async (amount:number, param: string|undefined, _user:string)=>{
            console.log(amount, param, _user)
            if(!param) return false
            const min_amount = Number(param)
            console.log(min_amount)
            if(isNaN(min_amount)) return false
            return min_amount<amount
        }
    }
]

export async function apply_conditions(given_conditions:string[], amount: number, user:string){
    for(let i = 0; i<given_conditions.length; i++){
        const current_condition = given_conditions[i]
        const targetted_condition = conditions.find((c)=>c.id===current_condition.split(":")[0])
        if(!targetted_condition) continue
        const condition_is_valid = await targetted_condition.condition(amount, current_condition.split(":")[1], user)
        if(!condition_is_valid) return false
    }
    return true
}
