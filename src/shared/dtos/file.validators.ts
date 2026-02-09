import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

// 1. Check if file exists
export function IsFile(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isFile',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    // Check if Multer file object properties exist
                    return value && typeof value === 'object' && 'buffer' in value && 'size' in value;
                },
                defaultMessage(args: ValidationArguments) {
                    return 'File is missing or invalid';
                }
            },
        });
    };
}

// 2. Check Max Size (in bytes)
export function MaxFileSize(maxBytes: number, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'maxFileSize',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [maxBytes],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    // Allow undefined (use @IsNotEmpty to enforce presence)
                    if (!value) return true;
                    return value.size <= args.constraints[0];
                },
                defaultMessage(args: ValidationArguments) {
                    return `File is too large. Max allowed size is ${args.constraints[0] / 1024 / 1024}MB`;
                }
            },
        });
    };
}

// 3. Check Mime Type
export function HasMimeType(allowedMimeTypes: string[], validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'hasMimeType',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [allowedMimeTypes],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    if (!value) return true;
                    return args.constraints[0].includes(value.mimetype);
                },
                defaultMessage(args: ValidationArguments) {
                    return `Invalid file type. Allowed: ${args.constraints[0].join(', ')}`;
                }
            },
        });
    };
}