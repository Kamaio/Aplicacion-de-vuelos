
import { IsDateString, IsEmail, IsInt, IsOptional, IsString} from "class-validator"
import { EsContrasena } from "../decoradores/contrasenaValidator";

export class CreateUsuarioCompletoDto {
    //informacion de usuario
    @IsString()
    usuario: string;
    
    @EsContrasena()
    password: string;
    
    @IsEmail()
    email: string;
    
    @IsString()
    rol: string;


    //informacion de informacion perfil
    @IsInt()
    cc: number;

    @IsString()
    nombres: string;

    @IsString()
    apellidos: string;

    @IsDateString()
    fechaNacimiento: Date;

    @IsString()
    lugarNacimiento: string;

    @IsString()
    direccionFacturacion: string;

    @IsString()
    genero: string;

    @IsOptional()
    @IsString()
    imagenUrl: string;
}
