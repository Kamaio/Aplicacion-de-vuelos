import { IsDateString, IsNumber, IsString } from "class-validator"

export class CreateCompraReservaDto {
    @IsString()
    codigoReserva: string

    @IsString()
    estado: string

    @IsDateString()
    fechaLimitePago: Date

    @IsDateString()
    fechaReserva: Date

    @IsNumber()
    idUsuario: number

    @IsNumber()
    idVuelo: number

    @IsString()
    metodoPago: string

    @IsNumber()
    montoTotal: number
}
