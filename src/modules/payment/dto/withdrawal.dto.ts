import { IsNumber, IsString, Min, Max, MinLength } from 'class-validator';

export class WithdrawalDto {
  @IsNumber()
  @Min(10)
  @Max(10000)
  amount: number;

  @IsString()
  @MinLength(15)
  bankAccount: string;
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