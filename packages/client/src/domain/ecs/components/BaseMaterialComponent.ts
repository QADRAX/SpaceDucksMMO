import { Component } from "../core/Component";

export abstract class BaseMaterialComponent extends Component {
  // marker base for all material components
  type: string = "BaseMaterial";
  metadata = { type: 'BaseMaterial' };
  
}

export default BaseMaterialComponent;
