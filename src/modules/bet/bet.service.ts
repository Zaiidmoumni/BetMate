import { Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Bet, BetDocument } from './bet.schema';
import { Model } from 'mongoose';

@Injectable()
export class BetService {
  constructor(@InjectModel(Bet.name) private betModel:Model<BetDocument>) {}

  // Place 
}
