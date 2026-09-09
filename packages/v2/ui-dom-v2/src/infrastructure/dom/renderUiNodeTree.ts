import type { UiNode, UIRootLayout } from '@duckengine/core-v2';

/**
 * Applies normalized layout (0–1) as percentage CSS on a root element.
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
 * Renders a Duck UI node tree into a DOM parent (minimal default kit).
 */
export function renderUiNodeTree(
  parent: HTMLElement,
  node: UiNode | null | undefined,
  bindings: Readonly<Record<string, unknown>>,
): void {
  parent.replaceChildren();
  if (!node) return;
  parent.appendChild(createDomForNode(node, bindings));
}

function createDomForNode(
  node: UiNode,
  bindings: Readonly<Record<string, unknown>>,
): HTMLElement {
  const type = node.type;
  const props = node.props ?? {};
  const el = document.createElement(type === 'text' ? 'span' : 'div');
  if (node.id) el.dataset.uiId = node.id;
  el.dataset.uiType = type;

  switch (type) {
    case 'row':
      el.style.display = 'flex';
      el.style.flexDirection = 'row';
      el.style.alignItems = String(props.align ?? 'stretch');
      el.style.justifyContent = String(props.justify ?? 'flex-start');
      el.style.gap = typeof props.gap === 'number' ? `${props.gap * 100}%` : String(props.gap ?? '');
      break;
    case 'column':
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      el.style.alignItems = String(props.align ?? 'stretch');
      el.style.justifyContent = String(props.justify ?? 'flex-start');
      el.style.gap = typeof props.gap === 'number' ? `${props.gap * 100}%` : String(props.gap ?? '');
      break;
    case 'panel':
      el.style.background = String(props.background ?? 'rgba(0,0,0,0.45)');
      el.style.borderRadius = String(props.radius ?? '4px');
      el.style.padding = String(props.padding ?? '8px');
      break;
    case 'text': {
      const key = typeof props.bind === 'string' ? props.bind : undefined;
      const text =
        key && key in bindings
          ? String(bindings[key])
          : String(props.text ?? props.value ?? '');
      el.textContent = text;
      el.style.color = String(props.color ?? '#fff');
      el.style.fontSize = String(props.fontSize ?? '14px');
      break;
    }
    case 'button': {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = String(props.label ?? props.text ?? 'Button');
      btn.style.pointerEvents = 'auto';
      el.appendChild(btn);
      break;
    }
    case 'progress': {
      const valueKey = typeof props.bind === 'string' ? props.bind : undefined;
      const raw =
        valueKey && valueKey in bindings ? bindings[valueKey] : props.value;
      const value = typeof raw === 'number' ? raw : Number(raw ?? 0);
      const track = document.createElement('div');
      track.style.width = '100%';
      track.style.height = String(props.height ?? '8px');
      track.style.background = String(props.trackColor ?? 'rgba(255,255,255,0.2)');
      track.style.borderRadius = '4px';
      track.style.overflow = 'hidden';
      const fill = document.createElement('div');
      fill.style.height = '100%';
      fill.style.width = `${Math.max(0, Math.min(1, value)) * 100}%`;
      fill.style.background = String(props.color ?? '#4ade80');
      track.appendChild(fill);
      if (props.label != null) {
        const label = document.createElement('div');
        label.textContent = String(props.label);
        label.style.color = '#fff';
        label.style.fontSize = '12px';
        label.style.marginBottom = '4px';
        el.appendChild(label);
      }
      el.appendChild(track);
      break;
    }
    default:
      el.style.display = 'block';
      break;
  }

  if (typeof props.padding === 'number') {
    el.style.padding = `${props.padding * 100}%`;
  }

  for (const child of node.children ?? []) {
    el.appendChild(createDomForNode(child, bindings));
  }
  return el;
}
