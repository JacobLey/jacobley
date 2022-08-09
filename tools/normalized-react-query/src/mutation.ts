import {
    hashQueryKey,
    type MutationKey,
    type QueryClient,
    useMutation,
    type UseMutationResult,
    useQueryClient,
} from '@tanstack/react-query';
import { useMemo } from 'react';
import type { DefaultParams, typeCache } from './lib/types.js';

declare const typeCached: typeof typeCache;

/**
 * Abstract class for data manipulation. Wrapper around React Query mutations to enforce DRY code.
 *
 * All implementers should:
 * - Implement `getKey` method.
 * - Implement `mutationFn` method.
 * - Optionally implement handlers `onSuccess`, `onError`, and `onSettled`
 * - Create a single instance ("singleton") of class and export it.
 */
export abstract class Mutation<
    Data,
    Params = DefaultParams,
    Variables = DefaultParams
> {

    /**
     * Used to access type parameters.
     * See `QueryData`, `QueryParams`, and `QueryVariables`.
     *
     * __DO NOT USE__
     */
    declare public readonly [typeCached]: { data: Data; params: Params; variables: Variables };

    /**
     * React Hook for data manipulation. Wrapper around `useMutation`.
     *
     * @param {*} params - method params defined by class.
     * @returns {object} useMutation response.
     */
    public useMutation(params: Params): UseMutationResult<Data, unknown, Variables> {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const client = useQueryClient();
        const mutationKey = this.getKey(params);

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [mutationFn, onSuccess, onError, onSettled] = useMemo(() => [
            async (variables: Variables) => this.mutationFn(params, variables),
            async (data: Data, variables: Variables) => this.onSuccess(client, params, data, variables),
            async (error: unknown, variables: Variables) => this.onError(client, params, error, variables),
            async (
                data: Data | undefined,
                error: unknown,
                variables: Variables
            ) => this.onSettled(client, params, data, error, variables),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        ], [hashQueryKey(mutationKey)]);

        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useMutation<Data, unknown, Variables>(mutationKey, mutationFn, {
            onSuccess,
            onError,
            onSettled,
        });
    }

    /**
     * `onSuccess` handler for mutations.
     *
     * Default behavior is NOOP.
     *
     * @param {QueryClient} client - query client
     * @param {*} params - method params defined by class.
     * @param {*} data - response from mutation.
     * @param {*} variables - variables provided directly to mutation
     * @returns {Promise} success handled
     */
    protected async onSuccess(client: QueryClient, params: Params, data: Data, variables: Variables): Promise<void>;
    /**
     * @override
     */
    protected async onSuccess(): Promise<void> {}

    /**
     * `onError` handler for mutations.
     *
     * Default behavior is NOOP.
     *
     * @param {QueryClient} client - query client
     * @param {*} params - method params defined by class.
     * @param {*} error - error from mutation.
     * @param {*} variables - variables provided directly to mutation
     * @returns {Promise} error handled
     */
    protected async onError(client: QueryClient, params: Params, error: unknown, variables: Variables): Promise<void>;
    /**
     * @override
     */
    protected async onError(): Promise<void> {}

    /**
     * `onSettled` handler for mutations.
     *
     * Default behavior is NOOP.
     *
     * @param {QueryClient} client - query client
     * @param {*} params - method params defined by class.
     * @param {*} data - response from mutation (if successful).
     * @param {*} error - error from mutation (if error).
     * @param {*} variables - variables provided directly to mutation
     * @returns {Promise} settle handled
     */
    protected async onSettled(
        client: QueryClient,
        params: Params,
        data: Data | undefined,
        error: unknown,
        variables: Variables
    ): Promise<void>;
    /**
     * @override
     */
    protected async onSettled(): Promise<void> {}

    /**
     * __MUST BE IMPLEMENTED BY CHILD CLASS__
     *
     * Method to generate the `mutationKey` for React Query.
     * Ideally is structured to match target API.
     *
     * Not related to `queryKey`s (i.e. can have overlap).
     *
     * @param {*} params - method params defined by class.
     * @returns {*[]} - query key array.
     */
    protected abstract getKey(params: Params): MutationKey;

    /**
     * __MUST BE IMPLEMENTED BY CHILD CLASS__
     *
     * `mutationFn` that is called by React Query.
     * Any data loading and parsing should be implemented here.
     *
     * @param {*} params - method params defined by class.
     * @returns {Promise<*>} function that will be called by React Query for data loading.
     */
    protected abstract mutationFn(params: Params, variables: Variables): Promise<Data>;
}

/**
 * Create a "mutation" without the class/instance syntax.
 *
 * See Mutation class for implementation details.
 *
 * @param {object} params - params
 * @param {Function} params.getKey - getKey
 * @param {Function} params.mutationFn - mutationFn
 * @param {object} [options] - options
 * @param {Function} [options.onSuccess] - onSuccess handler
 * @param {Function} [options.onError] - onError handler
 * @param {Function} [options.onSettled] - onSettled handler
 * @returns {object} typed mutation
 */
export const mutation = <
    Data,
    Params = DefaultParams,
    Variables = DefaultParams
>(
    params: {
        getKey: Mutation<Data, Params, Variables>['getKey'];
        mutationFn: Mutation<Data, Params, Variables>['mutationFn'];
    },
    options: {
        onSuccess?: Mutation<Data, Params, Variables>['onSuccess'];
        onError?: Mutation<Data, Params, Variables>['onError'];
        onSettled?: Mutation<Data, Params, Variables>['onSettled'];
    } = {}
// eslint-disable-next-line jsdoc/require-jsdoc
): Mutation<Data, Params, Variables> => new class extends Mutation<Data, Params, Variables> {
    protected getKey = params.getKey;
    protected mutationFn = params.mutationFn;
    static {
        if (options.onSuccess) {
            this.prototype.onSuccess = options.onSuccess;
        }
        if (options.onError) {
            this.prototype.onError = options.onError;
        }
        if (options.onSettled) {
            this.prototype.onSettled = options.onSettled;
        }
    }
}();
