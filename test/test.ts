class Class1 {
    public method1(): boolean {
        return false;
    }
}
class Class2 extends Class1 {
    public method2(): boolean {
        return true;
    }
}
const c1 = new Class1();
console.log(c1.method1());
const c2 = new Class2();
console.log(c2.method1());
console.log(c2.method2());
