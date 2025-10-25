import { useEffect, useState, useRef } from 'react';
import { useQuery } from 'convex/react';
import { useNetwork } from '../providers/NetworkProvider';
import { SLOW_CONNECTION_TIMEOUT } from '../constants/constants';

interface UseNetworkAwareQueryOptions {
    query: any;
    args?: any;
    enabled?: boolean;
    retryDelay?: number;
    maxRetries?: number;
}

interface NetworkAwareQueryResult<T> {
    data: T | undefined;
    isLoading: boolean;
    isError: boolean;
    isOffline: boolean;
    isSlowConnection: boolean;
    retry: () => void;
    error: Error | null;
}

export function useNetworkAwareQuery<T>({
    query,
    args,
    enabled = true,
    retryDelay = 2000,
    maxRetries = 3,
}: UseNetworkAwareQueryOptions): NetworkAwareQueryResult<T> {
    const { isConnected, isInternetReachable, connectionType } = useNetwork();
    const [retryCount, setRetryCount] = useState(0);
    const [isSlowConnection, setIsSlowConnection] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const timeoutRef = useRef<number | null>(null);
    const slowConnectionTimeoutRef = useRef<number | null>(null);

    const convexQuery = useQuery(query, enabled ? args : "skip");

    // Detect slow connections
    useEffect(() => {
        if (convexQuery === undefined && enabled) {
            // Start slow connection detection timer
            slowConnectionTimeoutRef.current = setTimeout(() => {
                setIsSlowConnection(true);
            }, SLOW_CONNECTION_TIMEOUT);
        } else {
            // Clear slow connection timer when data loads
            if (slowConnectionTimeoutRef.current) {
                clearTimeout(slowConnectionTimeoutRef.current);
                slowConnectionTimeoutRef.current = null;
            }
            setIsSlowConnection(false);
        }

        return () => {
            if (slowConnectionTimeoutRef.current) {
                clearTimeout(slowConnectionTimeoutRef.current);
            }
        };
    }, [convexQuery, enabled]);

    // Handle retry logic
    const retry = () => {
        if (retryCount < maxRetries) {
            setRetryCount(prev => prev + 1);
            setError(null);
            setIsSlowConnection(false);
        }
    };

    // Auto-retry on network reconnection
    useEffect(() => {
        if (isConnected && isInternetReachable && retryCount > 0) {
            const timeout = setTimeout(() => {
                retry();
            }, retryDelay);

            return () => clearTimeout(timeout);
        }
    }, [isConnected, isInternetReachable, retryCount, retryDelay]);

    // Determine if we're offline
    const isOffline = !isConnected || isInternetReachable === false;

    // Determine loading state
    const isLoading = convexQuery === undefined && enabled && !isOffline;

    // Determine error state
    const isError = convexQuery === null || (retryCount >= maxRetries && convexQuery === undefined);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (slowConnectionTimeoutRef.current) {
                clearTimeout(slowConnectionTimeoutRef.current);
            }
        };
    }, []);

    return {
        data: convexQuery,
        isLoading,
        isError,
        isOffline,
        isSlowConnection,
        retry,
        error,
    };
}
