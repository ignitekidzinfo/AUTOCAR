package com.ProblemSolvings.Problem.Solving.Problems;

class Parent {
   Parent m1() {
       return new Parent();
   }

    public static void main(String[] args) {
        Parent s = new Parent();
        s.m1();
    }

}

class Child extends Parent {

    @Override
    Child m1() {
        return new Child();
    }
}
