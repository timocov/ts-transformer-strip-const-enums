const enum NonExportedConstEnum {
	First,
}

export const enum ExportedConstEnum {
	First,
}

enum NonExportedEnum {
	First,
}

export enum ExportedEnum {
	First,
}

export function doSomething(): void {
	console.log(NonExportedConstEnum.First, ExportedConstEnum.First, NonExportedEnum.First, ExportedEnum.First);
}
