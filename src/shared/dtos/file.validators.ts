import { registerDecorator, type ValidationOptions, type ValidationArguments } from "class-validator";
type MulterFile = Express.Multer.File;

// 1. Check if file exists
export function IsFile(validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: Object, propertyName: string | symbol): void {
    registerDecorator({
      name: "isFile",
      target: object.constructor,
      propertyName: String(propertyName),
      options: validationOptions,
      validator: {
        validate(value: MulterFile | undefined, _args: ValidationArguments): boolean {
          // Check if Multer file object properties exist
          return !!value && typeof value === "object" && "buffer" in value && "size" in value;
        },
        defaultMessage(_args: ValidationArguments): string {
          return "File is missing or invalid";
        },
      },
    });
  };
}

// 2. Check Max Size (in bytes)
export function MaxFileSize(maxBytes: number, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string): void {
    registerDecorator({
      name: "maxFileSize",
      target: object.constructor,
      propertyName: propertyName,
      constraints: [maxBytes],
      options: validationOptions,
      validator: {
        validate(value: MulterFile | undefined, args: ValidationArguments): boolean {
          // Allow undefined (use @IsNotEmpty to enforce presence)
          if (!value) return true;
          return value.size <= args.constraints[0];
        },
        defaultMessage(args: ValidationArguments): string {
          return `File is too large. Max allowed size is ${args.constraints[0] / 1024 / 1024}MB`;
        },
      },
    });
  };
}

// 3. Check Mime Type
export function HasMimeType(allowedMimeTypes: string[], validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: Object, propertyName: string | symbol): void {
    registerDecorator({
      name: "hasMimeType",
      target: object.constructor,
      propertyName: String(propertyName),
      constraints: [allowedMimeTypes],
      options: validationOptions,
      validator: {
        validate(value: MulterFile | undefined, args: ValidationArguments): boolean {
          if (!value) return true;
          return args.constraints[0].includes(value.mimetype);
        },
        defaultMessage(args: ValidationArguments): string {
          return `Invalid file type. Allowed: ${args.constraints[0].join(", ")}`;
        },
      },
    });
  };
}
