import { IsNumber, IsString, Min, Max, MinLength, IsNotEmpty, IsOptional } from 'class-validator';

export class WithdrawalDto {
  @IsNumber()
  @Min(10)
  @Max(10000)
  amount: number;

  @IsNotEmpty()
  @IsString()
  bankName: string;

  @IsNotEmpty()
  @IsString()
  accountHolder: string;

  @IsNotEmpty()
  @IsString()
  iban: string;

  @IsOptional()
  @IsString()
  bic?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class ApproveWithdrawalDto {
  @IsString()
  notes?: string;
}

export class RejectWithdrawalDto {
  @IsString()
  @MinLength(5)
  reason: string;
}