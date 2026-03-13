import { useState, useCallback } from 'react';

export function useFormState() {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reset = useCallback(() => {
        setSubmitting(false);
        setError(null);
    }, []);

    return {
        submitting,
        setSubmitting,
        error,
        setError,
        reset,
    };
}
