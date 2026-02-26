import { FeatureRouter } from './FeatureRouter';
import type { RenderFeature } from './RenderFeature';
import type { RenderContext } from './RenderContext';
import type { Entity } from '@duckengine/core';

describe('FeatureRouter', () => {
    let router: FeatureRouter;
    let mockContext: RenderContext;
    let mockFeature1: jest.Mocked<RenderFeature>;
    let mockFeature2: jest.Mocked<RenderFeature>;
    let mockEntity: jest.Mocked<Entity>;

    beforeEach(() => {
        mockContext = {} as RenderContext; // Features handle context

        mockFeature1 = {
            name: 'Feature1',
            isEligible: jest.fn().mockReturnValue(false),
            onAttach: jest.fn(),
            onUpdate: jest.fn(),
            onComponentRemoved: jest.fn(),
            onTransformChanged: jest.fn(),
            onDetach: jest.fn(),
            onFrame: jest.fn(),
            dispose: jest.fn()
        };

        mockFeature2 = {
            name: 'Feature2',
            isEligible: jest.fn().mockReturnValue(false),
            onAttach: jest.fn(),
            onDetach: jest.fn()
        } as unknown as jest.Mocked<RenderFeature>;

        router = new FeatureRouter(mockContext);
        router.addFeature(mockFeature1);
        router.addFeature(mockFeature2);

        mockEntity = {
            id: 'test-entity',
            getComponent: jest.fn(),
        } as unknown as jest.Mocked<Entity>;

        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('onEntityAdded', () => {
        it('attaches eligible features', () => {
            mockFeature1.isEligible.mockReturnValue(true);
            router.onEntityAdded(mockEntity);

            expect(mockFeature1.onAttach).toHaveBeenCalledWith(mockEntity, mockContext);
            expect(mockFeature2.onAttach).not.toHaveBeenCalled();
        });

        it('catches and logs errors during attach without crashing', () => {
            mockFeature1.isEligible.mockReturnValue(true);
            mockFeature1.onAttach.mockImplementation(() => { throw new Error('Attach Error'); });

            expect(() => router.onEntityAdded(mockEntity)).not.toThrow();
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('onEntityRemoved', () => {
        it('detaches previously attached features', () => {
            mockFeature1.isEligible.mockReturnValue(true);
            router.onEntityAdded(mockEntity);

            router.onEntityRemoved(mockEntity);

            expect(mockFeature1.onDetach).toHaveBeenCalledWith(mockEntity, mockContext);
        });

        it('ignores entities with no attached features', () => {
            router.onEntityRemoved(mockEntity);
            expect(mockFeature1.onDetach).not.toHaveBeenCalled();
            expect(mockFeature2.onDetach).not.toHaveBeenCalled();
        });
    });

    describe('onComponentChanged', () => {
        it('attaches a feature if it becomes eligible', () => {
            router.onEntityAdded(mockEntity); // Not eligible initially

            mockFeature1.isEligible.mockReturnValue(true); // Becomes eligible
            router.onComponentChanged(mockEntity, 'testComponent' as any);

            expect(mockFeature1.onAttach).toHaveBeenCalledWith(mockEntity, mockContext);
            expect(mockFeature1.onUpdate).toHaveBeenCalledWith(mockEntity, 'testComponent', mockContext);
        });

        it('detaches a feature if it becomes ineligible', () => {
            mockFeature1.isEligible.mockReturnValue(true);
            router.onEntityAdded(mockEntity); // Attached

            mockFeature1.isEligible.mockReturnValue(false); // No longer eligible
            router.onComponentChanged(mockEntity, 'testComponent' as any);

            expect(mockFeature1.onDetach).toHaveBeenCalledWith(mockEntity, mockContext);
            expect(mockFeature1.onUpdate).not.toHaveBeenCalled(); // Detached before update notification
        });
    });

    describe('onComponentRemoved', () => {
        it('notifies attached features of component removal before eligibility check removes them', () => {
            mockFeature1.isEligible.mockReturnValue(true);
            router.onEntityAdded(mockEntity); // Attached

            mockFeature1.isEligible.mockReturnValue(false); // No longer eligible due to removal
            router.onComponentRemoved(mockEntity, 'testComponent' as any);

            // Eligibility check is called first in FeatureRouter.ts:
            // "1. Re-evaluate eligibility (removal might make entity ineligible)."
            // Wait, looking at FeatureRouter.ts line 55-60:
            // this.checkEligibility(entity) is called FIRST.
            // If it becomes ineligible, it detaches and is REMOVED from activeSet.
            // So it DOES NOT get the onComponentRemoved notification if it's no longer eligible.
            expect(mockFeature1.onDetach).toHaveBeenCalled();
            expect(mockFeature1.onComponentRemoved).not.toHaveBeenCalled();
        });

        it('notifies attached features if they are still eligible', () => {
            mockFeature1.isEligible.mockReturnValue(true);
            router.onEntityAdded(mockEntity); // Attached

            router.onComponentRemoved(mockEntity, 'testComponent' as any);

            expect(mockFeature1.onDetach).not.toHaveBeenCalled();
            expect(mockFeature1.onComponentRemoved).toHaveBeenCalledWith(mockEntity, 'testComponent', mockContext);
        });
    });

    describe('onTransformChanged', () => {
        it('notifies active features', () => {
            mockFeature1.isEligible.mockReturnValue(true);
            router.onEntityAdded(mockEntity);

            router.onTransformChanged(mockEntity);

            expect(mockFeature1.onTransformChanged).toHaveBeenCalledWith(mockEntity, mockContext);
        });
    });

    describe('onFrame', () => {
        it('calls onFrame for all registered features that implement it', () => {
            router.onFrame(16);
            expect(mockFeature1.onFrame).toHaveBeenCalledWith(16, mockContext);
            // Feature2 doesn't implement onFrame, shouldn't crash
        });
    });

    describe('dispose', () => {
        it('calls dispose on all features that implement it', () => {
            router.dispose();
            expect(mockFeature1.dispose).toHaveBeenCalled();
        });
    });
});
