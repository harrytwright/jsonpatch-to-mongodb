import { UpdateFilter } from 'mongodb'

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

export type UpdateDocument<Schema> = UpdateFilter<Schema>

export interface Options {
	updater: <Schema>(this: UpdateDocument<Schema>, patch: Operation) => void;
}

export default function <Schema>(patches: ReadonlyArray<Operation>, options?: Partial<Options>): UpdateDocument<Schema>

export function toDot(path: string): string
