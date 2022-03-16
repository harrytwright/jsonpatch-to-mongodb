declare module "jsonpatch-to-mongodb" {
	export interface BaseOperation {
		path: string;
	}

	export interface AddOperation<T> extends BaseOperation {
		op: 'add';
		value: T;
	}

	export interface RemoveOperation extends BaseOperation {
		op: 'remove';
	}

	export interface ReplaceOperation<T> extends BaseOperation {
		op: 'replace';
		value: T;
	}

	export interface MoveOperation extends BaseOperation {
		op: 'move';
		from: string;
	}

	export interface CopyOperation extends BaseOperation {
		op: 'copy';
		from: string;
	}

	export type Operation = AddOperation<any> | RemoveOperation | ReplaceOperation<any> | MoveOperation | CopyOperation;

	export function toDot(path: string): string

	export interface UpdateDocument {
		$unset: object
		$push: object
		$set: object
	}

	export interface Options {
		customKeys: Map<string|RegExp, (patch: Operation, updater: Partial<UpdateDocument>) => Partial<UpdateDocument>>;
	}

	export default function (patches: ReadonlyArray<Operation>, options?: Options): Partial<UpdateDocument>
}
