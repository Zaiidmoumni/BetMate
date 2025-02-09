import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateWithdrawalDto {
    @IsNumber()
    @Min(100)
    @Max(10000)
    amount: number;
  
    @IsString()
    paymentMethod: string;
  
    @IsString()
    @IsOptional()
    bankAccount?: string;
  
    @IsString()
    @IsOptional()
    bankName?: string;
}