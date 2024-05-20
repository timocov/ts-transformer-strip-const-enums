import * as ts from 'typescript';

export interface Options {
	/**
	 * An array of entry source files which will used to detect exported const enums.
	 * Basically it should be entry point(s) of the library/project.
	 * @example ['./src/index.ts']
	 */
	entrySourceFiles: string[];
}

const defaultOptions: Options = {
	entrySourceFiles: [],
};

// tslint:disable-next-line:no-default-export
export default function stripConstEnumsTransformer(program: ts.Program, config?: Partial<Options>): ts.TransformerFactory<ts.SourceFile> {
	return createTransformerFactory(program, config);
}

function createTransformerFactory(program: ts.Program, options?: Partial<Options>): ts.TransformerFactory<ts.SourceFile> {
	const fullOptions: Options = { ...defaultOptions, ...options };
	const typeChecker = program.getTypeChecker();
	const compilerOptions = program.getCompilerOptions();

	function getActualSymbol(symbol: ts.Symbol): ts.Symbol {
		if (symbol.flags & ts.SymbolFlags.Alias) {
			symbol = typeChecker.getAliasedSymbol(symbol);
		}

		return symbol;
	}

	function getNodeSymbol(node: ts.Node): ts.Symbol | null {
		const symbol = typeChecker.getSymbolAtLocation(node);
		if (symbol === undefined) {
			return null;
		}

		return getActualSymbol(symbol);
	}

	function getExportsForSourceFile(sourceFile: ts.SourceFile): ts.Symbol[] {
		const sourceFileSymbol = typeChecker.getSymbolAtLocation(sourceFile);
		if (sourceFileSymbol === undefined) {
			throw new Error(`Cannot find symbol ${sourceFile.fileName}`);
		}

		if (sourceFileSymbol.exports !== undefined) {
			const commonJsExport = sourceFileSymbol.exports.get(ts.InternalSymbolName.ExportEquals);
			if (commonJsExport !== undefined) {
				return [
					getActualSymbol(commonJsExport),
				];
			}
		}

		const result: ts.Symbol[] = typeChecker.getExportsOfModule(sourceFileSymbol);

		if (sourceFileSymbol.exports !== undefined) {
			const defaultExportSymbol = sourceFileSymbol.exports.get(ts.InternalSymbolName.Default);
			if (defaultExportSymbol !== undefined) {
				if (!result.includes(defaultExportSymbol)) {
					result.push(defaultExportSymbol);
				}
			}
		}

		return result.map((symbol: ts.Symbol) => getActualSymbol(symbol));
	}

	function hasModifier(node: ts.EnumDeclaration, modifier: ts.SyntaxKind): boolean {
		return node.modifiers !== undefined && node.modifiers.some((mod: ts.ModifierLike) => mod.kind === modifier);
	}

	if (!compilerOptions.preserveConstEnums) {
		// do nothing if preserveConstEnums disabled
		return () => (<T extends ts.Node>(node: T) => node);
	}

	const allExports = new Set<ts.Symbol>();
	for (const sourceFilePath of fullOptions.entrySourceFiles) {
		const sourceFile = program.getSourceFile(sourceFilePath);
		if (sourceFile === undefined) {
			throw new Error(`Cannot find source file ${sourceFilePath}`);
		}

		getExportsForSourceFile(sourceFile).forEach(allExports.add.bind(allExports));
	}

	return (context: ts.TransformationContext) => {
		function transformNodeAndChildren(node: ts.SourceFile, context: ts.TransformationContext): ts.SourceFile;
		function transformNodeAndChildren(node: ts.Node, context: ts.TransformationContext): ts.Node;
		function transformNodeAndChildren(node: ts.Node, context: ts.TransformationContext): ts.Node {
			return ts.visitEachChild(
				transformNode(node),
				(childNode: ts.Node) => transformNodeAndChildren(childNode, context),
				context
			);
		}

		function transformNode(node: ts.Node): ts.Node {
			if (!ts.isEnumDeclaration(node) || !hasModifier(node, ts.SyntaxKind.ConstKeyword)) {
				return node;
			}

			const enumSymbol = getNodeSymbol(node.name);
			if (enumSymbol === null) {
				return node;
			}

			const isExportedFromSourceFile = getExportsForSourceFile(node.getSourceFile()).includes(enumSymbol);
			const isExportedFromEntries = fullOptions.entrySourceFiles.length === 0 || allExports.has(enumSymbol);
			if (!isExportedFromSourceFile || !isExportedFromEntries) {
				return ts.factory.createEmptyStatement();
			}

			return node;
		}

		return (sourceFile: ts.SourceFile) => transformNodeAndChildren(sourceFile, context);
	};
}
