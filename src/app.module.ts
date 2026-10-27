import { Module } from '@nestjs/common';
import { UsuarioModule } from './usuario/usuario.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { VuelosModule } from './vuelos/vuelos.module';
import { BilleteraModule } from './billetera/billetera.module';
import { CompraReservaModule } from './compra-reserva/compra-reserva.module';


@Module({
  imports: [
    UsuarioModule,

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'env'],
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '5432'), //esto tecnicamente es estupido porque entonces es mas facil solo poner 5432 pero ni modo
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,

      autoLoadEntities: true,
      synchronize: false,

      ssl: {
        rejectUnauthorized: false,
      }
    }),

    AuthModule,

    VuelosModule,

    BilleteraModule,

    CompraReservaModule,


    
  ],


  controllers: [],
  providers: [],
})
export class AppModule {}
