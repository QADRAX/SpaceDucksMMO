describe('Environment Diagnostic', () => {
    it('should have WebAssembly', () => {
        console.log('Environment:', typeof window !== 'undefined' ? 'jsdom' : 'node');
        console.log('WebAssembly type:', typeof WebAssembly);
        expect(typeof WebAssembly).toBe('object');
    });
});
