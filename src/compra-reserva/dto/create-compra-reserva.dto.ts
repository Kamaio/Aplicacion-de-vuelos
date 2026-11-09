import { Type } from "class-transformer"
import { IsDateString, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator"
import { CreatePasajeroDto } from "./createPasajero.dto"

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

    //cosas para los pasajeros
    @IsString()
    clase: string

    @IsNumber()
    cantidadPasajeros: number

    @ValidateNested({ each: true })
    @Type(() => CreatePasajeroDto)
    pasajeros: CreatePasajeroDto[];
}
