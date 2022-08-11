import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, type WrapperComponent } from '@testing-library/react-hooks';
import { expect } from 'chai';
import type { Context } from 'mocha';
import type { ReactNode } from 'react';
import Sinon from 'sinon';
import { resource } from '../../resource.js';
import * as Api from '../data/api.js';

interface ResourceTest extends Context {
    client: QueryClient;
    wrapper: WrapperComponent<{
        id: string;
        children?: ReactNode;
    }>;
}

export const ResourceSpec = {

    beforeEach(this: ResourceTest) {
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

    useQuery: {

        async success(this: ResourceTest) {

            const fetchUser = resource<Api.User, string>(
                {
                    getKey(id) {
                        return ['users', id];
                    },
                    async queryFn(id) {
                        return Api.getUser(id);
                    },
                }
            );

            const { result, rerender } = renderHook(({ id }) => fetchUser.useQuery(id), {
                wrapper: this.wrapper,
                initialProps: { id: 'abc' },
            });

            expect(result.current.data).to.equal(undefined);
            expect(result.current.isLoading).to.equal(true);

            while (fetchUser.getStatus(this.client, 'abc') === 'loading') {
                await Api.delayImmediate();
            }
            rerender();

            expect(result.current.isSuccess).to.equal(true);
            expect(result.current.data).to.contain({ id: 'abc' });
        },

        async onSuccess(this: ResourceTest) {

            const onSuccess = Sinon.spy();
            const onSettled = Sinon.spy();

            const fetchUser = resource<Api.User, string>(
                {
                    getKey(id) {
                        return ['users', id];
                    },
                    async queryFn(id) {
                        return Api.getUser(id);
                    },
                },
                {
                    onSuccess,
                    onSettled,
                }
            );

            const { result, rerender } = renderHook(({ id }) => fetchUser.useQuery(id), {
                wrapper: this.wrapper,
                initialProps: { id: 'abc' },
            });

            while (!onSuccess.calledOnce) {
                await Api.delayImmediate();
            }
            rerender();

            expect(result.current.isSuccess).to.equal(true);
            expect(result.current.data).to.contain({ id: 'abc' });
            expect(onSettled.calledOnce).to.equal(true);
        },

        async onError(this: ResourceTest) {

            const onError = Sinon.spy();
            const onSettled = Sinon.spy();

            const fetchUser = resource<Api.User, string>(
                {
                    getKey(id) {
                        return ['users', id];
                    },
                    async queryFn(id) {
                        throw new Error(`Invalid id: ${id}`);
                    },
                },
                {
                    onError,
                    onSettled,
                }
            );

            const { result, rerender } = renderHook(({ id }) => fetchUser.useQuery(id, { retry: false }), {
                wrapper: this.wrapper,
                initialProps: { id: 'abc' },
            });

            while (!onError.calledOnce) {
                await Api.delayImmediate();
            }
            rerender();

            expect(result.current.isError).to.equal(true);
            expect(result.current.data).to.equal(undefined);
            expect(result.current.error).to.haveOwnProperty('message', 'Invalid id: abc');
            expect(onSettled.calledOnce).to.equal(true);
        },
    },

    fetch: {

        async success(this: ResourceTest) {

            const onSuccess = Sinon.spy();
            const onSettled = Sinon.spy();

            const fetchUser = resource<Api.User, string>(
                {
                    getKey(id) {
                        return ['users', id];
                    },
                    async queryFn(id) {
                        if (id === 'xyz') {
                            throw new Error(`Invalid id: ${id}`);
                        }
                        return Api.getUser(id);
                    },
                },
                {
                    onSuccess,
                    onSettled,
                }
            );

            const user = await fetchUser.fetch(this.client, 'abc');
            expect(user).to.contain({ id: 'abc' });

            expect([
                onSuccess.callCount,
                onSettled.callCount,
            ]).to.deep.equal([1, 1]);

            const cachedUser = await fetchUser.fetch(this.client, 'abc', {
                staleTime: Number.POSITIVE_INFINITY,
            });
            expect(user).to.eq(cachedUser);

            expect([
                onSuccess.callCount,
                onSettled.callCount,
            ]).to.deep.equal([1, 1]);

            let error: unknown;
            try {
                await fetchUser.fetch(this.client, 'xyz');
            } catch (err) {
                error = err;
            }
            expect(error).to.haveOwnProperty('message', 'Invalid id: xyz');

            expect([
                onSuccess.callCount,
                onSettled.callCount,
            ]).to.deep.equal([1, 2]);
        },

        async onError(this: ResourceTest) {

            const onError = Sinon.spy();

            const fetchUser = resource<Api.User, string>(
                {
                    getKey(id) {
                        return ['users', id];
                    },
                    async queryFn(id) {
                        throw new Error(`Invalid id: ${id}`);
                    },
                },
                {
                    onError,
                }
            );

            let error: unknown;
            try {
                await fetchUser.fetch(this.client, 'xyz');
            } catch (err) {
                error = err;
            }
            expect(error).to.haveOwnProperty('message', 'Invalid id: xyz');

            expect(onError.callCount).to.equal(1);

            try {
                error = null;
                await fetchUser.fetch(this.client, 'xyz');
            } catch (err) {
                error = err;
            }
            expect(error).to.haveOwnProperty('message', 'Invalid id: xyz');

            expect(onError.callCount).to.equal(2);
        },
    },

    async getData(this: ResourceTest) {

        const onSuccess = Sinon.spy();
        const onSettled = Sinon.spy();

        const fetchSum = resource<number, [number, number]>(
            {
                getKey([a, b]) {
                    return ['sum', a, b];
                },
                async queryFn([a, b]) {
                    return a + b;
                },
            },
            {
                onSuccess,
                onSettled,
            }
        );

        expect(fetchSum.getStatus(this.client, [1, 2])).to.equal(null);

        await fetchSum.setData(this.client, [1, 2], 4);
        expect([
            onSuccess.callCount,
            onSettled.callCount,
        ]).to.deep.equal([1, 1]);

        expect(fetchSum.getStatus(this.client, [1, 2])).to.equal('success');

        await fetchSum.fetch(this.client, [1, 2], {
            staleTime: Number.POSITIVE_INFINITY,
        });
        expect([
            onSuccess.callCount,
            onSettled.callCount,
        ]).to.deep.equal([1, 1]);

        await fetchSum.setData(this.client, [3, 4], 10, {
            skipHooks: true,
        });
        expect([
            onSuccess.callCount,
            onSettled.callCount,
        ]).to.deep.equal([1, 1]);

        expect(fetchSum.getData(this.client, [1, 2])).to.equal(4);
        expect(fetchSum.getData(this.client, [2, 3])).to.equal(undefined);

        await fetchSum.invalidate(this.client, [1, 2]);
        expect(fetchSum.getData(this.client, [1, 2])).to.equal(4);

        await fetchSum.fetch(this.client, [1, 2]);
        expect(fetchSum.getData(this.client, [1, 2])).to.equal(3);

        await fetchSum.reset(this.client, [3, 4]);
        expect(fetchSum.getData(this.client, [3, 4])).to.equal(undefined);
    },
};
