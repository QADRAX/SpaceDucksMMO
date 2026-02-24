import { Component } from "../../core/Component";
import type { ComponentMetadata } from "../../core/ComponentMetadata";
import type { ScriptSlot } from "./ScriptSlot";

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

    addSlot(slot: ScriptSlot) {
        this.scripts.push(slot);
        this.reorderSlots();
        this.notifyChanged();
    }

    removeSlot(slotId: string) {
        this.scripts = this.scripts.filter(s => s.slotId !== slotId);
        this.notifyChanged();
    }

    getSlots(): ScriptSlot[] {
        return this.scripts;
    }

    reorderSlots() {
        this.scripts.sort((a, b) => a.executionOrder - b.executionOrder);
    }

    update(dt: number): void {
        // No-op: scripts are executed via ScriptSystem
    }
}

export default ScriptComponent;
