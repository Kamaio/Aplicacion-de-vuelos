import { IsDateString, IsNumber, IsOptional, IsString } from "class-validator"

export class CreateCompraReservaDto {
    @IsString()
    codigoReserva: string

    @IsString()
    estado: string

    @IsDateString()
    @IsOptional()
    fechaLimitePago: Date

    @IsDateString()
    @IsOptional()
    fechaPago: Date

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
