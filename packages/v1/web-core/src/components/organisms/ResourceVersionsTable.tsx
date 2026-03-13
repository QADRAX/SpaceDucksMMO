'use client';

import * as React from 'react';

import { Button } from '@/components/atoms/Button';
import { CheckIcon, PencilIcon, TrashIcon } from '@/components/icons';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/organisms/Table';

type BaseVersion = {
  id: string;
  version: number;
};

export function ResourceVersionsTable<TVersion extends BaseVersion>({
  versions,
  activeVersion,
  onSetActive,
  onEdit,
  onDelete,
  deleteDisabled,
  deleteTitle,
  extraHeaders,
  renderExtraCells,
  containerClassName,
}: {
  versions: TVersion[];
  activeVersion: number;
  onSetActive: (version: number) => void | Promise<void>;
  onEdit?: (version: TVersion) => void;
  onDelete?: (version: number) => void | Promise<void>;
  deleteDisabled?: (v: TVersion) => boolean;
  deleteTitle?: (v: TVersion) => string;
  extraHeaders?: React.ReactNode[];
  renderExtraCells?: (v: TVersion) => React.ReactNode[];
  containerClassName?: string;
}) {
  const hasEdit = typeof onEdit === 'function';
  const hasDelete = typeof onDelete === 'function';

  return (
    <Table containerClassName={containerClassName}>
      <TableHeader>
        <TableRow>
          <TableHead>Version</TableHead>
          {(extraHeaders ?? []).map((h, idx) => (
            <TableHead key={idx}>{h}</TableHead>
          ))}
          <TableHead>Active</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {versions.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3 + (extraHeaders?.length ?? 0)}>
              <p className="text-neutral-600">No versions yet.</p>
            </TableCell>
          </TableRow>
        ) : (
          versions.map((v) => {
            const isActive = activeVersion === v.version;
            const extraCells = renderExtraCells ? renderExtraCells(v) : [];
            const isDeleteDisabled = deleteDisabled ? deleteDisabled(v) : false;
            const deleteTitleValue = deleteTitle ? deleteTitle(v) : 'Delete';

            return (
              <TableRow key={v.id}>
                <TableCell>v{v.version}</TableCell>
                {extraCells.map((cell, idx) => (
                  <TableCell key={idx}>{cell}</TableCell>
                ))}
                <TableCell>{isActive ? '✓' : ''}</TableCell>
                <TableCell>
                  <div className="flex flex-nowrap items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0"
                      onClick={() => (isActive ? undefined : onSetActive(v.version))}
                      disabled={isActive}
                      aria-label={isActive ? 'Active version' : `Set v${v.version} as active`}
                      title={isActive ? 'Active' : 'Set active'}
                    >
                      <CheckIcon className="h-4 w-4" />
                    </Button>

                    {hasEdit ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0"
                        onClick={() => onEdit!(v)}
                        aria-label={`Edit v${v.version}`}
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                    ) : null}

                    {hasDelete ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                        onClick={() => (isDeleteDisabled ? undefined : onDelete!(v.version))}
                        aria-label={`Delete v${v.version}`}
                        title={deleteTitleValue}
                        disabled={isDeleteDisabled}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
