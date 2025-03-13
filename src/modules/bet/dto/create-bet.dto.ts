import { IsNotEmpty, IsNumber } from "class-validator";

export class CreateBetDto {

    @IsNotEmpty()
    @IsNumber()
    stake: number;

    @IsNotEmpty()
    matches: { matchId: string; betOutcome: string; odds: number }[];

}
