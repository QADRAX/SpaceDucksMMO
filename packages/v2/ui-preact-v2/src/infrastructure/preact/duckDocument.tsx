import type { UIRootLayout, UiNode, UIViewEvent } from '@duckengine/core-v2';
import { h, type ComponentChild } from 'preact';

/** Props for rendering a Duck document tree with Preact. */
export interface DuckDocumentProps {
  readonly node: UiNode | null | undefined;
  readonly bindings: Readonly<Record<string, unknown>>;
  readonly onEvent?: (event: Omit<UIViewEvent, 'entityId' | 'viewportId'>) => void;
}

/**
 * Applies normalized layout (0–1) as percentage CSS on a host element.
 */
export function applyUiRootLayout(el: HTMLElement, layout: UIRootLayout): void {
  const { rect, zIndex, rotation } = layout;
  el.style.position = 'absolute';
  el.style.left = `${rect.x * 100}%`;
  el.style.top = `${rect.y * 100}%`;
  el.style.width = `${rect.w * 100}%`;
  el.style.height = `${rect.h * 100}%`;
  el.style.zIndex = String(zIndex);
  el.style.boxSizing = 'border-box';
  el.style.pointerEvents = 'auto';
  if (rotation) {
    el.style.transform = `rotate(${rotation}rad)`;
    el.style.transformOrigin = 'top left';
  } else {
    el.style.transform = '';
  }
}

/**
 * Renders a Duck {@link UiNode} tree as Preact VNodes (default kit).
 */
export function renderDuckNode(
  node: UiNode,
  bindings: Readonly<Record<string, unknown>>,
  onEvent?: DuckDocumentProps['onEvent'],
): ComponentChild {
  const type = node.type;
  const props = node.props ?? {};
  const children = (node.children ?? []).map((c) => renderDuckNode(c, bindings, onEvent));

  const emit = (eventName: string, payload?: unknown) => {
    onEvent?.({ targetId: node.id, eventName, payload });
  };

  switch (type) {
    case 'row':
      return h(
        'div',
        {
          'data-ui-id': node.id,
          'data-ui-type': type,
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: String(props.align ?? 'stretch'),
            justifyContent: String(props.justify ?? 'flex-start'),
            gap: typeof props.gap === 'number' ? `${props.gap * 100}%` : String(props.gap ?? ''),
          },
        },
        ...children,
      );
    case 'column':
      return h(
        'div',
        {
          'data-ui-id': node.id,
          'data-ui-type': type,
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: String(props.align ?? 'stretch'),
            justifyContent: String(props.justify ?? 'flex-start'),
            gap: typeof props.gap === 'number' ? `${props.gap * 100}%` : String(props.gap ?? ''),
          },
        },
        ...children,
      );
    case 'panel':
      return h(
        'div',
        {
          'data-ui-id': node.id,
          'data-ui-type': type,
          style: {
            background: String(props.background ?? 'rgba(0,0,0,0.45)'),
            borderRadius: String(props.radius ?? '4px'),
            padding: String(props.padding ?? '8px'),
          },
        },
        ...children,
      );
    case 'text': {
      const key = typeof props.bind === 'string' ? props.bind : undefined;
      const text =
        key && key in bindings
          ? String(bindings[key])
          : String(props.text ?? props.value ?? '');
      return h(
        'span',
        {
          'data-ui-id': node.id,
          'data-ui-type': type,
          style: {
            color: String(props.color ?? '#fff'),
            fontSize: String(props.fontSize ?? '14px'),
          },
        },
        text,
      );
    }
    case 'button':
      return h(
        'button',
        {
          type: 'button',
          'data-ui-id': node.id,
          'data-ui-type': type,
          style: { pointerEvents: 'auto' },
          onClick: () => emit('click'),
        },
        String(props.label ?? props.text ?? 'Button'),
      );
    case 'progress': {
      const valueKey = typeof props.bind === 'string' ? props.bind : undefined;
      const raw = valueKey && valueKey in bindings ? bindings[valueKey] : props.value;
      const value = typeof raw === 'number' ? raw : Number(raw ?? 0);
      const fill = h('div', {
        style: {
          height: '100%',
          width: `${Math.max(0, Math.min(1, value)) * 100}%`,
          background: String(props.color ?? '#4ade80'),
        },
      });
      const track = h(
        'div',
        {
          style: {
            width: '100%',
            height: String(props.height ?? '8px'),
            background: String(props.trackColor ?? 'rgba(255,255,255,0.2)'),
            borderRadius: '4px',
            overflow: 'hidden',
          },
        },
        fill,
      );
      const parts: ComponentChild[] = [];
      if (props.label != null) {
        parts.push(
          h(
            'div',
            { style: { color: '#fff', fontSize: '12px', marginBottom: '4px' } },
            String(props.label),
          ),
        );
      }
      parts.push(track);
      return h('div', { 'data-ui-id': node.id, 'data-ui-type': type }, ...parts);
    }
    case 'image':
      return h('img', {
        'data-ui-id': node.id,
        'data-ui-type': type,
        src: String(props.src ?? props.url ?? ''),
        alt: String(props.alt ?? ''),
        style: {
          maxWidth: '100%',
          height: 'auto',
          display: 'block',
        },
      });
    default:
      return h('div', { 'data-ui-id': node.id, 'data-ui-type': type }, ...children);
  }
}

/**
 * Top-level Preact tree for a Duck UI document.
 */
export function DuckDocument(props: DuckDocumentProps): ComponentChild {
  if (!props.node) return null;
  return renderDuckNode(props.node, props.bindings, props.onEvent);
}
