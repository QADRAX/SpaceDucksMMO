import { Component } from "../../core/Component";
import type { ComponentMetadata } from "../../core/ComponentMetadata";
import type { ScriptSlot } from "./ScriptSlot";
import { createScriptSlot } from "./ScriptSlot";

export class ScriptComponent extends Component {
    readonly type = "script";
    readonly metadata: ComponentMetadata = {
        type: "script",
        label: "Scripts",
        description: "Allows attaching Lua scripts to define entity behavior.",
        category: "Scripting",
        icon: "FileCode", // Use a valid lucide icon name
        unique: true,
        requires: [],
        conflicts: [],
        inspector: {
            fields: [] // Custom UI handles slot lists
        }
    };

    scripts: ScriptSlot[] = [];

    constructor(params?: any) {
        super();
        if (params?.scripts && Array.isArray(params.scripts)) {
            this.scripts = params.scripts;
        }
    }

    addSlot(scriptId: string): string {
        const slot = createScriptSlot(scriptId);
        this.scripts.push(slot);
        this.reorderSlots();
        this.notifyChanged();
        return slot.slotId;
    }

    removeSlot(slotId: string) {
        this.scripts = this.scripts.filter(s => s.slotId !== slotId);
        this.notifyChanged();
    }

    getSlots(): ScriptSlot[] {
        return this.scripts;
    }

    reorderSlots() {
        this.scripts.sort((a, b) => {
            const orderDiff = a.executionOrder - b.executionOrder;
            return orderDiff !== 0 ? orderDiff : a.scriptId.localeCompare(b.scriptId);
        });
    }

    update(dt: number): void {
        // No-op: scripts are executed via ScriptSystem
    }
}

export default ScriptComponent;
