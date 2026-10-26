
import { IsDateString, IsEmail, IsInt, IsOptional, IsString} from "class-validator"
import { EsContrasena } from "../decoradores/contrasenaValidator";
import { EsUsuario } from "../decoradores/usuarioValidator";

export class CreateAdminDto {
    //informacion de usuario
    @EsUsuario()
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

    //@IsString()
    //nombres: string;

    //@IsString()
    //apellidos: string;

    //@IsDateString()
    //fechaNacimiento: Date;

    //@IsString()
    //lugarNacimiento: string;

    //@IsString()
    //direccionFacturacion: string;

    //@IsString()
    //genero: string;

    //@IsOptional()
    //@IsString()
    //imagenUrl: string;
}
