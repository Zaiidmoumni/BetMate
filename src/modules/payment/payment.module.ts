import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { Transaction, TransactionSchema } from "./transaction.schema";
import { User, UserSchema } from "../users/schemas/user.schema";
import { PaymentService } from "./services/payment.service";
import { MollieService } from "./services/mollie.service";
import { TransactionRepository } from "./repositories/transaction.repository";
import { UserBalanceRepository } from "./repositories/user-balance.repository";
import { PaymentController } from "./payment.controller";


@Module({
    imports: [
        ConfigModule,
        MongooseModule.forFeature([
            {name: Transaction.name, schema: TransactionSchema},
            {name: User.name, schema: UserSchema}
        ])
    ],
    controllers: [PaymentController],
    providers: [
        PaymentService,
        MollieService,
        TransactionRepository,
        UserBalanceRepository
    ],
    exports: [PaymentService]
})
export class paymentModule {}