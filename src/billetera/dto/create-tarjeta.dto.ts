import { IsNumber, IsString } from "class-validator"
import { EsTarjeta } from "../decoradores/tarjetaValidator"

export class CreateTarjetaDto {
    @IsNumber()
    idUsuario: number

    @IsNumber()
    idBilletera: number

    @EsTarjeta()
    numeroTarjeta: string

    @IsString()
    tipoTarjeta: string // cretido, debitp

    @IsString()
    franquicia: string // visa, Mastercard, etc

    @IsString()
    fechaExpiracion: string | Date
}
