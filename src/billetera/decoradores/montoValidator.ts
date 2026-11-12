import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function EsMonto(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'EsMonto',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,

            validator: {
                validate(value: any, args: ValidationArguments) {
                if (typeof value !== 'string') return false;
                // Regla: maximo 12 caracteres
                const regex = /^\d{1, 12}$/;
                return regex.test(value);
                },

                defaultMessage(args: ValidationArguments) {
                return "Monto invalido. Deben ser menos de 12 digitos.";
                },
            },
        });
    };
}