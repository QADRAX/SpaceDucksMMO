import type { ScriptingSessionState } from '../session';

/** 
 * A SubsystemUseCase represents a specific piece of logic that operates on the
 * scripting session state.
 */
export interface SubsystemUseCase<TParams = void, TResult = void> {
    readonly name: string;
    readonly execute: (session: ScriptingSessionState, params: TParams) => TResult;
}

/**
 * Helper to define a typed scripting use case.
 */
export function defineSubsystemUseCase<TParams = void, TResult = void>(
    useCase: SubsystemUseCase<TParams, TResult>
): SubsystemUseCase<TParams, TResult> {
    return useCase;
}
