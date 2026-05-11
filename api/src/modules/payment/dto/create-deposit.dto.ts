import { IsNumber, IsString, Max, Min } from "class-validator";

export class CreateDepositDto {
  @IsNumber()
  @Min(10)
  @Max(10000)
  amount: number;

  @IsString()
  paymentMethod: string;
}