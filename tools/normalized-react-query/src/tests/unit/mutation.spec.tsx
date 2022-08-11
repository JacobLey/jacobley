import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, type WrapperComponent } from '@testing-library/react-hooks';
import { expect } from 'chai';
import type { Context } from 'mocha';
import type { ReactNode } from 'react';
import Sinon from 'sinon';
import { mutation } from '../../mutation.js';
import * as Api from '../data/api.js';

interface MutationTest extends Context {
    client: QueryClient;
    wrapper: WrapperComponent<{
        id: string;
        children?: ReactNode;
    }>;
}

export const MutationSpec = {

    beforeEach(this: MutationTest) {
        this.client = new QueryClient({
            logger: {
                error() {},
                log() {},
                warn() {},
            },
        });
        this.wrapper = ({ children }) => <QueryClientProvider client={this.client}>{children}</QueryClientProvider>;
    },

    afterEach() {
        Sinon.restore();
    },

    useMutation: {

        async success(this: MutationTest) {

            const mutateUser = mutation<Api.User, string, { age: number }>(
                {
                    getKey(id) {
                        return ['users', id];
                    },
                    async mutationFn(id, body) {
                        if (body.age < 0) {
                            throw new Error('Age must be >= 0');
                        }
                        return Api.updateUser(id, body);
                    },
                }
            );

            const { result, rerender } = renderHook(({ id }) => mutateUser.useMutation(id), {
                wrapper: this.wrapper,
                initialProps: { id: 'abc' },
            });

            expect(result.current.isIdle).to.equal(true);
            const user = await result.current.mutateAsync({ age: 42 });
            expect(user).to.contain({ id: 'abc', age: 42 });

            rerender();
            expect(result.current.isSuccess).to.equal(true);
            expect(result.current.data).to.eq(user);

            let error: unknown;
            try {
                await result.current.mutateAsync({ age: -1 });
            } catch (err) {
                error = err;
            }
            expect(error).to.haveOwnProperty('message', 'Age must be >= 0');
        },

        async onSuccess(this: MutationTest) {

            const onSuccess = Sinon.spy();
            const onSettled = Sinon.spy();

            const mutateUser = mutation<Api.User, string, { age: number }>(
                {
                    getKey(id) {
                        return ['users', id];
                    },
                    async mutationFn(id, body) {
                        return Api.updateUser(id, body);
                    },
                },
                {
                    onSuccess,
                    onSettled,
                }
            );

            const { result } = renderHook(({ id }) => mutateUser.useMutation(id), {
                wrapper: this.wrapper,
                initialProps: { id: 'abc' },
            });

            await result.current.mutateAsync({ age: 42 });

            expect(onSuccess.calledOnce).to.equal(true);
            expect(onSettled.calledOnce).to.equal(true);
        },

        async onError(this: MutationTest) {

            const onError = Sinon.spy();
            const onSettled = Sinon.spy();

            const mutateUser = mutation<Api.User, string, { age: number }>(
                {
                    getKey(id) {
                        return ['users', id];
                    },
                    async mutationFn() {
                        throw new Error('Invalid body');
                    },
                },
                {
                    onError,
                    onSettled,
                }
            );

            const { result, rerender } = renderHook(({ id }) => mutateUser.useMutation(id), {
                wrapper: this.wrapper,
                initialProps: { id: 'abc' },
            });

            expect(result.current.isIdle).to.equal(true);

            let error: unknown;
            try {
                await result.current.mutateAsync({ age: -1 });
            } catch (err) {
                error = err;
            }
            expect(error).to.haveOwnProperty('message', 'Invalid body');

            rerender();

            expect(result.current.isError).to.equal(true);
            expect(result.current.error).to.haveOwnProperty('message', 'Invalid body');

            expect(onError.calledOnce).to.equal(true);
            expect(onSettled.calledOnce).to.equal(true);
        },
    },
};
