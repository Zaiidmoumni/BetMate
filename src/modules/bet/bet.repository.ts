import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Bet, BetDocument } from "./bet.schema";
import { Model } from "mongoose";


@Injectable()
export class BetRepository {
    constructor(@InjectModel(Bet.name) private betModel: Model<BetDocument>){}

    //Create a bet 
    async create(betData: Partial<Bet>): Promise<Bet>{
        const bet = new this.betModel(betData);
        return bet.save();
    }

    // Find a bet by it's ID
    async findById(betId: string): Promise<BetDocument | null>{
        return this.betModel.findById(betId).exec();
    }

    // Find bets by match ID
    async findByMatch(matchId: string): Promise<BetDocument[]>{
        return this.betModel.find({ 'matches.matchId': matchId}).exec();
    }

    // Find bets by status
    async findByStatus(status: string): Promise<BetDocument[]>{
        return this.betModel.find({ status: status }).exec();
    }

    // Update a bet's data 
    async update(betId: string, updateData: Partial<Bet>):Promise<Bet| null> {
        return this.betModel.findByIdAndUpdate(betId, updateData, {new: true}).exec();
    }



}