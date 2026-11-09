import { IsDateString, IsEmail, IsNumber, IsString } from "class-validator"

export class CreatePasajeroDto {
    @IsString()
    documento: number

    @IsNumber()
    edad: number

    @IsEmail()
    email: string

    @IsDateString()
    fechaNacimiento: Date

    @IsString()
    genero: string

    @IsString()
    nombreCompleto: string

    @IsString()
    telefono: number

    @IsString()
    nombreContacto: string

    @IsString()
    telefonoContacto: number
}
