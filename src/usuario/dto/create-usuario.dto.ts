
import { IsDateString, IsEmail, IsInt, IsOptional, IsString} from "class-validator"

export class CreateUsuarioCompletoDto {
    //informacion de usuario
    @IsString()
    username: string;
    
    @IsString()
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
