import { IsNumber } from "class-validator"

export class CreateBilleteraDto {
    @IsNumber()
    id_usuario: number

    @IsNumber()
    saldo: number
}
