import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Bet {
  @Prop({ required: true })
  userId: string;

  @Prop([
    {
      matchId: String,
      betOutcome: String,
      odds: Number,
      status: {
        type: String,
        enum: ['Pending', 'Won', 'Lost'],
        default: 'Pending',
      },
    },
  ])
  matches: {
    matchId: string;
    betOutcome: string;
    odds: number;
    status: 'Pending' | 'Won' | 'Lost';
  }[];

  @Prop({ required: true })
  totalOdds: number;

  @Prop({ required: true })
  stake: number;

  @Prop({ required: true })
  potentialPayout: number;

  @Prop({ type: String, enum: ['Pending', 'Won', 'Lost'], default: 'Pending' })
  status: 'Pending' | 'Won' | 'Lost';  
}

export type BetDocument = HydratedDocument<Bet>;
export const BetSchema = SchemaFactory.createForClass(Bet);
