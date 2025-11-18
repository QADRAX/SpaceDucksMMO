import { useState, useRef } from "preact/hooks";
import "./slider.css";
import { Tooltip } from "../atoms";

type SliderProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  id?: string;
  disabled?: boolean;
  showTooltip?: boolean;
  formatValue?: (value: number) => string;
};

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  id,
  disabled,
  showTooltip = true,
  formatValue = (v) => v.toString(),
}: SliderProps) {
  const [showValue, setShowValue] = useState(false);
  const sliderRef = useRef<HTMLInputElement>(null);

  return (
    <div className="sd-slider-wrapper">
      <input
        ref={sliderRef}
        type="range"
        id={id}
        className="sd-slider"
        value={value}
        min={min}
        max={max}
        step={step}
        onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) => onChange(Number(e.currentTarget.value))}
        onMouseEnter={() => setShowValue(true)}
        onMouseLeave={() => setShowValue(false)}
        disabled={disabled}
      />
      {showTooltip && (
        <Tooltip visible={showValue} position="top">
          {formatValue(value)}
        </Tooltip>
      )}
    </div>
  );
}
