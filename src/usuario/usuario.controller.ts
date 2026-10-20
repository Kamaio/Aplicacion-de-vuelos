import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioCompletoDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  create(@Body() createUsuarioCompletoDto: CreateUsuarioCompletoDto) {
    return this.usuarioService.create(createUsuarioCompletoDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Req() req: any) {
    if (req.user.rol == 'CLIENTE') {
      throw new ForbiddenException("Se requiere ser administrador para revisar el listado de usuarios")
    }

    return this.usuarioService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id') id: number, @Req() req: any) {

    if (req.user.rol == 'CLIENTE') {
      throw new ForbiddenException("Se requiere ser administrador para revisar el listado de usuarios")
    }

    return this.usuarioService.findOne(+id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(@Param('id') id: number, @Body() updateUsuarioDto: UpdateUsuarioDto, @Req() req: any) {

    if (req.user.id_usuario != id) {
      throw new ForbiddenException("No se puede editar un id diferente al de la sesion actual")
    }

    return this.usuarioService.update(+id, updateUsuarioDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: number, @Req() req: any) {

    const rolesPermitidos = ['ADMIN', 'ROOT'];
    if (req.user.id_usuario != id && !rolesPermitidos.includes(req.user.rol)) {
      throw new ForbiddenException("No se puede eliminar un id diferente al de la sesion actual o no se tiene el rol adecuado para eliminar usuarios")
    }

    return this.usuarioService.remove(+id);
  }
}
