export type DefaultParams = null | void;
export type DefaultPage = string;

declare const emptyObject: unique symbol;
export interface EmptyObject {
    [emptyObject]?: never;
}

export type PaginatedData<Data, Page, Meta> = Meta & {
    data: Data[];
    nextPage: Page | null;
};
export type PaginatedParams<Params, Page> = {
    nextPage: Page | null;
} & (DefaultParams extends Params ? EmptyObject : Params);

export declare const typeCache: unique symbol;
