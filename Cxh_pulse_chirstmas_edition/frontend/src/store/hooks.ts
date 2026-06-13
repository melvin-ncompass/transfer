import type { TypedUseSelectorHook} from 'react-redux';
import { useDispatch, useSelector } from 'react-redux';

import type { RootState, AppDispatch } from './store';

/**
 * Typed version of useDispatch hook
 * 
 * Use this instead of plain useDispatch to get TypeScript autocomplete
 * for dispatching actions
 * 
 * @example
 * ```tsx
 * const dispatch = useAppDispatch();
 * dispatch(loginUser({ email, password }));
 * ```
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed version of useSelector hook
 * 
 * Use this instead of plain useSelector to get TypeScript autocomplete
 * for accessing Redux state
 * 
 * @example
 * ```tsx
 * const user = useAppSelector((state) => state.auth.user);
 * const isAuthenticated = useAppSelector(selectIsAuthenticated);
 * ```
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
