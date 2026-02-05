'use client';

import { PageHeader } from '@/components/organisms/PageHeader';
import { Card } from '@/components/molecules/Card';

export default function ScenesPage() {
  return (
    <div>
      <PageHeader
        title="Scenes"
        description="Scene persistence and web-based scene editing (WIP)"
      />

      <Card>
        <div className="p-6">
          <p className="text-neutral-700">
            The scene editor and ECS persistence are not implemented yet.
          </p>
          <p className="text-neutral-600 text-sm mt-2">
            Next step: define the ECS scene format (entities/components), then add CRUD APIs and an editor UI.
          </p>
        </div>
      </Card>
    </div>
  );
}
