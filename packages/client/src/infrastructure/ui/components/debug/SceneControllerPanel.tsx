/** @jsxImportSource preact */
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import type { ISceneController, IParametricController, ControlParameter } from '@client/domain/scene/ISceneController';
import './scene-controller-panel.css';

export interface SceneControllerPanelProps {
  controllers: ISceneController[];
}

/**
 * Debug panel for controlling scene controllers (camera, objects, etc.)
 * Displays all parametric controllers and their parameters
 */
export function SceneControllerPanel({ controllers }: SceneControllerPanelProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const parametricControllers = controllers.filter(
    c => 'getParameters' in c
  ) as IParametricController[];

  if (parametricControllers.length === 0) {
    return null;
  }

  const toggleExpanded = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div class="scene-controller-panel" style={{ background: 'rgba(20, 20, 30, 0.95)', border: '2px solid #4a90e2' }}>
      <div class="panel-header" style={{ color: '#4a90e2' }}>Scene Controllers</div>
      <div class="controllers-list">
        {parametricControllers.map(controller => (
          <ControllerCard
            key={controller.id}
            controller={controller}
            isExpanded={expanded[controller.id] || false}
            onToggle={() => toggleExpanded(controller.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface ControllerCardProps {
  controller: IParametricController;
  isExpanded: boolean;
  onToggle: () => void;
}

function ControllerCard({ controller, isExpanded, onToggle }: ControllerCardProps) {
  const [, forceUpdate] = useState({});

  const handleParameterChange = (param: ControlParameter, value: any) => {
    controller.setParameter(param.name, value);
    forceUpdate({}); // Force re-render
  };

  return (
    <div class="controller-card">
      <div class="controller-header" onClick={onToggle}>
        <span class="controller-name">{controller.name}</span>
        <div class="controller-actions">
          <button
            class="toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (controller.isEnabled()) {
                controller.disable();
              } else {
                controller.enable();
              }
              forceUpdate({});
            }}
          >
            {controller.isEnabled() ? '⏸' : '▶'}
          </button>
          <span class="expand-icon">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {isExpanded && (
        <div class="controller-body">
          {controller.getParameters().map(param => (
            <ParameterControl
              key={param.name}
              parameter={param}
              value={controller.getParameter(param.name)}
              onChange={(value) => handleParameterChange(param, value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ParameterControlProps {
  parameter: ControlParameter;
  value: any;
  onChange: (value: any) => void;
}

function ParameterControl({ parameter, value, onChange }: ParameterControlProps) {
  switch (parameter.type) {
    case 'boolean':
      return (
        <div class="param-control">
          <label>
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
            />
            <span>{parameter.label}</span>
          </label>
          {parameter.description && <div class="param-desc">{parameter.description}</div>}
        </div>
      );

    case 'number':
      return (
        <div class="param-control">
          <label>{parameter.label}</label>
          <div class="number-control">
            <input
              type="range"
              min={parameter.min}
              max={parameter.max}
              step={parameter.step}
              value={value}
              onInput={(e) => onChange(Number((e.target as HTMLInputElement).value))}
            />
            <input
              type="number"
              min={parameter.min}
              max={parameter.max}
              step={parameter.step}
              value={value}
              onChange={(e) => onChange(Number((e.target as HTMLInputElement).value))}
              class="number-input"
            />
          </div>
          {parameter.description && <div class="param-desc">{parameter.description}</div>}
        </div>
      );

    case 'select':
      return (
        <div class="param-control">
          <label>{parameter.label}</label>
          <select value={value} onChange={(e) => onChange((e.target as HTMLSelectElement).value)}>
            {parameter.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {parameter.description && <div class="param-desc">{parameter.description}</div>}
        </div>
      );

    case 'string':
    default:
      return (
        <div class="param-control">
          <label>{parameter.label}</label>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange((e.target as HTMLInputElement).value)}
          />
          {parameter.description && <div class="param-desc">{parameter.description}</div>}
        </div>
      );
  }
}

export default SceneControllerPanel;
