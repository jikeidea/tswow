import { Objectified, Objects } from "../serialization/ObjectIteration";
import { CellSystemTop } from "../systems/CellSystem";
import { Cell, CellWrapper } from "./Cell";
import { CellReadOnly, CellWrapperReadOnly } from "./CellReadOnly";

export class EnumCellReadOnly<T> extends CellWrapperReadOnly<number,T> {
    value(index: number): EnumValueReadOnly<T> {
        return new EnumValueReadOnly(this.owner, this, index);
    }

    objectify() {
        let enums = Objects.mapObject(this,['object'],(k,v)=>v.isEnum);
        for(const [key,value] of Object.entries(enums)) {
            if(value.is()) return key;
        }
        return this.cell.get();
    }
}

export class EnumValueReadOnly<T> {
    protected owner: T;
    protected cell: CellReadOnly<number,any>
    protected index: number;
    protected get isEnum() { return true; }

    constructor(owner: T, cell: EnumCellReadOnly<T>, index: number) {
        this.owner = owner;
        this.cell = cell;
        this.index = index;
    }

    is() {
        return this.cell.get() === this.index;
    }

    protected set() {
        CellReadOnly.set(this.cell,this.index);
        return this.owner;
    }
}

export class EnumCell<T> extends EnumCellReadOnly<T> {
    value(index: number, setCallback?: ()=>void): EnumValue<T> {
        return new EnumValue(this.owner, this, index, setCallback);
    }

    set(value: number) { return super.set(value); }
}

export class EnumValue<T> extends EnumValueReadOnly<T>{
    protected get isEnum() { return true; }
    private setCallback?: ()=>void

    constructor(owner: T, cell: EnumCell<T>, index: number, setCallback?: ()=>void) {
        super(owner,cell,index);
        this.setCallback = setCallback;
    }

    set() {
        super.set();
        if(this.setCallback) this.setCallback();
        return this.owner;
    }
}

function enumCellTransformGetSelection(transform: any) {
    return Object
        .entries(
            Objects.mapObject(transform, ['object'], (_,v)=>v.isEnum)
        )
        .map(([name,cell])=>({name,cell}))
        .find(({name,cell})=>cell.is())
        || {name:undefined,cell:undefined}
}

function verifyAs(value1: number, value2: number) {
    if(value1 !== value2) {
        throw new Error(
            `Tried accessing enum as ${value1},`
          + ` but value is ${value2}`
      )
    }
}

export class EnumCellTransform<T extends Objectified> extends CellWrapper<number,T> {
    value<V extends Objectified>(index: number, transformer: (t: T)=>V): EnumValueTransform<T,V> {
        return new EnumValueTransform(this.owner, this, index, transformer);
    }

    plain_value(index: number) {
        return new EnumValueTransform(this.owner, this, index, (t)=>t);
    }

    private getSelection():
        {     name: string|undefined
            , cell: EnumValueTransform<T,any>|undefined
        }
    {
        return enumCellTransformGetSelection(this);
    }

    objectify() {
        const {name} = this.getSelection();
        return name === undefined ? this.cell.get() : name;
    }

    static getSelection(transformEnum: EnumCellTransform<any>) {
        return transformEnum.getSelection();
    }
}

export class EnumValueTransform<T extends Objectified,V extends Objectified> {
    private owner: T;
    private cell: Cell<number,any>
    private index: number;
    protected get isEnum() { return true; }
    protected transformer: (t: T)=>V;

    constructor(owner: T, cell: EnumCellTransform<T>, index: number, transformer: (t: T)=>V) {
        this.owner = owner;
        this.cell = cell;
        this.index = index;
        this.transformer = transformer;
    }

    is() {
        return this.cell.get() === this.index;
    }

    set() {
        this.cell.set(this.index);
        return this.transformer(this.owner);
    }

    as() {
        verifyAs(this.index, this.cell.get())
        return this.transformer(this.owner);
    }
}

export abstract class TransformedClass<T> extends CellSystemTop {
    protected abstract transformer(): EnumCellTransform<any>
    protected abstract default(): T;

    protected objectifyParent() {
        return Objects.objectifyObj(this);
    }

    objectify() {
        let {cell} = EnumCellTransform.getSelection(this.transformer());
        if(cell === undefined) {
            return this.objectifyParent();
        }
        return cell.as().objectifyParent();
    }
}

export class EnumCellTransformReadOnly<T extends Objectified> extends CellWrapperReadOnly<number,T> {
    value<V extends Objectified>(index: number, transformer: (t: T)=>V): EnumValueTransformReadOnly<T,V> {
        return new EnumValueTransformReadOnly(this.owner, this, index, transformer);
    }

    plain_value(index: number) {
        return new EnumValueTransformReadOnly(this.owner, this, index, (t)=>t);
    }

    private getSelection():
        {     name: string|undefined
            , cell: EnumValueTransformReadOnly<T,any>|undefined
        }
    {
        return enumCellTransformGetSelection(this)
    }

    objectify() {
        const {name} = this.getSelection();
        return name === undefined ? this.cell.get() : name;
    }

    static getSelection(transformEnum: EnumCellTransformReadOnly<any>) {
        return transformEnum.getSelection();
    }
}

export class EnumValueTransformReadOnly<T extends Objectified,V extends Objectified> {
    private owner: T;
    private cell: CellReadOnly<number,any>
    private index: number;
    protected get isEnum() { return true; }
    protected transformer: (t: T)=>V;

    constructor(owner: T, cell: EnumCellTransformReadOnly<T>, index: number, transformer: (t: T)=>V) {
        this.owner = owner;
        this.cell = cell;
        this.index = index;
        this.transformer = transformer;
    }

    is() {
        return this.cell.get() === this.index;
    }

    as() {
        verifyAs(this.index, this.cell.get())
        return this.transformer(this.owner);
    }
}

export abstract class TransformedClassReadOnly<T> extends CellSystemTop {
    protected abstract transformer(): EnumCellTransformReadOnly<any>
    protected abstract default(): T;

    protected objectifyParent() {
        return Objects.objectifyObj(this);
    }

    objectify() {
        let {cell} = EnumCellTransformReadOnly.getSelection(this.transformer());
        if(cell === undefined) {
            return this.objectifyParent();
        }
        return cell.as().objectifyParent();
    }
}